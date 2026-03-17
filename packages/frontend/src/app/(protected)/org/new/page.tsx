import { redirect } from "next/navigation";
import { NewOrgContent } from "./NewOrgContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Organização | CLASHDATA",
};

const VALID_PERIODS = ["monthly", "quarterly", "yearly"] as const;
type Period = typeof VALID_PERIODS[number];

export default function NewOrgPage({
  searchParams,
}: {
  searchParams: { plan?: string; period?: string };
}) {
  const planKey = searchParams.plan?.trim().toUpperCase();
  if (!planKey) redirect("/pricing");

  const period: Period = VALID_PERIODS.includes(searchParams.period as Period)
    ? (searchParams.period as Period)
    : "monthly";

  return <NewOrgContent planKey={planKey} period={period} />;
}
