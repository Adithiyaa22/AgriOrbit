
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditRole =
  | "intern"
  | "admin"
  | "super_admin"
  | "system";

type RecordAuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function recordAuditLog(
  input: RecordAuditLogInput
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(
      "An authenticated user is required to record this audit action."
    );
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", user.id)
      .single();

  if (
    profileError ||
    !profile ||
    !profile.is_active
  ) {
    throw new Error(
      "The active user profile could not be verified."
    );
  }

  const allowedRoles: AuditRole[] = [
    "intern",
    "admin",
    "super_admin",
  ];

  if (
    !allowedRoles.includes(
      profile.role as AuditRole
    )
  ) {
    throw new Error(
      "The user's role is not permitted to record audit activity."
    );
  }

  const action = input.action.trim();
  const entityType = input.entityType.trim();
  const description = input.description.trim();

  if (!action || !entityType || !description) {
    throw new Error(
      "Action, entity type, and description are required."
    );
  }

  const metadata =
    input.metadata &&
    typeof input.metadata === "object" &&
    !Array.isArray(input.metadata)
      ? input.metadata
      : {};

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("audit_logs")
    .insert({
      actor_id: user.id,
      actor_name: profile.full_name,
      actor_role: profile.role,
      action,
      entity_type: entityType,
      entity_id: input.entityId ?? null,
      description,
      metadata,
    });

  if (error) {
    throw new Error(
      `Failed to record audit activity: ${error.message}`
    );
  }
}
