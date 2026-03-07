// apps/web/src/pages/KioskBoardPage.tsx
// Kiosk daily action board — fullscreen grid of family member cards

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useIdleTimeout, useDayRollover } from '../hooks';
import { MemberCard } from '../components/kiosk/MemberCard';
import { KioskPinModal } from '../components/kiosk/KioskPinModal';
import type { KioskBoardMember } from '../api/kiosk';

interface PinRequest {
  userId: number;
  userName: string;
  userColor: string | null;
  userAvatar: string | null;
  onSuccess: () => void;
}

export function KioskBoardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [members, setMembers] = useState<KioskBoardMember[]>([]);
  const [dateStr, setDateStr] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifiedUsers, setVerifiedUsers] = useState<Set<number>>(new Set());
  const [pinRequest, setPinRequest] = useState<PinRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // 5-minute idle timeout for kiosk board
  const handleIdleLogout = useCallback(() => {
    logout();
    navigate('/kiosk');
  }, [logout, navigate]);

  useIdleTimeout({
    enabled: true,
    timeoutMs: 5 * 60 * 1000,
    onLogout: handleIdleLogout,
  });

  // Midnight auto-reset
  useDayRollover();

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    try {
      const data = await api.getKioskBoard();
      setMembers(data.members);
      setDateStr(data.date);
      setError('');
    } catch (err) {
      console.error('Failed to fetch board:', err);
      setError('Failed to load board data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + 30s polling
  useEffect(() => {
    fetchBoard();
    pollRef.current = setInterval(fetchBoard, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchBoard]);

  // PIN request handler passed to MemberCard
  const handleRequestPin = useCallback(
    (userId: number, userName: string, color: string | null, avatar: string | null, onSuccess: () => void) => {
      setPinRequest({ userId, userName, userColor: color, userAvatar: avatar, onSuccess });
    },
    [],
  );

  // PIN verified — add to verified set, run success callback, close modal
  const handlePinSuccess = useCallback(() => {
    if (!pinRequest) return;
    setVerifiedUsers((prev) => new Set(prev).add(pinRequest.userId));
    pinRequest.onSuccess();
    setPinRequest(null);
  }, [pinRequest]);

  const handlePinClose = useCallback(() => {
    setPinRequest(null);
  }, []);

  // Full App button — navigate to regular dashboard
  const handleFullApp = () => {
    navigate('/');
  };

  // Log Out
  const handleLogout = () => {
    logout();
    navigate('/kiosk');
  };

  // Format date for header
  const formatDate = (ds: string) => {
    if (!ds) return '';
    try {
      const d = new Date(ds + 'T00:00:00');
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    } catch {
      return ds;
    }
  };

  // Grid columns based on member count
  const gridCols =
    members.length <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : members.length <= 4
        ? 'grid-cols-2 lg:grid-cols-4'
        : members.length <= 6
          ? 'grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

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
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--kiosk-text, #fff)' }}>
            {formatDate(dateStr)}
          </h1>
          <p className="text-sm" style={{ color: 'var(--kiosk-text-muted, #9ca3af)' }}>
            Family Action Board
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFullApp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: 'var(--kiosk-button-bg, rgba(255,255,255,0.1))',
              color: 'var(--kiosk-text, #fff)',
            }}
          >
            <Monitor size={18} />
            Full App
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
            }}
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-4 px-4 py-2 rounded-xl text-center text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Member grid */}
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
                isVerified={verifiedUsers.has(member.id)}
                onRequestPin={handleRequestPin}
                onRefresh={fetchBoard}
              />
            ))}
          </div>
        )}
      </main>

      {/* PIN modal */}
      {pinRequest && (
        <KioskPinModal
          userId={pinRequest.userId}
          userName={pinRequest.userName}
          userColor={pinRequest.userColor}
          userAvatar={pinRequest.userAvatar}
          onSuccess={handlePinSuccess}
          onClose={handlePinClose}
        />
      )}
    </div>
  );
}
