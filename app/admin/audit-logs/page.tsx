
import AdminLayout from "@/components/layout/AdminLayout";
import AdminAuditLogsContent from "@/components/admin/AdminAuditLogsContent";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditLogRecord = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export default async function AdminAuditLogsPage() {
  const { profile } = await requireRole(
    "admin",
    "super_admin"
  );

  const supabase = createAdminClient();

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, actor_name, actor_role, action, entity_type, entity_id, description, metadata, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (profile.role === "admin") {
    query = query.in("actor_role", [
      "admin",
      "intern",
      "system",
    ]);
  }

  const { data, error } = await query;

  const logs: AuditLogRecord[] = (data ?? []).map(
    (item) => ({
      ...item,
      metadata:
        item.metadata &&
        typeof item.metadata === "object" &&
        !Array.isArray(item.metadata)
          ? (item.metadata as Record<string, unknown>)
          : {},
    })
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
      <AdminAuditLogsContent
        logs={logs}
        role={profile.role as "admin" | "super_admin"}
        loadError={
          error
            ? "Audit records could not be loaded. Please try again later."
            : null
        }
      />
    </AdminLayout>
  );
}
