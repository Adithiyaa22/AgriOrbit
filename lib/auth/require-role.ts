import { redirect } from "next/navigation";
import { getCurrentUser } from "./get-current-user";

export type UserRole =
  | "intern"
  | "admin"
  | "super_admin";

function redirectToRoleHome(role: UserRole) {
  if (role === "super_admin") {
    redirect("/super-admin");
  }

  if (role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function requireRole(
  ...requiredRoles: UserRole[]
) {
  const { user, profile } = await getCurrentUser();

  const userRole = profile.role as UserRole;

  if (!requiredRoles.includes(userRole)) {
    redirectToRoleHome(userRole);
  }

  return {
    user,
    profile,
  };
}