import AdminLayout from "@/components/layout/AdminLayout";
import AdminFarmersContent from "@/components/admin/AdminFarmersContent";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminFarmersPage() {
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
      <AdminFarmersContent />
    </AdminLayout>
  );
}