type LogoProps = {
  variant?: "horizontal" | "stacked" | "mark";
  className?: string;
  title?: string;
};

export const MARK_PATH =
  "M0,2Q0,0 2,0H46Q48,0 48,2V10Q48,12 46,12H12V24H34Q36,24 36,26V34Q36,36 34,36H12V46Q12,48 10,48H2Q0,48 0,46Z";

/** The Fleetcast "F" mark: an F built from blocks with two pixels casting forward. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 70 48" aria-hidden="true" focusable="false">
      <path d={MARK_PATH} fill="currentColor" />
      <rect x="58" y="0" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="46" y="24" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ variant = "horizontal", className = "", title = "Fleetcast" }: LogoProps) {
  if (variant === "mark") {
    return (
      <span className={`logo logo--mark ${className}`} role="img" aria-label={title}>
        <Mark className="logo__mark" />
      </span>
    );
  }
  return (
    <span className={`logo logo--${variant} ${className}`} role="img" aria-label={title}>
      <Mark className="logo__mark" />
      <span className="logo__word" aria-hidden="true">
        <span>fleet</span>
        <span>cast</span>
      </span>
    </span>
  );
}
