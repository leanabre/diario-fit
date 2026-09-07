import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getTrainingTypes } from "@/lib/queries";
import { getTeamContext } from "@/lib/team";
import { SettingsScreen } from "./settings-screen";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, trainingTypes, team] = await Promise.all([
    getProfile(user.id),
    getTrainingTypes(user.id),
    getTeamContext(user.id, 1),
  ]);
  if (!profile) redirect("/bienvenida");

  return (
    <SettingsScreen
      profile={profile}
      trainingTypes={trainingTypes}
      team={team?.team ?? null}
      partner={team?.partner ?? null}
    />
  );
}
