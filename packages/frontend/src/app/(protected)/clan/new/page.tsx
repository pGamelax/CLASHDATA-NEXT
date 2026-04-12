import { redirect } from "next/navigation";
import { NewClanContent } from "./NewClanContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adicionar Clan | CLASHDATA",
};

const VALID_PERIODS = ["monthly", "quarterly", "yearly"] as const;
type Period = typeof VALID_PERIODS[number];

export default async function NewClanPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string }>;
}) {
  const params = await searchParams;
  const planKey = params.plan?.trim().toUpperCase();
  if (!planKey) redirect("/pricing");

  const period: Period = VALID_PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "monthly";

  return <NewClanContent planKey={planKey} period={period} />;
}
