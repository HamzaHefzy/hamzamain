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
        <path
          d="M9.5 10.5 24 25l14.5-14.5"
          stroke="#5B4CE3"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 25v12.5"
          stroke="#5B4CE3"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="m29.5 17.5 4 4 6.5-7"
          stroke="#65D8A7"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!markOnly && <span className="yumna-logo-word">Yumna</span>}
    </span>
  );
}
