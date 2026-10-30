"use client";

import {
  BarChart3,
  ClipboardList,
  FileDown,
  FileText,
  Home,
  Image,
  LogOut,
  Menu,
  Mic,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  UsersRound,
  X,
  Map,
} from "lucide-react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type AdminRole = "admin" | "super_admin";

type AdminLayoutProps = {
  children: React.ReactNode;

  role: AdminRole;

  profile: {
    full_name: string | null;
    employee_code: string | null;
    role: AdminRole;
  };
};

const adminNavigation = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    label: "Farmers",
    href: "/admin/farmers",
    icon: UsersRound,
  },
  {
    label: "Fields",
    href: "/admin/fields",
    icon: Map,
  },
  {
    label: "Surveys",
    href: "/admin/surveys",
    icon: ClipboardList,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    label: "Export",
    href: "/admin/export",
    icon: FileDown,
  },
  {
    label: "Photos",
    href: "/admin/photos",
    icon: Image,
  },
  {
    label: "Voice Library",
    href: "/admin/voice",
    icon: Mic,
  },
  {
    label: "Survey Builder",
    href: "/admin/survey-builder",
    icon: FileText,
  },
  {
    label: "Users & Roles",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ShieldCheck,
  },
];

const superAdminNavigation = [
  {
    label: "Super Admin",
    href: "/super-admin",
    icon: ShieldCheck,
  },
  {
    label: "Admin Accounts",
    href: "/super-admin/users",
    icon: Users,
  },
];

export default function AdminLayout({
  children,
  role,
  profile,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const navigation =
    role === "super_admin"
      ? [
          ...superAdminNavigation,
          ...adminNavigation,
        ]
      : adminNavigation;

  async function handleLogout() {
    setLoggingOut(true);

    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  return (
    <div className="agri-admin-scene min-h-screen bg-[var(--background)]">

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-[var(--border)] px-5">
          <Link
            href={
              role === "super_admin"
                ? "/super-admin"
                : "/admin"
            }
            className="flex items-center gap-3"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--light-green)]">
              <svg
                viewBox="0 0 64 64"
                className="h-7 w-7"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
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

            <div>
              <h1 className="text-lg font-bold text-[var(--text)]">
                AgriOrbit
              </h1>

              <p className="text-xs text-[var(--muted)]">
                {role === "super_admin"
                  ? "Super Admin"
                  : "Admin Portal"}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--background)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">

            {navigation.map((item) => {
              const Icon = item.icon;

              const active = isActive(
                item.href
              );

              const itemLabel =
                role === "super_admin" &&
                item.href === "/admin/users"
                  ? "Intern Accounts"
                  : item.label;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileMenuOpen(false)
                  }
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--light-green)] text-[var(--primary)]"
                      : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon
                    className="h-5 w-5 shrink-0"
                    strokeWidth={1.9}
                  />

                  <span>{itemLabel}</span>
                </Link>
              );
            })}

            {/* Profile */}
            <Link
              href="/profile"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive("/profile")
                  ? "bg-[var(--light-green)] text-[var(--primary)]"
                  : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--text)]"
              }`}
            >
              <UserRound
                className="h-5 w-5 shrink-0"
                strokeWidth={1.9}
              />

              <span>Profile</span>
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-[var(--border)] p-4">

          <div className="mb-3 rounded-xl bg-[var(--background)] p-3">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--light-green)] text-sm font-bold text-[var(--primary)]">
                {profile.full_name
                  ? profile.full_name
                      .split(" ")
                      .map(
                        (part) =>
                          part[0]
                      )
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "AO"}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--text)]">
                  {profile.full_name ||
                    "User"}
                </p>

                <p className="truncate text-xs text-[var(--muted)]">
                  {profile.employee_code ||
                    "No employee ID"}
                </p>
              </div>
            </div>

            <span className="mt-3 inline-flex rounded-full bg-[var(--light-green)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
              {role === "super_admin"
                ? "Super Admin"
                : "Admin"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut
              className="h-5 w-5"
              strokeWidth={1.9}
            />

            <span>
              {loggingOut
                ? "Signing out..."
                : "Sign out"}
            </span>
          </button>
        </div>
      </aside>

      {/* Desktop / mobile header */}
      <div className="lg:pl-72">

        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-[var(--border)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(true)
            }
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--background)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="ml-3 flex items-center gap-2 lg:ml-0">
            <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)] sm:flex">
              <ShieldCheck size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                {role === "super_admin"
                  ? "Super Admin Portal"
                  : "Admin Portal"}
              </p>

              <p className="hidden text-xs text-[var(--muted)] sm:block">
                AgriOrbit Management
              </p>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}