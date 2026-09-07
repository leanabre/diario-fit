import { redirect } from "next/navigation";
import { monthDates, monthStartKey, todayKey, type DateKey } from "@/lib/dates";
import { getCurrentUser, getDays, getProfile, getTrainingTypes } from "@/lib/queries";
import { MonthScreen } from "./month-screen";

export const dynamic = "force-dynamic";

export default async function MonthPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayKey();
  const { m } = await searchParams;
  const month = monthStartKey(/^\d{4}-\d{2}-\d{2}$/.test(m ?? "") ? (m as DateKey) : today);
  const dates = monthDates(month);

  const [profile, trainingTypes, days] = await Promise.all([
    getProfile(user.id),
    getTrainingTypes(user.id),
    getDays(user.id, dates[0], dates[dates.length - 1]),
  ]);
  if (!profile) redirect("/bienvenida");

  return (
    <MonthScreen
      userId={user.id}
      profile={profile}
      trainingTypes={trainingTypes}
      initialDays={days}
      month={month}
      today={today}
    />
  );
}
