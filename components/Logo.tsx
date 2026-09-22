type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`yumna-logo ${className}`.trim()} aria-label="Yumna">
      <svg
        className="yumna-logo-mark"
        viewBox="0 0 52 52"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="yumna-a" x1="6" y1="7" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7258F6" />
            <stop offset="1" stopColor="#4B39CF" />
          </linearGradient>
          <linearGradient id="yumna-b" x1="31" y1="8" x2="45" y2="25" gradientUnits="userSpaceOnUse">
            <stop stopColor="#80E9BE" />
            <stop offset="1" stopColor="#39C995" />
          </linearGradient>
        </defs>
        <path
          d="M8 10.5c0 9.9 7.9 17.8 17.7 17.8h.6C36.1 28.3 44 20.4 44 10.5"
          stroke="url(#yumna-a)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M26 28.5V43"
          stroke="url(#yumna-a)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="m32 16.5 4.2 4.2L45 11.8"
          stroke="url(#yumna-b)"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="10.5" r="3.5" fill="#7258F6" />
        <circle cx="44" cy="10.5" r="3.5" fill="#39C995" />
      </svg>
      {!markOnly && <span className="yumna-logo-word">Yumna</span>}
    </span>
  );
}
