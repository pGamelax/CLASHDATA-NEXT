import { redirect } from "next/navigation";
import { NewOrgContent } from "./NewOrgContent";
import type { Metadata } from "next";
import type { Plan, Period } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Criar Organização | CLASHDATA",
};

const VALID_PLANS: Plan[] = ["MESTRE", "CAMPEAO", "TITA", "LEGEND"];
const VALID_PERIODS: Period[] = ["monthly", "quarterly", "yearly"];

export default function NewOrgPage({
  searchParams,
}: {
  searchParams: { plan?: string; period?: string };
}) {
  const plan = VALID_PLANS.includes(searchParams.plan as Plan)
    ? (searchParams.plan as Plan)
    : null;

  const period = VALID_PERIODS.includes(searchParams.period as Period)
    ? (searchParams.period as Period)
    : "monthly";

  if (!plan) redirect("/pricing");

  return <NewOrgContent plan={plan} period={period} />;
}
