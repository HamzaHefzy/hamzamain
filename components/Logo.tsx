type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`wafira-logo ${className}`.trim()} aria-label="Wafira">
      <svg
        className="wafira-logo-mark"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <path d="M8.5 13.5 15 35h5l4-13 4 13h5l6.5-21.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.2 13.5 20 29.4 24 17l4 12.4 4.8-15.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".42"/>
        <circle cx="37.5" cy="10.5" r="3.5" fill="currentColor"/>
      </svg>
      {!markOnly && <span className="wafira-logo-word">Wafira</span>}
    </span>
  );
}
