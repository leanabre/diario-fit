import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/setup-notice";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (profile) redirect("/");

  return <OnboardingForm userId={user.id} defaultName={user.email?.split("@")[0] ?? ""} />;
}
