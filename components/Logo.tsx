type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`yumna-logo ${className}`.trim()} aria-label="Yumna">
      <svg
        className="yumna-logo-mark"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient id="yumna-mark-gradient" x1="6" y1="5" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7567F8"/>
            <stop offset="1" stopColor="#4A3EC8"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#yumna-mark-gradient)"/>
        <path
          d="M13.5 13.5 24 24m10.5-10.5L24 24v10.5"
          stroke="white"
          strokeWidth="5.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="35" cy="12.5" r="4.5" fill="#70E2B1" stroke="#4A3EC8" strokeWidth="2"/>
      </svg>
      {!markOnly && <span className="yumna-logo-word">Yumna</span>}
    </span>
  );
}
