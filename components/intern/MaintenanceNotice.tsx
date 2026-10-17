
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Wrench,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Severity = "info" | "warning" | "critical";

type MaintenanceAnnouncement = {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  starts_at: string;
  ends_at: string | null;
};

const severityStyles: Record<
  Severity,
  {
    container: string;
    icon: string;
    Icon: typeof Info;
  }
> = {
  info: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
    Icon: Info,
  },
  warning: {
    container: "border-amber-200 bg-amber-50",
    icon: "text-amber-600",
    Icon: AlertTriangle,
  },
  critical: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-600",
    Icon: AlertCircle,
  },
};

export default function MaintenanceNotice() {
  const supabase = useMemo(() => createClient(), []);
  const [announcements, setAnnouncements] = useState<
    MaintenanceAnnouncement[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      try {
        const { data, error } = await supabase
          .from("maintenance_announcements")
          .select(
            "id, title, message, severity, starts_at, ends_at"
          )
          .eq("is_active", true)
          .order("starts_at", { ascending: false });

        if (error) {
          console.error(
            "Unable to load maintenance announcements:",
            error.message
          );

          if (!cancelled) {
            setAnnouncements([]);
          }

          return;
        }

        if (!cancelled) {
          setAnnouncements(
            (data ?? []) as MaintenanceAnnouncement[]
          );
        }
      } catch (error) {
        console.error(
          "Unexpected error loading maintenance announcements:",
          error
        );

        if (!cancelled) {
          setAnnouncements([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAnnouncements();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  if (loading || announcements.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Maintenance announcements"
      className="mx-auto w-full max-w-7xl space-y-3 px-4 pt-4 sm:px-6 lg:px-8"
    >
      {announcements.map((announcement) => {
        const style = severityStyles[announcement.severity];
        const Icon = style?.Icon ?? Info;
        const containerClass =
          style?.container ?? severityStyles.info.container;
        const iconClass =
          style?.icon ?? severityStyles.info.icon;

        return (
          <div
            key={announcement.id}
            role={
              announcement.severity === "info"
                ? "status"
                : "alert"
            }
            className={`flex items-start gap-3 rounded-xl border p-4 ${containerClass}`}
          >
            <div className={`mt-0.5 shrink-0 ${iconClass}`}>
              {announcement.severity === "critical" ? (
                <Wrench size={21} />
              ) : (
                <Icon size={21} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[var(--text)]">
                {announcement.title}
              </h2>

              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {announcement.message}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {announcement.severity === "critical"
                  ? "Critical notice"
                  : announcement.severity === "warning"
                    ? "Important notice"
                    : "Information"}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
