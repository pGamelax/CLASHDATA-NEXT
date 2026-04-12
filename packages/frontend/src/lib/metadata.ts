import { cookies } from "next/headers";
import { getClanByTag } from "@/lib/api";
import type { Metadata } from "next";

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function generateClanMetadata(
  tag: string,
  pageName: string,
  defaultTitle?: string,
  customDescription?: string
): Promise<Metadata> {
  try {
    const cookieHeader = await getCookieHeader();
    const result = await getClanByTag(tag, cookieHeader);
    const clan = result?.data ?? result?.clan ?? result;

    if (!clan) {
      return { title: defaultTitle || `${pageName} | CLASHDATA` };
    }

    return {
      title: `${clan.name} - ${pageName} | CLASHDATA`,
      description: customDescription || `${pageName} do clã ${clan.name}`,
    };
  } catch {
    return { title: defaultTitle || `${pageName} | CLASHDATA` };
  }
}
