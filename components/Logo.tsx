type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`anchor-logo ${className}`.trim()} aria-label="Operator">
      <svg className="anchor-logo-mark" viewBox="0 0 48 40" role="img" aria-hidden="true" fill="none">
        <path d="M7.5 24.5 17.8 7.2c2.8-4.6 9.5-4.6 12.2 0l10.4 17.3" stroke="currentColor" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 24.5c4.2-6.2 10.4-6.7 15.5-1.5l4.7 4.7c4.4 4.4 9.1 3.4 12.7-3.2" stroke="currentColor" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!markOnly && <span className="anchor-logo-word">Operator</span>}
    </span>
  );
}
