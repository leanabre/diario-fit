import Link from "next/link";
import { redirect } from "next/navigation";
import { ScreenHeader } from "@/components/screen-header";
import { todayKey } from "@/lib/dates";
import { getCurrentUser, getHistory, getProfile } from "@/lib/queries";
import { buildDayMap } from "@/lib/streaks";
import { ensureChallenges, getTeamContext } from "@/lib/team";
import { TeamScreen } from "./team-screen";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/bienvenida");

  const team = await getTeamContext(user.id);

  if (!team) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Nosotros" subtitle="La semana de los dos" />
        <section className="mx-5 rounded-card border border-line bg-surface p-5">
          <p className="text-body">Todavía no hay equipo.</p>
          <p className="mt-2 text-note text-text-dim">
            Uno de los dos crea el equipo y le pasa el código al otro. Se hace en Ajustes.
          </p>
          <Link
            href="/ajustes#equipo"
            className="mt-4 inline-block rounded-2xl bg-[#7C5CFF] px-4 py-3 text-note font-medium text-white"
          >
            Ir a Ajustes
          </Link>
        </section>
      </div>
    );
  }

  const today = todayKey();
  const myDays = await getHistory(user.id);
  const challenges = await ensureChallenges(
    team.team.id,
    buildDayMap(myDays),
    buildDayMap(team.partnerDays),
    today,
  );

  return (
    <TeamScreen
      team={team.team}
      me={team.me}
      partner={team.partner}
      myDays={myDays}
      partnerDays={team.partnerDays}
      challenges={challenges}
      today={today}
    />
  );
}
