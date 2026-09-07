import { redirect } from "next/navigation";
import { todayKey } from "@/lib/dates";
import { getCurrentUser, getHistory, getProfile, getTrainingTypes } from "@/lib/queries";
import { TodayScreen } from "./today-screen";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, trainingTypes, history] = await Promise.all([
    getProfile(user.id),
    getTrainingTypes(user.id),
    getHistory(user.id),
  ]);
  if (!profile) redirect("/bienvenida");

  return (
    <TodayScreen
      userId={user.id}
      profile={profile}
      trainingTypes={trainingTypes}
      initialDays={history}
      today={todayKey()}
    />
  );
}
