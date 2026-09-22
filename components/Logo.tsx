type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`operator-logo ${className}`.trim()} aria-label="Dexyra">
      <svg
        className="operator-logo-mark"
        viewBox="0 0 48 48"
        role="img"
        aria-hidden="true"
        fill="none"
      >
        <path
          d="M10 8h10.5C31.8 8 39 14.5 39 24s-7.2 16-18.5 16H10V8Z"
          stroke="currentColor"
          strokeWidth="5.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m17 24 5.2 5.2L33 18.4"
          stroke="currentColor"
          strokeWidth="5.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!markOnly && <span className="operator-logo-word">Dexyra</span>}
    </span>
  );
}
