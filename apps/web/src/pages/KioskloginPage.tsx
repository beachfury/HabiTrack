// apps/web/src/pages/KioskLoginPage.tsx
// Kiosk welcome / action board — always-visible member cards, weather, meal, live clock
// No login required to view; PIN required to complete tasks or log into full app

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sun, CloudRain, CloudSnow, Cloud, Wind, Utensils, ChefHat } from 'lucide-react';
import { api } from '../api';
import { useDayRollover } from '../hooks';
import { MemberCard } from '../components/kiosk/MemberCard';
import { KioskPinModal } from '../components/kiosk/KioskPinModal';
import type { KioskBoardMember, KioskMealItem } from '../api/kiosk';

// ---------------------------------------------------------------------------
// Weather helpers (Open-Meteo WMO codes)
// ---------------------------------------------------------------------------

function getConditionFromCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow Showers';
  return 'Thunderstorm';
}

function WeatherIcon({ condition, size = 20 }: { condition: string; size?: number }) {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
    return <CloudRain size={size} className="text-blue-400" />;
  if (c.includes('snow'))
    return <CloudSnow size={size} className="text-blue-200" />;
  if (c.includes('cloud') || c.includes('fog'))
    return <Cloud size={size} className="text-gray-400" />;
  if (c.includes('wind'))
    return <Wind size={size} className="text-gray-400" />;
  return <Sun size={size} className="text-yellow-400" />;
}

interface DayForecast {
  date: string;
  dayLabel: string;
  weatherCode: number;
  condition: string;
  high: number;
  low: number;
}

// ---------------------------------------------------------------------------
// PIN request state
// ---------------------------------------------------------------------------

interface PinRequest {
  mode: 'login' | 'complete-chore' | 'complete-paid-chore';
  userId: number;
  userName: string;
  userColor: string | null;
  userAvatar: string | null;
  choreInstanceId?: number;
  paidChoreId?: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function KioskLoginPage() {
  const navigate = useNavigate();

  // Board state
  const [members, setMembers] = useState<KioskBoardMember[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [meal, setMeal] = useState<KioskMealItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Weather state
  const [forecast, setForecast] = useState<DayForecast[]>([]);

  // Live clock
  const [now, setNow] = useState(new Date());

  // PIN modal
  const [pinRequest, setPinRequest] = useState<PinRequest | null>(null);

  // Completion feedback toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Polling refs
  const boardPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const weatherPollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Midnight auto-reload
  useDayRollover();

  // ---------------------------------------------------------------------------
  // Live clock (updates every second)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch board data
  // ---------------------------------------------------------------------------
  const fetchBoard = useCallback(async () => {
    try {
      const data = await api.getKioskBoard();
      setMembers(data.members);
      setDateStr(data.date);
      setMeal(data.meal);
      setError('');
    } catch (err) {
      console.error('Failed to fetch board:', err);
      setError('Failed to load board data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
    boardPollRef.current = setInterval(fetchBoard, 30_000);
    return () => {
      if (boardPollRef.current) clearInterval(boardPollRef.current);
    };
  }, [fetchBoard]);

  // ---------------------------------------------------------------------------
  // Fetch 7-day weather forecast (Open-Meteo free API)
  // ---------------------------------------------------------------------------
  const fetchWeather = useCallback(async () => {
    try {
      let lat: number | undefined;
      let lon: number | undefined;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 300000,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
        } catch {
          // geolocation denied/unavailable — use default
        }
      }

      // Fallback: central US
      if (!lat || !lon) {
        lat = 39.8283;
        lon = -98.5795;
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();

      if (data.daily) {
        const days: DayForecast[] = data.daily.time.map((date: string, i: number) => {
          const d = new Date(date + 'T00:00:00');
          const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' });
          const code = data.daily.weather_code[i] ?? 0;
          return {
            date,
            dayLabel,
            weatherCode: code,
            condition: getConditionFromCode(code),
            high: Math.round(data.daily.temperature_2m_max[i] ?? 0),
            low: Math.round(data.daily.temperature_2m_min[i] ?? 0),
          };
        });
        setForecast(days);
      }
    } catch (err) {
      console.error('Weather fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    weatherPollRef.current = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      if (weatherPollRef.current) clearInterval(weatherPollRef.current);
    };
  }, [fetchWeather]);

  // ---------------------------------------------------------------------------
  // Determine points leader
  // ---------------------------------------------------------------------------
  const leaderId = members.length > 0
    ? members.reduce((best, m) => (m.totalPoints > best.totalPoints ? m : best), members[0]).id
    : -1;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Avatar tap → login mode
  const handleAvatarTap = useCallback((member: KioskBoardMember) => {
    setPinRequest({
      mode: 'login',
      userId: member.id,
      userName: member.nickname || member.displayName,
      userColor: member.color,
      userAvatar: member.avatarUrl,
    });
  }, []);

  // Chore tap → complete-chore mode
  const handleChoreComplete = useCallback((member: KioskBoardMember, choreInstanceId: number) => {
    setPinRequest({
      mode: 'complete-chore',
      userId: member.id,
      userName: member.nickname || member.displayName,
      userColor: member.color,
      userAvatar: member.avatarUrl,
      choreInstanceId,
    });
  }, []);

  // Paid chore tap → complete-paid-chore mode
  const handlePaidChoreComplete = useCallback((member: KioskBoardMember, paidChoreId: string) => {
    setPinRequest({
      mode: 'complete-paid-chore',
      userId: member.id,
      userName: member.nickname || member.displayName,
      userColor: member.color,
      userAvatar: member.avatarUrl,
      paidChoreId,
    });
  }, []);

  // PIN success
  const handlePinSuccess = useCallback(
    (result?: any) => {
      if (!pinRequest) return;

      if (pinRequest.mode === 'login') {
        // Logged in — navigate to full app home
        navigate('/');
      } else {
        // Task completed — show feedback and refresh board
        if (result?.awaitsApproval) {
          showToast('Done! Waiting for approval.');
        } else if (result?.pointsAwarded) {
          const bonus = result.bonusPoints ? ` (+${result.bonusPoints} bonus)` : '';
          showToast(`+${result.pointsAwarded} points${bonus}!`);
        } else if (result?.message) {
          showToast(result.message);
        } else {
          showToast('Task completed!');
        }
        fetchBoard();
      }

      setPinRequest(null);
    },
    [pinRequest, navigate, showToast, fetchBoard],
  );

  const handlePinClose = useCallback(() => {
    setPinRequest(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  const formatDate = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' });

  // Grid columns based on member count
  const gridCols =
    members.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : members.length <= 4
        ? 'grid-cols-2 lg:grid-cols-4'
        : members.length <= 6
          ? 'grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  // Meal display
  const mealText = meal
    ? meal.isFendForYourself
      ? meal.ffyMessage || 'Fend For Yourself'
      : meal.recipeName || meal.customMealName || 'Meal planned'
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(to bottom right, var(--kiosk-bg-gradient-from, #0f172a), var(--kiosk-bg-gradient-to, #1e1b4b))',
        }}
      >
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--kiosk-accent, #7c3aed)' }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(to bottom right, var(--kiosk-bg-gradient-from, #0f172a), var(--kiosk-bg-gradient-to, #1e1b4b))',
      }}
    >
      {/* ── Header ── */}
      <header className="flex items-start justify-between px-6 py-4 shrink-0 gap-4">
        {/* Left: date + clock */}
        <div className="shrink-0">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--kiosk-text, #fff)' }}>
            {formatDate(now)}
          </h1>
          <p className="text-3xl font-mono tabular-nums" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            {formatTime(now)}
          </p>
        </div>

        {/* Right: 7-day weather forecast strip */}
        {forecast.length > 0 && (
          <div className="flex gap-2 overflow-x-auto shrink-0">
            {forecast.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center px-2 py-1.5 rounded-xl min-w-[56px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
                  {day.dayLabel}
                </span>
                <WeatherIcon condition={day.condition} size={18} />
                <span className="text-xs font-bold" style={{ color: 'var(--kiosk-text, #fff)' }}>
                  {day.high}°
                </span>
                <span className="text-[10px]" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
                  {day.low}°
                </span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* ── Today's Meal Banner ── */}
      {mealText && (
        <div
          className="mx-6 mb-4 px-4 py-2.5 rounded-xl flex items-center gap-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
        >
          {meal?.isFendForYourself ? (
            <ChefHat size={20} className="shrink-0 text-orange-400" />
          ) : (
            <Utensils size={20} className="shrink-0" style={{ color: 'var(--kiosk-accent, #7c3aed)' }} />
          )}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
              Tonight's Dinner
            </span>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--kiosk-text, #fff)' }}>
              {mealText}
            </p>
          </div>
          {meal?.recipeImage && !meal.isFendForYourself && (
            <img
              src={meal.recipeImage}
              alt=""
              className="w-10 h-10 rounded-lg object-cover shrink-0"
            />
          )}
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div
          className="mx-6 mb-4 px-4 py-2 rounded-xl text-center text-sm"
          style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      {/* ── Member grid ── */}
      <main className="flex-1 px-6 pb-6 overflow-auto">
        {members.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
              No family members found.
            </p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 auto-rows-min`}>
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isLeader={member.id === leaderId && member.totalPoints > 0}
                startDate={dateStr}
                onAvatarTap={handleAvatarTap}
                onChoreComplete={handleChoreComplete}
                onPaidChoreComplete={handlePaidChoreComplete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-lg font-semibold shadow-xl z-50 animate-bounce-in"
          style={{ backgroundColor: 'var(--kiosk-accent, #7c3aed)', color: '#fff' }}
        >
          {toast}
        </div>
      )}

      {/* ── PIN Modal ── */}
      {pinRequest && (
        <KioskPinModal
          mode={pinRequest.mode}
          userId={pinRequest.userId}
          userName={pinRequest.userName}
          userColor={pinRequest.userColor}
          userAvatar={pinRequest.userAvatar}
          choreInstanceId={pinRequest.choreInstanceId}
          paidChoreId={pinRequest.paidChoreId}
          onSuccess={handlePinSuccess}
          onClose={handlePinClose}
        />
      )}
    </div>
  );
}
