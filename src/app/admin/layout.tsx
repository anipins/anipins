import { redirect } from "next/navigation";
import { getUser, isAdmin } from "@/lib/auth";
import AdminShell from "./AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Resolve the session with the route request itself. Previously the phone
  // downloaded and hydrated the admin shell, then waited for a second client
  // request before rendering the upload controls.
  const user = await getUser();
  if (!isAdmin(user)) redirect("/login");
  return <AdminShell>{children}</AdminShell>;
}
