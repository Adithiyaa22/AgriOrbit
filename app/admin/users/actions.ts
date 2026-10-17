
"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/audit/record-audit-log";

export type InternAccount = {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

type ActionResult = {
  success: boolean;
  message: string;
};

type AccessResult =
  | {
      authorized: true;
      userId: string;
      role: "admin" | "super_admin";
    }
  | {
      authorized: false;
      message: string;
    };

async function verifyAdminAccess(): Promise<AccessResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, message: "You must be signed in." };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return {
        authorized: false,
        message: "Unable to verify your account.",
      };
    }

    if (!profile.is_active) {
      return {
        authorized: false,
        message: "Your account is inactive.",
      };
    }

    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return {
        authorized: false,
        message: "Only Admins and Super Admins can manage Intern accounts.",
      };
    }

    return {
      authorized: true,
      userId: user.id,
      role: profile.role,
    };
  } catch {
    return {
      authorized: false,
      message: "Unable to verify your account. Please try again.",
    };
  }
}

async function recordAuditSafely(input: {
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    await recordAuditLog(input);
    return true;
  } catch (error) {
    console.error("Audit log recording failed:", error);
    return false;
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getInternAccounts(): Promise<{
  success: boolean;
  message: string;
  interns: InternAccount[];
}> {
  const access = await verifyAdminAccess();

  if (!access.authorized) {
    return { success: false, message: access.message, interns: [] };
  }

  try {
    const adminClient = createAdminClient();

    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, full_name, employee_code, is_active, created_at")
      .eq("role", "intern")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Unable to load Intern profiles:", profilesError);
      return {
        success: false,
        message: "Unable to load Intern accounts.",
        interns: [],
      };
    }

    const interns: InternAccount[] = [];

    // Page through Auth users instead of assuming all users fit in one page.
    const emailByUserId = new Map<string, string>();
    const perPage = 200;
    let page = 1;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("Unable to load Auth users:", error);
        return {
          success: false,
          message: "Unable to load account email details.",
          interns: [],
        };
      }

      for (const user of data.users) {
        if (user.email) emailByUserId.set(user.id, user.email);
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    for (const profile of profiles ?? []) {
      interns.push({
        id: profile.id,
        full_name: profile.full_name,
        employee_code: profile.employee_code,
        email: emailByUserId.get(profile.id) ?? null,
        is_active: profile.is_active,
        created_at: profile.created_at,
      });
    }

    return { success: true, message: "", interns };
  } catch (error) {
    console.error("Unable to load Intern accounts:", error);
    return {
      success: false,
      message: "Unable to load Intern accounts.",
      interns: [],
    };
  }
}

export async function createInternAccount(
  formData: FormData
): Promise<ActionResult> {
  const access = await verifyAdminAccess();

  if (!access.authorized) {
    return { success: false, message: access.message };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const employeeCode = String(formData.get("employee_code") ?? "")
    .trim()
    .toUpperCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !employeeCode || !email || !password) {
    return {
      success: false,
      message: "Full name, employee code, email and password are required.",
    };
  }

  if (fullName.length > 120 || employeeCode.length > 40) {
    return {
      success: false,
      message: "Name or employee code is too long.",
    };
  }

  if (!validateEmail(email)) {
    return { success: false, message: "Enter a valid email address." };
  }

  if (password.length < 8 || password.length > 128) {
    return {
      success: false,
      message: "Password must contain between 8 and 128 characters.",
    };
  }

  try {
    const adminClient = createAdminClient();

    const { data: existingProfile, error: codeCheckError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("employee_code", employeeCode)
      .maybeSingle();

    if (codeCheckError) {
      console.error("Employee code check failed:", codeCheckError);
      return {
        success: false,
        message: "Unable to validate the employee code.",
      };
    }

    if (existingProfile) {
      return {
        success: false,
        message: "This employee code is already in use.",
      };
    }

    // Check every Auth user page to avoid missing users beyond page one.
    const perPage = 200;
    let page = 1;
    let emailAlreadyExists = false;

    while (true) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error("Auth email check failed:", error);
        return {
          success: false,
          message: "Unable to validate the email address.",
        };
      }

      emailAlreadyExists = data.users.some(
        (user) => user.email?.toLowerCase() === email
      );

      if (emailAlreadyExists || data.users.length < perPage) break;
      page += 1;
    }

    if (emailAlreadyExists) {
      return {
        success: false,
        message: "An account with this email already exists.",
      };
    }

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          employee_code: employeeCode,
          role: "intern",
        },
      });

    if (createUserError || !createdUser.user) {
      console.error("Auth user creation failed:", createUserError);
      return {
        success: false,
        message: createUserError?.message ?? "Unable to create the Intern account.",
      };
    }

    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .insert({
        id: createdUser.user.id,
        full_name: fullName,
        employee_code: employeeCode,
        role: "intern",
        is_active: true,
      });

    if (profileInsertError) {
      // Best-effort rollback if profile creation fails.
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(
        createdUser.user.id
      );

      if (rollbackError) {
        console.error("Auth rollback failed:", rollbackError);
      }

      console.error("Profile creation failed:", profileInsertError);
      return {
        success: false,
        message:
          "The Intern profile could not be created. Please check Auth users before retrying.",
      };
    }

    const auditRecorded = await recordAuditSafely({
      action: "intern_created",
      entityType: "profile",
      entityId: createdUser.user.id,
      description: `Created Intern account for ${fullName} (${employeeCode}).`,
      metadata: {
        employeeCode,
        createdBy: access.userId,
        createdByRole: access.role,
      },
    });

    return {
      success: true,
      message: auditRecorded
        ? "Intern account created successfully."
        : "Intern account created, but its audit entry failed. Check the audit logs.",
    };
  } catch (error) {
    console.error("Intern account creation failed:", error);
    return {
      success: false,
      message: "Unable to create the Intern account. Please try again.",
    };
  }
}

export async function toggleInternStatus(
  internId: string
): Promise<ActionResult> {
  const access = await verifyAdminAccess();

  if (!access.authorized) {
    return { success: false, message: access.message };
  }

  if (
    typeof internId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      internId
    )
  ) {
    return { success: false, message: "A valid Intern account ID is required." };
  }

  try {
    const adminClient = createAdminClient();

    const { data: internProfile, error } = await adminClient
      .from("profiles")
      .select("id, full_name, employee_code, role, is_active")
      .eq("id", internId)
      .maybeSingle();

    if (error || !internProfile) {
      return { success: false, message: "Intern account was not found." };
    }

    if (internProfile.role !== "intern") {
      return {
        success: false,
        message: "Only Intern accounts can be changed here.",
      };
    }

    const nextIsActive = !internProfile.is_active;

    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({ is_active: nextIsActive })
      .eq("id", internId)
      .eq("role", "intern")
      .eq("is_active", internProfile.is_active)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedProfile) {
      console.error("Intern status update failed:", updateError);
      return {
        success: false,
        message: "The Intern status could not be changed. Refresh and try again.",
      };
    }

    const auditRecorded = await recordAuditSafely({
      action: nextIsActive ? "intern_activated" : "intern_deactivated",
      entityType: "profile",
      entityId: internProfile.id,
      description: `${nextIsActive ? "Activated" : "Deactivated"} Intern account for ${internProfile.full_name || "unnamed user"} (${internProfile.employee_code || "no employee code"}).`,
      metadata: {
        employeeCode: internProfile.employee_code,
        previousStatus: internProfile.is_active,
        newStatus: nextIsActive,
        changedBy: access.userId,
        changedByRole: access.role,
      },
    });

    return {
      success: true,
      message: auditRecorded
        ? nextIsActive
          ? "Intern account activated."
          : "Intern account deactivated."
        : "Intern status changed, but the audit entry failed. Check the audit logs.",
    };
  } catch (error) {
    console.error("Intern status update failed:", error);
    return {
      success: false,
      message: "Unable to update Intern account. Please try again.",
    };
  }
}
