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
        <rect x="2" y="2" width="44" height="44" rx="14" fill="#5B4CE3" />
        <path
          d="M13.5 14.5 24 24.7l10.5-10.2M24 24.7V36"
          stroke="white"
          strokeWidth="5.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="13.5" cy="14.5" r="3.2" fill="white" />
        <circle cx="34.5" cy="14.5" r="4.2" fill="#70E2B1" />
        <circle cx="24" cy="36" r="3.2" fill="white" />
      </svg>
      {!markOnly && <span className="yumna-logo-word">Yumna</span>}
    </span>
  );
}
