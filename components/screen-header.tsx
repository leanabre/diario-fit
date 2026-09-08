import Link from "next/link";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Emoji y color de la persona: es la entrada a Ajustes. */
  avatar?: { emoji: string; color: string };
  size?: "head" | "num";
};

/**
 * El acceso a Ajustes es la cara de quien está usando la app, no un engranaje.
 * Se reconoce antes y de paso dice de quién es la sesión, que en una app de dos
 * personas importa.
 */
export function ScreenHeader({ title, subtitle, action, avatar, size = "head" }: Props) {
  return (
    <header className="safe-top flex items-start justify-between gap-4 px-5 pb-5 pt-3">
      <div className="min-w-0">
        <h1 className={`font-display leading-tight ${size === "num" ? "text-num" : "text-head"}`}>{title}</h1>
        {subtitle && <div className="text-note text-text-dim">{subtitle}</div>}
      </div>

      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        {action}
        <Link
          href="/ajustes"
          aria-label="Ajustes"
          className="tap flex h-10 w-10 items-center justify-center rounded-full border bg-surface text-[19px] leading-none"
          style={{ borderColor: avatar?.color ?? "var(--color-line)" }}
        >
          {avatar?.emoji ?? "⚙︎"}
        </Link>
      </div>
    </header>
  );
}
