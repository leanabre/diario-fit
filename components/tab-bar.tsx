"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconData, IconMedal, IconMonth, IconTeam, IconToday } from "./icons";

/**
 * Cinco destinos en lugar de cuatro. Los logros estaban escondidos detrás de un
 * enlace chico en Datos: siendo el motor de constancia de la app, tienen que
 * estar a un toque como todo lo demás.
 */
const TABS = [
  { href: "/", label: "Hoy", Icon: IconToday },
  { href: "/mes", label: "Mes", Icon: IconMonth },
  { href: "/logros", label: "Logros", Icon: IconMedal },
  { href: "/datos", label: "Datos", Icon: IconData },
  { href: "/nosotros", label: "Nosotros", Icon: IconTeam },
];

export function TabBar({ pendingToday }: { pendingToday?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-xl">
      <div className="safe-bottom mx-auto flex max-w-md px-1 pt-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`tap relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] ${
                active ? "text-text" : "text-text-dim"
              }`}
            >
              {active && <span className="absolute -top-[7px] h-[3px] w-7 rounded-full bg-accent" />}
              <span className="relative">
                <Icon className="h-[22px] w-[22px]" />
                {href === "/" && pendingToday && (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-food-5 ring-2 ring-bg" />
                )}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
