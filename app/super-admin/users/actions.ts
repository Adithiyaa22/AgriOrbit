
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordAuditLog } from "@/lib/audit/record-audit-log";

type CreateAdminResult = {
  success: boolean;
  message: string;
};

export type AdminAccount = {
  id: string;
  full_name: string | null;
  employee_code: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

async function recordAuditSafely(input: {
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await recordAuditLog(input);
    return true;
  } catch (error) {
    console.error("Audit log recording failed:", error);
    return false;
  }
}

async function verifySuperAdmin() {
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return {
      authorized: false,
      message: "You must be signed in.",
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", currentUser.id)
    .single();

  if (error || !profile) {
    return {
      authorized: false,
      message: "Unable to verify your account.",
    };
  }

  if (
    profile.role !== "super_admin" ||
    !profile.is_active
  ) {
    return {
      authorized: false,
      message:
        "Only active Super Admins can perform this action.",
    };
  }

  return {
    authorized: true,
    message: "",
  };
}

export async function getAdminAccounts(): Promise<{
  success: boolean;
  message: string;
  admins: AdminAccount[];
}> {
  const verification = await verifySuperAdmin();

  if (!verification.authorized) {
    return {
      success: false,
      message: verification.message,
      admins: [],
    };
  }

  try {
    const adminClient = createAdminClient();

    const {
      data: profiles,
      error: profilesError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, full_name, employee_code, is_active, created_at"
      )
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (profilesError) {
      return {
        success: false,
        message: profilesError.message,
        admins: [],
      };
    }

    const {
      data: usersData,
      error: usersError,
    } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) {
      return {
        success: false,
        message: usersError.message,
        admins: [],
      };
    }

    const admins: AdminAccount[] = (profiles || []).map(
      (profile) => {
        const authUser = usersData.users.find(
          (user) => user.id === profile.id
        );

        return {
          id: profile.id,
          full_name: profile.full_name,
          employee_code: profile.employee_code,
          email: authUser?.email || null,
          is_active: profile.is_active,
          created_at: profile.created_at,
        };
      }
    );

    return {
      success: true,
      message: "",
      admins,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load Admin accounts.",
      admins: [],
    };
  }
}

export async function createAdminAccount(
  formData: FormData
): Promise<CreateAdminResult> {
  const verification = await verifySuperAdmin();

  if (!verification.authorized) {
    return {
      success: false,
      message: verification.message,
    };
  }

  const fullName = String(
    formData.get("full_name") || ""
  ).trim();

  const employeeCode = String(
    formData.get("employee_code") || ""
  )
    .trim()
    .toUpperCase();

  const email = String(
    formData.get("email") || ""
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") || ""
  );

  if (!fullName || !employeeCode || !email || !password) {
    return {
      success: false,
      message:
        "Full name, employee code, email and password are required.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      message:
        "Password must contain at least 8 characters.",
    };
  }

  const adminClient = createAdminClient();

  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("employee_code", employeeCode)
    .maybeSingle();

  if (existingProfile) {
    return {
      success: false,
      message: "This employee code is already in use.",
    };
  }

  const { data: existingAuthUsers } =
    await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  const emailAlreadyExists =
    existingAuthUsers?.users.some(
      (user) => user.email?.toLowerCase() === email
    );

  if (emailAlreadyExists) {
    return {
      success: false,
      message:
        "An account with this email already exists.",
    };
  }

  const {
    data: createdUser,
    error: createUserError,
  } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      employee_code: employeeCode,
      role: "admin",
    },
  });

  if (createUserError || !createdUser.user) {
    return {
      success: false,
      message:
        createUserError?.message ||
        "Unable to create the Admin account.",
    };
  }

  const { error: profileInsertError } =
    await adminClient
      .from("profiles")
      .insert({
        id: createdUser.user.id,
        full_name: fullName,
        employee_code: employeeCode,
        role: "admin",
        is_active: true,
      });

  if (profileInsertError) {
    await adminClient.auth.admin.deleteUser(
      createdUser.user.id
    );

    return {
      success: false,
      message:
        "Admin account could not be completed. The account creation was rolled back.",
    };
  }

  const auditRecorded = await recordAuditSafely({
    action: "admin_created",
    entityType: "profile",
    entityId: createdUser.user.id,
    description:
      `Created Admin account for ${fullName} (${employeeCode}).`,
    metadata: {
      employeeCode,
    },
  });

  return {
    success: true,
    message: auditRecorded
      ? "Admin account created successfully."
      : "Admin account created successfully, but the audit entry could not be recorded.",
  };
}

export async function toggleAdminStatus(
  adminId: string
): Promise<CreateAdminResult> {
  const verification = await verifySuperAdmin();

  if (!verification.authorized) {
    return {
      success: false,
      message: verification.message,
    };
  }

  if (!adminId) {
    return {
      success: false,
      message: "Admin account ID is required.",
    };
  }

  try {
    const adminClient = createAdminClient();

    const {
      data: adminProfile,
      error,
    } = await adminClient
      .from("profiles")
      .select("id, full_name, employee_code, role, is_active")
      .eq("id", adminId)
      .single();

    if (error || !adminProfile) {
      return {
        success: false,
        message: "Admin account was not found.",
      };
    }

    if (adminProfile.role !== "admin") {
      return {
        success: false,
        message:
          "Only Admin accounts can be changed here.",
      };
    }

    const nextIsActive = !adminProfile.is_active;

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ is_active: nextIsActive })
      .eq("id", adminId)
      .eq("role", "admin");

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    const action = nextIsActive
      ? "admin_activated"
      : "admin_deactivated";

    const auditRecorded = await recordAuditSafely({
      action,
      entityType: "profile",
      entityId: adminProfile.id,
      description:
        `${nextIsActive ? "Activated" : "Deactivated"} Admin account for ${adminProfile.full_name || "unnamed user"} (${adminProfile.employee_code || "no employee code"}).`,
      metadata: {
        employeeCode: adminProfile.employee_code,
        previousStatus: adminProfile.is_active,
        newStatus: nextIsActive,
      },
    });

    return {
      success: true,
      message: !auditRecorded
        ? `${nextIsActive ? "Admin account activated" : "Admin account deactivated"}, but the audit entry could not be recorded.`
        : nextIsActive
          ? "Admin account activated."
          : "Admin account deactivated.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update Admin account.",
    };
  }
}
