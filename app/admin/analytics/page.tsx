import AdminLayout from "@/components/layout/AdminLayout";
import AdminAnalyticsContent from "@/components/admin/AdminAnalyticsContent";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminAnalyticsPage() {
  const { profile } = await requireRole(
    "admin",
    "super_admin"
  );

  return (
    <AdminLayout
      role={profile.role as "admin" | "super_admin"}
      profile={{
        full_name: profile.full_name,
        employee_code: profile.employee_code,
        role: profile.role as "admin" | "super_admin",
      }}
    >
      <AdminAnalyticsContent />
    </AdminLayout>
  );
}