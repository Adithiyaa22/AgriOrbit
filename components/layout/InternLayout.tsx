"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Map,
  Menu,
  User,
  Users,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import OfflineStatus from "@/components/survey/OfflineStatus";
import OfflineSyncManager from "@/components/survey/OfflineSyncManager";
import MaintenanceNotice from "@/components/intern/MaintenanceNotice";

type UserRole = "intern" | "admin" | "super_admin";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Farmers",
    href: "/farmers",
    icon: Users,
  },
  {
    label: "New Survey",
    href: "/surveys/new",
    icon: ClipboardList,
    primary: true,
  },
  {
    label: "Fields",
    href: "/fields",
    icon: Map,
  },
  {
    label: "Surveys",
    href: "/surveys",
    icon: ClipboardList,
  },
  {
    label: "Drafts",
    href: "/drafts",
    icon: FileText,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
];

function getRoleDisplay(role: UserRole) {
  switch (role) {
    case "super_admin":
      return {
        name: "Super Admin",
        account: "Super Admin account",
      };

    case "admin":
      return {
        name: "Admin",
        account: "Admin account",
      };

    case "intern":
    default:
      return {
        name: "Field Intern",
        account: "Intern account",
      };
  }
}

function getInitials(fullName: string | null, role: UserRole) {
  if (fullName?.trim()) {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  switch (role) {
    case "super_admin":
      return "SA";

    case "admin":
      return "AD";

    case "intern":
    default:
      return "FI";
  }
}

function Logo() {
  return (
    <div className="agri-3d-card flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--light-green)] shadow-sm">
      <svg
        viewBox="0 0 64 64"
        className="h-6 w-6"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="32"
          cy="32"
          r="29"
          stroke="var(--primary)"
          strokeWidth="4"
        />

        <path
          d="M18 39C25 38 31 32 32 21"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M32 21C41 21 47 27 47 36C47 45 40 50 31 50"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d="M32 29C38 29 42 33 42 39"
          stroke="var(--secondary)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default function InternLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [accountRole, setAccountRole] =
    React.useState<UserRole>("intern");

  const [accountName, setAccountName] =
    React.useState("Field Intern");

  const [accountInitials, setAccountInitials] =
    React.useState("FI");

  const [profileLoading, setProfileLoading] =
    React.useState(true);

  const [mobileMenuOpen, setMobileMenuOpen] =
    React.useState(false);

  React.useEffect(() => {
    async function loadAccountProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data: profile, error } =
          await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

        if (error || !profile) {
          return;
        }

        const role = profile.role as UserRole;

        setAccountRole(role);

        const roleDisplay = getRoleDisplay(role);

        const displayName =
          profile.full_name?.trim() ||
          roleDisplay.name;

        setAccountName(displayName);

        setAccountInitials(
          getInitials(profile.full_name, role)
        );
      } catch (error) {
        console.error(
          "Unable to load account profile:",
          error
        );
      } finally {
        setProfileLoading(false);
      }
    }

    loadAccountProfile();
  }, [supabase]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  const roleDisplay = getRoleDisplay(accountRole);

  return (
    <div className="agri-app-shell relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[8%] top-24 h-24 w-24 rounded-full bg-green-200/20 blur-2xl animate-pulse" />
        <div className="absolute right-[10%] top-[42%] h-32 w-32 rounded-full bg-emerald-200/15 blur-3xl" />
      </div>
      <OfflineSyncManager />

      {/* Desktop sidebar */}

      <aside className="agri-glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--border)] bg-white lg:flex">
        {/* Brand */}

        <div className="flex h-20 items-center gap-3 border-b border-[var(--border)] px-5">
          <Logo />

          <div>
            <p className="font-bold text-[var(--text)]">
              AgriOrbit
            </p>

            <p className="text-xs text-[var(--muted)]">
              Field Data Collection
            </p>
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`agri-3d-card flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
                  item.primary
                    ? "mt-3 bg-[var(--primary)] text-white shadow-sm hover:opacity-90"
                    : active
                      ? "bg-[var(--light-green)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--text)]"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.9}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}

        <div className="border-t border-[var(--border)] p-4">
          <div className="rounded-xl bg-[var(--background)] p-3">
            <div className="mb-3">
              <OfflineStatus />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--light-green)] text-sm font-bold text-[var(--primary)]">
                {profileLoading
                  ? "..."
                  : accountInitials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text)]">
                  {profileLoading
                    ? "Loading..."
                    : accountName}
                </p>

                <p className="text-xs text-[var(--muted)]">
                  {profileLoading
                    ? "Loading account..."
                    : roleDisplay.account}
                </p>
              </div>
            </div>

            <Link
              href="/profile"
              className={`mt-3 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold transition ${
                pathname.startsWith("/profile")
                  ? "bg-[var(--light-green)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:bg-white hover:text-[var(--text)]"
              }`}
            >
              <User size={17} />

              <span>My Profile</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={17} />

              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}

      <header className="agri-glass sticky top-0 z-30 border-b border-[var(--border)] lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />

            <div>
              <p className="font-bold text-[var(--text)]">
                AgriOrbit
              </p>

              <p className="text-[11px] text-[var(--muted)]">
                Field Data Collection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OfflineStatus />

            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              onClick={() =>
                setMobileMenuOpen(
                  (open) => !open
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--background)]"
            >
              {mobileMenuOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-white px-4 py-3 sm:px-6">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(
                    `${item.href}/`
                  );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      item.primary
                        ? "bg-[var(--primary)] text-white"
                        : active
                          ? "bg-[var(--light-green)] text-[var(--primary)]"
                          : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.9}
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--text)]"
                >
                  <User size={19} />
                  <span>My Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={19} />
                  <span>Sign out</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}

      <main className="pb-20 lg:ml-64 lg:pb-0">
        <MaintenanceNotice />
        {children}
      </main>

      {/* Mobile navigation */}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white lg:hidden">
        <div className="grid h-16 grid-cols-7">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
                  item.primary
                    ? "text-[var(--primary)]"
                    : active
                      ? "text-[var(--primary)]"
                      : "text-[var(--muted)]"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.9}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}