import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession, getReferralInfo } from "@/lib/api";
import { UserSettingsClient } from "./UserSettingsClient";

export const metadata: Metadata = {
  title: "Configurações — CLASHDATA",
};

export default async function UserSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const [session, referral, params] = await Promise.all([
    getSession(cookieHeader),
    getReferralInfo(cookieHeader),
    searchParams,
  ]);

  const validTabs = ["profile", "security", "referral"] as const;
  type TabId = (typeof validTabs)[number];
  const initialTab: TabId = validTabs.includes(params.tab as TabId)
    ? (params.tab as TabId)
    : "profile";

  return (
    <UserSettingsClient
      user={{
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        image: session?.user?.image ?? null,
      }}
      referral={referral}
      initialTab={initialTab}
    />
  );
}
