import { cookies } from "next/headers";
import { getSeasonEndDates } from "@/lib/api";
import { AdminSeasonDates } from "@/components/AdminSeasonDates";

export const metadata = { title: "Temporadas | Admin" };

export default async function AdminSeasonDatesPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let dates: any[] = [];
  try {
    dates = await getSeasonEndDates(cookieHeader);
  } catch {
    // render empty, client will show error on mutation
  }

  return <AdminSeasonDates initialDates={dates} />;
}
