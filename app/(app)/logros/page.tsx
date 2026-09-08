import { redirect } from "next/navigation";
import { evaluateAchievements } from "@/lib/achievements";
import { todayKey } from "@/lib/dates";
import { getCurrentUser, getHistory, getProfile } from "@/lib/queries";
import { buildDayMap } from "@/lib/streaks";
import { getTeamContext } from "@/lib/team";
import { supabaseServer } from "@/lib/supabase/server";
import { AchievementsScreen } from "./achievements-screen";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, history, team] = await Promise.all([
    getProfile(user.id),
    getHistory(user.id),
    getTeamContext(user.id),
  ]);
  if (!profile) redirect("/bienvenida");

  const supabase = await supabaseServer();
  const { data: rows } = await supabase.from("achievements").select("key,unlocked_at").eq("user_id", user.id);
  const stored = (rows ?? []) as { key: string; unlocked_at: string }[];
  const unlockedAt = Object.fromEntries(stored.map((r) => [r.key, r.unlocked_at]));

  const { count: challengesWon } = team
    ? await supabase
        .from("team_challenges")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.team.id)
        .eq("status", "won")
    : { count: 0 };

  const states = evaluateAchievements({
    days: buildDayMap(history),
    goal: profile.weekly_training_goal,
    today: todayKey(),
    partnerDays: team?.partner ? buildDayMap(team.partnerDays) : undefined,
    partnerGoal: team?.partner?.weekly_training_goal,
    challengesWon: challengesWon ?? 0,
  });

  const newlyUnlocked = states.filter((s) => s.unlocked && !(s.def.key in unlockedAt)).map((s) => s.def.key);

  return (
    <AchievementsScreen
      states={states}
      unlockedAt={unlockedAt}
      newlyUnlocked={newlyUnlocked}
      profile={profile}
    />
  );
}
