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
        <path d="M9 9.5 24 25v13.5" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M39 9.5 24 25" stroke="currentColor" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="m30.5 14.5 4.5 4.5 7-8" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {!markOnly && <span className="yumna-logo-word">Yumna</span>}
    </span>
  );
}
