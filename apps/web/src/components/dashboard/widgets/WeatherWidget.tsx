// apps/web/src/components/dashboard/widgets/WeatherWidget.tsx
import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Loader2, MapPin } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
}

interface WeatherWidgetProps {
  location?: string;
}

// Map weather conditions to icons
function getWeatherIcon(condition: string, size: number = 32) {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return <CloudRain size={size} className="text-blue-400" />;
  } else if (lowerCondition.includes('snow')) {
    return <CloudSnow size={size} className="text-blue-200" />;
  } else if (lowerCondition.includes('cloud')) {
    return <Cloud size={size} className="text-gray-400" />;
  } else if (lowerCondition.includes('wind')) {
    return <Wind size={size} className="text-gray-500" />;
  } else {
    return <Sun size={size} className="text-yellow-400" />;
  }
}

export function WeatherWidget({ location }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      setLoading(true);
      setError(null);

      try {
        // Try to get user's location
        let lat: number | undefined;
        let lon: number | undefined;

        if (!location && navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000, // Cache for 5 minutes
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch {
            // Geolocation failed, will use default or provided location
          }
        }

        // Build API URL - using Open-Meteo (free, no API key required)
        let apiUrl: string;

        if (lat && lon) {
          apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
        } else {
          // Default to a central US location if no location available
          apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=39.8283&longitude=-98.5795&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }

        const data = await response.json();

        // Map weather codes to conditions
        const weatherCode = data.current.weather_code;
        const condition = getConditionFromCode(weatherCode);

        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          condition: condition.name,
          description: condition.description,
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          location: location || 'Current Location',
          icon: condition.name,
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to load weather');
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();

    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <Cloud size={32} className="mb-2 opacity-50" />
        <p className="text-sm">{error || 'Weather unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
        <MapPin size={12} />
        <span className="truncate">{weather.location}</span>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <div className="flex-shrink-0">
          {getWeatherIcon(weather.condition, 48)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {weather.temperature}
            </span>
            <span className="text-lg text-gray-500 dark:text-gray-400">°F</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {weather.condition}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <span>Humidity: {weather.humidity}%</span>
        <span>Wind: {weather.windSpeed} mph</span>
      </div>
    </div>
  );
}

// WMO Weather interpretation codes
function getConditionFromCode(code: number): { name: string; description: string } {
  const conditions: Record<number, { name: string; description: string }> = {
    0: { name: 'Clear', description: 'Clear sky' },
    1: { name: 'Mostly Clear', description: 'Mainly clear' },
    2: { name: 'Partly Cloudy', description: 'Partly cloudy' },
    3: { name: 'Cloudy', description: 'Overcast' },
    45: { name: 'Foggy', description: 'Fog' },
    48: { name: 'Foggy', description: 'Depositing rime fog' },
    51: { name: 'Light Drizzle', description: 'Light drizzle' },
    53: { name: 'Drizzle', description: 'Moderate drizzle' },
    55: { name: 'Heavy Drizzle', description: 'Dense drizzle' },
    56: { name: 'Freezing Drizzle', description: 'Light freezing drizzle' },
    57: { name: 'Freezing Drizzle', description: 'Dense freezing drizzle' },
    61: { name: 'Light Rain', description: 'Slight rain' },
    63: { name: 'Rain', description: 'Moderate rain' },
    65: { name: 'Heavy Rain', description: 'Heavy rain' },
    66: { name: 'Freezing Rain', description: 'Light freezing rain' },
    67: { name: 'Freezing Rain', description: 'Heavy freezing rain' },
    71: { name: 'Light Snow', description: 'Slight snow fall' },
    73: { name: 'Snow', description: 'Moderate snow fall' },
    75: { name: 'Heavy Snow', description: 'Heavy snow fall' },
    77: { name: 'Snow Grains', description: 'Snow grains' },
    80: { name: 'Light Showers', description: 'Slight rain showers' },
    81: { name: 'Showers', description: 'Moderate rain showers' },
    82: { name: 'Heavy Showers', description: 'Violent rain showers' },
    85: { name: 'Snow Showers', description: 'Slight snow showers' },
    86: { name: 'Heavy Snow Showers', description: 'Heavy snow showers' },
    95: { name: 'Thunderstorm', description: 'Thunderstorm' },
    96: { name: 'Thunderstorm', description: 'Thunderstorm with slight hail' },
    99: { name: 'Thunderstorm', description: 'Thunderstorm with heavy hail' },
  };

  return conditions[code] || { name: 'Unknown', description: 'Unknown conditions' };
}
