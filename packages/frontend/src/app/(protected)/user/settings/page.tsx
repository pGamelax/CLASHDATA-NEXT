import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSession } from "@/lib/api";
import { UserSettingsClient } from "./UserSettingsClient";

export const metadata: Metadata = {
  title: "Configurações — CLASHDATA",
};

export default async function UserSettingsPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  const session = await getSession(cookieHeader);

  return (
    <UserSettingsClient
      user={{
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        image: session?.user?.image ?? null,
      }}
    />
  );
}
