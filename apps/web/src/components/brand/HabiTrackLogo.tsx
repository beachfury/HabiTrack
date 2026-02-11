// HabiTrack Brand Logo Component
// Default logo used when no custom household logo is uploaded

interface HabiTrackLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  darkMode?: boolean;
}

export function HabiTrackLogo({
  size = 48,
  showText = false,
  className = '',
  darkMode = false,
}: HabiTrackLogoProps) {
  const navyColor = darkMode ? '#5a7a8a' : '#3d4f5f';
  const greenColor = '#3cb371';
  const textColor = darkMode ? '#f9fafb' : '#3d4f5f';

  // Icon-only (for sidebar, favicon, etc.)
  if (!showText) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Left vertical bar of H */}
        <path
          d="M25 15 C25 10 30 8 33 12 L33 75 C33 80 28 82 25 78 L25 15"
          fill={navyColor}
        />
        {/* Right part - curved like a "C" or wave */}
        <path
          d="M55 40 C70 40 80 50 80 62 C80 78 65 85 50 80 C42 77 40 70 45 65 C50 60 58 62 62 65 C68 68 70 63 68 58 C65 52 58 50 55 50 C50 50 48 52 48 55"
          fill={navyColor}
        />
        {/* Green swoosh/track going through */}
        <path
          d="M10 55 Q25 48 40 50 Q55 52 70 45 Q82 40 90 42 Q95 44 92 48 Q88 52 78 50 Q65 48 50 55 Q35 62 20 58 Q12 56 10 55"
          fill={greenColor}
        />
        {/* Green loop at end */}
        <path
          d="M78 35 Q88 32 92 38 Q95 45 88 48 Q82 50 80 45 Q78 40 78 35"
          fill={greenColor}
        />
      </svg>
    );
  }

  // With text (for login page, etc.)
  const textWidth = size * 2.5;
  const totalWidth = size + 8 + textWidth;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Left vertical bar of H */}
        <path
          d="M25 15 C25 10 30 8 33 12 L33 75 C33 80 28 82 25 78 L25 15"
          fill={navyColor}
        />
        {/* Right part - curved like a "C" or wave */}
        <path
          d="M55 40 C70 40 80 50 80 62 C80 78 65 85 50 80 C42 77 40 70 45 65 C50 60 58 62 62 65 C68 68 70 63 68 58 C65 52 58 50 55 50 C50 50 48 52 48 55"
          fill={navyColor}
        />
        {/* Green swoosh/track going through */}
        <path
          d="M10 55 Q25 48 40 50 Q55 52 70 45 Q82 40 90 42 Q95 44 92 48 Q88 52 78 50 Q65 48 50 55 Q35 62 20 58 Q12 56 10 55"
          fill={greenColor}
        />
        {/* Green loop at end */}
        <path
          d="M78 35 Q88 32 92 38 Q95 45 88 48 Q82 50 80 45 Q78 40 78 35"
          fill={greenColor}
        />
      </svg>
      <span
        style={{
          fontSize: size * 0.5,
          fontWeight: 600,
          color: textColor,
          letterSpacing: '-0.02em',
        }}
      >
        HabiTrack
      </span>
    </div>
  );
}

export default HabiTrackLogo;
