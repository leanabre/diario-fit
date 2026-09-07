import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/setup-notice";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <LoginForm />;
}
