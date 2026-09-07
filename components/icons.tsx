type IconProps = { className?: string };

const base = "h-6 w-6";

export function IconToday({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.75v4.4l2.9 1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconMonth({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3.75" y="5" width="16.5" height="15" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.75 10h16.5M8.5 3.5v3M15.5 3.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconData({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 19V11M12 19V5M19 19v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconTeam({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="9.5" r="3.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.75 19c.6-2.7 2.7-4.2 5.25-4.2S13.65 16.3 14.25 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M16.4 15c2 .15 3.4 1.5 3.85 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconSettings({ className = "h-[22px] w-[22px]" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9.5" cy="8" r="2.6" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="16" r="2.6" fill="var(--color-bg)" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function IconShield({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 3.5 5.5 6v5.6c0 4 2.7 7.3 6.5 8.9 3.8-1.6 6.5-4.9 6.5-8.9V6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBack({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M14.5 5 8 12l6.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevron({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9.5 5 16 12l-6.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
