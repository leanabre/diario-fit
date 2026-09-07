import { NextResponse } from "next/server";
import { nutritionLabel } from "@/lib/config";
import { todayKey } from "@/lib/dates";
import { getCurrentUser, getDays, getTrainingTypes } from "@/lib/queries";

export const dynamic = "force-dynamic";

function cell(value: string | number | null): string {
  if (value == null) return "";
  const text = String(value);
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Exporta todo el historial propio. Una fila por día. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const [days, types] = await Promise.all([getDays(user.id, "2000-01-01", todayKey()), getTrainingTypes(user.id)]);
  const labelById = new Map(types.map((t) => [t.id, t.label]));

  const header = ["fecha", "alimentacion", "etiqueta", "descanso", "entrenamientos", "nota"];
  const rows = days.map((day) =>
    [
      day.date,
      day.nutritionScore ?? "",
      nutritionLabel(day.nutritionScore) ?? "",
      day.restDay ? "si" : "no",
      day.trainingTypeIds.map((id) => labelById.get(id) ?? id).join(" | "),
      day.nutritionNote ?? "",
    ]
      .map(cell)
      .join(","),
  );

  const csv = "﻿" + [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diario-fit-${todayKey()}.csv"`,
    },
  });
}
