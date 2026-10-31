import React from "react";

export interface FigureAvatarProps {
  avatarId?: string;
  name: string;
  className?: string;
  size?: number;
}

export function FigureAvatar({
  avatarId,
  name,
  className = "w-14 h-14 flex-none",
  size = 56,
}: FigureAvatarProps): React.JSX.Element {
  const normalizedId = avatarId?.toLowerCase() || name.toLowerCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-label={`${name} avatar`}
      role="img"
    >
      <defs>
        <filter id={`avatar-wobble-${normalizedId}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves={2}
            seed={7}
          />
          <feDisplacementMap in="SourceGraphic" scale={2} />
        </filter>
      </defs>

      <g filter={`url(#avatar-wobble-${normalizedId})`}>
        {normalizedId.includes("twain") ? (
          <>
            <path
              d="M18 48 C10 30 24 12 44 14 C52 6 72 10 78 22 C92 28 90 48 82 56 L78 40 C70 30 34 28 24 40 Z"
              fill="#f4f4f2"
              stroke="#cfcfcf"
              strokeWidth="1.5"
            />
            <ellipse cx="51" cy="56" rx="25" ry="29" fill="#f2c4a2" />
            <path
              d="M31 44 Q38 38 46 43"
              stroke="#e9e9e9"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M56 43 Q64 38 71 44"
              stroke="#e9e9e9"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="40" cy="51" r="2.6" fill="#2b2b2b" />
            <circle cx="62" cy="51" r="2.6" fill="#2b2b2b" />
            <path
              d="M51 50 C48 58 47 62 52 64 C55 63 55 58 51 50Z"
              fill="#e8846a"
            />
            <path
              d="M30 70 C38 62 46 66 51 68 C56 66 64 62 72 70 C66 76 58 74 51 71 C44 74 36 76 30 70Z"
              fill="#f7f7f5"
              stroke="#cfcfcf"
              strokeWidth="1.2"
            />
            <path
              d="M45 78 Q51 80 57 78"
              stroke="#c46a5a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : normalizedId.includes("keller") ? (
          <>
            <ellipse cx="50" cy="16" rx="16" ry="11" fill="#7a5340" />
            <path
              d="M22 52 C18 26 36 18 50 20 C66 18 84 28 78 54 C72 40 62 32 50 32 C38 32 28 40 22 52Z"
              fill="#7a5340"
            />
            <ellipse cx="50" cy="56" rx="24" ry="28" fill="#f6d6c2" />
            <path
              d="M27 46 C30 34 42 30 50 31 C42 36 36 40 27 46Z"
              fill="#7a5340"
            />
            <path
              d="M37 50 Q41 47 45 50"
              stroke="#3a2a24"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M56 50 Q60 47 64 50"
              stroke="#3a2a24"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M50 52 C47 59 48 63 52 63"
              stroke="#e48aa0"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M43 72 Q50 77 57 72"
              stroke="#d0575e"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="35" cy="64" r="4" fill="#f3b2b0" opacity=".7" />
            <circle cx="65" cy="64" r="4" fill="#f3b2b0" opacity=".7" />
            <path
              d="M30 92 C38 84 62 84 70 92"
              stroke="#ffffff"
              strokeWidth="5"
              fill="none"
              strokeDasharray="3 3"
            />
          </>
        ) : normalizedId.includes("curie") ? (
          <>
            <path
              d="M20 56 C16 28 34 14 50 16 C68 14 86 30 80 58 C76 42 66 30 50 30 C34 30 24 42 20 56Z"
              fill="#4b413a"
            />
            <circle cx="80" cy="38" r="9" fill="#4b413a" />
            <ellipse cx="50" cy="58" rx="22" ry="28" fill="#f4dccd" />
            <path
              d="M50 30 C46 34 40 36 30 44 C34 34 42 30 50 30Z M50 30 C54 34 60 36 70 44 C66 34 58 30 50 30Z"
              fill="#4b413a"
            />
            <circle cx="41" cy="53" r="2.4" fill="#2b2b2b" />
            <circle cx="59" cy="53" r="2.4" fill="#2b2b2b" />
            <path
              d="M36 47 L45 46"
              stroke="#4b413a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M55 46 L64 47"
              stroke="#4b413a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M50 54 C47 61 47 64 51 65 C54 64 53 60 50 54Z"
              fill="#f08a6b"
            />
            <path
              d="M44 74 L56 74"
              stroke="#b9645a"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M28 98 C30 88 40 84 50 86 C60 84 70 88 72 98Z"
              fill="#2c2c2c"
            />
          </>
        ) : (
          <>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="#e8eaed"
              stroke="#cfcfcf"
              strokeWidth="2"
            />
            <circle cx="50" cy="40" r="18" fill="#a0aec0" />
            <path
              d="M22 84 C22 66 35 58 50 58 C65 58 78 66 78 84 Z"
              fill="#a0aec0"
            />
          </>
        )}
      </g>
    </svg>
  );
}
