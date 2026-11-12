import { useId, type ReactElement } from "react";

export interface FigureAvatarProps {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}

function renderPortrait(slug: string): ReactElement {
  const key = slug.toLowerCase();

  if (key.includes("twain")) {
    return (
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
        <path d="M51 50 C48 58 47 62 52 64 C55 63 55 58 51 50Z" fill="#e8846a" />
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
    );
  }

  if (key.includes("keller")) {
    return (
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
        <circle cx="35" cy="64" r="4" fill="#f3b2b0" opacity="0.7" />
        <circle cx="65" cy="64" r="4" fill="#f3b2b0" opacity="0.7" />
        <path
          d="M30 92 C38 84 62 84 70 92"
          stroke="#d8d2c9"
          strokeWidth="5"
          fill="none"
          strokeDasharray="3 3"
        />
      </>
    );
  }

  if (key.includes("curie")) {
    return (
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
        <path d="M50 54 C47 61 47 64 51 65 C54 64 53 60 50 54Z" fill="#f08a6b" />
        <path
          d="M44 74 L56 74"
          stroke="#b9645a"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path d="M28 98 C30 88 40 84 50 86 C60 84 70 88 72 98Z" fill="#2c2c2c" />
      </>
    );
  }

  if (key.includes("gogh")) {
    return (
      <>
        <ellipse cx="50" cy="36" rx="34" ry="12" fill="#e7be6b" stroke="#b98a3a" strokeWidth="1.5" />
        <path
          d="M30 34 C32 16 68 16 70 34 Z"
          fill="#eccb7d"
          stroke="#b98a3a"
          strokeWidth="1.5"
        />
        <path
          d="M25 56 C22 36 36 28 50 28 C64 28 78 36 75 56 Z"
          fill="#c95b2b"
        />
        <ellipse cx="50" cy="54" rx="22" ry="26" fill="#f4cbb0" />
        <path
          d="M29 58 C28 76 38 86 50 88 C62 86 72 76 71 58 C65 68 58 72 50 72 C42 72 35 68 29 58Z"
          fill="#d1602e"
        />
        <path
          d="M36 46 Q41 43 45 46"
          stroke="#9e431f"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M55 46 Q59 43 64 46"
          stroke="#9e431f"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="41" cy="51" r="2.5" fill="#2d4c5c" />
        <circle cx="59" cy="51" r="2.5" fill="#2d4c5c" />
        <path
          d="M50 51 C48 57 48 61 52 61"
          stroke="#d98768"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M44 68 Q50 70 56 68"
          stroke="#a64624"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M26 98 C30 86 40 84 50 86 C60 84 70 86 74 98Z" fill="#3b5e8c" />
      </>
    );
  }

  if (key.includes("vinci")) {
    return (
      <>
        <path
          d="M20 64 C16 32 32 16 50 16 C68 16 84 32 80 64 Z"
          fill="#dcdad5"
        />
        <path
          d="M24 30 C30 14 70 14 76 30 L72 36 C60 30 40 30 28 36 Z"
          fill="#6d3b32"
        />
        <ellipse cx="50" cy="52" rx="22" ry="25" fill="#f0c8ab" />
        <path
          d="M28 56 C28 80 38 92 50 94 C62 92 72 80 72 56 C64 66 56 68 50 68 C44 68 36 66 28 56Z"
          fill="#e6e4df"
        />
        <circle cx="41" cy="50" r="2.4" fill="#2b2b2b" />
        <circle cx="59" cy="50" r="2.4" fill="#2b2b2b" />
        <path d="M36 44 L45 45" stroke="#b5b2ab" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M55 45 L64 44" stroke="#b5b2ab" strokeWidth="2.4" strokeLinecap="round" />
      </>
    );
  }

  return (
    <>
      <circle cx="50" cy="50" r="34" fill="#e9e4db" />
      <ellipse cx="50" cy="46" rx="16" ry="18" fill="#f2cbb0" />
      <circle cx="44" cy="44" r="2.2" fill="#2b2b2b" />
      <circle cx="56" cy="44" r="2.2" fill="#2b2b2b" />
      <path
        d="M44 54 Q50 58 56 54"
        stroke="#9b6a58"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M28 86 C32 72 68 72 72 86Z" fill="#5c6c82" />
    </>
  );
}

/**
 * Hand-drawn SVG portrait avatar for a historical figure.
 */
export function FigureAvatar({
  slug,
  name,
  size = 56,
  className = "w-14 h-14 shrink-0",
}: Readonly<FigureAvatarProps>): ReactElement {
  const rawId = useId();
  const filterId = `avatar-wobble-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={name}
      className={className}
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035"
            numOctaves={2}
            seed={7}
          />
          <feDisplacementMap in="SourceGraphic" scale={2.4} />
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="var(--paper)"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <g filter={`url(#${filterId})`}>{renderPortrait(slug)}</g>
    </svg>
  );
}
