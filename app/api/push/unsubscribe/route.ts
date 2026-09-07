import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { endpoint } = (await request.json()) as { endpoint?: string };
  const supabase = await supabaseServer();

  const query = supabase.from("push_subscriptions").delete().eq("user_id", user.id);
  await (endpoint ? query.eq("endpoint", endpoint) : query);

  return NextResponse.json({ ok: true });
}
