import AdminLayout from "@/components/layout/AdminLayout";
import AdminSurveysContent from "@/components/admin/AdminSurveysContent";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdminSurveysPage() {
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
      <AdminSurveysContent />
    </AdminLayout>
  );
}