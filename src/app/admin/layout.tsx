import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Server-side admin layout — defense-in-depth auth gate.
 *
 * The middleware already checks for admin role and redirects non-admins,
 * but this layout provides a second server-side check so that admin
 * content is never rendered for unauthorized users, even during edge
 * cases like middleware exceptions.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/account");
  }

  return (
    <AdminShell userEmail={user.email || ""}>
      {children}
    </AdminShell>
  );
}
