"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconData, IconMonth, IconTeam, IconToday } from "./icons";

const TABS = [
  { href: "/", label: "Hoy", Icon: IconToday },
  { href: "/mes", label: "Mes", Icon: IconMonth },
  { href: "/datos", label: "Datos", Icon: IconData },
  { href: "/nosotros", label: "Nosotros", Icon: IconTeam },
];

export function TabBar({ pendingToday }: { pendingToday?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 backdrop-blur-xl">
      <div className="safe-bottom mx-auto flex max-w-md justify-around px-2 pt-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`tap relative flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-mini ${
                active ? "text-text" : "text-text-dim"
              }`}
            >
              {/* La pestaña activa se marca arriba, alineada con el borde de la barra. */}
              {active && <span className="absolute -top-[7px] h-[3px] w-8 rounded-full bg-accent" />}
              <span className="relative">
                <Icon className="h-6 w-6" />
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
