import Link from "next/link";
import { IconSettings } from "./icons";

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <header className="safe-top flex items-start justify-between gap-4 px-5 pb-5 pt-3">
      <div>
        <h1 className="font-display text-head leading-tight">{title}</h1>
        {subtitle && <p className="text-note text-text-dim">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 pt-1">
        {action}
        <Link href="/ajustes" aria-label="Ajustes" className="rounded-full p-2 text-text-dim">
          <IconSettings />
        </Link>
      </div>
    </header>
  );
}
