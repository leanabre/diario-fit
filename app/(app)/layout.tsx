import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { TabBar } from "@/components/tab-bar";
import { todayKey } from "@/lib/dates";
import { getCurrentUser, getDays, getProfile } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isLogged } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/bienvenida");

  const today = todayKey();
  const [entry] = await getDays(user.id, today, today);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-28">
      {children}
      <TabBar pendingToday={!entry || !isLogged(entry)} />
    </div>
  );
}
