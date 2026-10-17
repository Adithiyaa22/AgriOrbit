
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Severity = "info" | "warning" | "critical";

type Announcement = {
  id: string;
  title: string;
  message: string;
  severity: Severity;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AnnouncementForm = {
  title: string;
  message: string;
  severity: Severity;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const emptyForm: AnnouncementForm = {
  title: "",
  message: "",
  severity: "info",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string | null) {
  if (!value) return "No end date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getScheduleStatus(item: Announcement) {
  const now = Date.now();
  const start = new Date(item.starts_at).getTime();
  const end = item.ends_at
    ? new Date(item.ends_at).getTime()
    : null;

  if (!item.is_active) {
    return { label: "Inactive", className: "bg-slate-100 text-slate-600" };
  }

  if (start > now) {
    return { label: "Scheduled", className: "bg-blue-50 text-blue-700" };
  }

  if (end !== null && end <= now) {
    return { label: "Expired", className: "bg-slate-100 text-slate-600" };
  }

  return { label: "Published", className: "bg-green-50 text-green-700" };
}

function severityClasses(severity: Severity) {
  if (severity === "critical") {
    return {
      badge: "bg-red-50 text-red-700",
      border: "border-red-200",
      icon: "text-red-600",
      label: "Critical",
    };
  }

  if (severity === "warning") {
    return {
      badge: "bg-amber-50 text-amber-700",
      border: "border-amber-200",
      icon: "text-amber-600",
      label: "Warning",
    };
  }

  return {
    badge: "bg-blue-50 text-blue-700",
    border: "border-blue-200",
    icon: "text-blue-600",
    label: "Information",
  };
}

export default function AdminSettingsContent() {
  const supabase = useMemo(() => createClient(), []);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const { data, error } = await supabase
      .from("maintenance_announcements")
      .select(
        "id, title, message, severity, starts_at, ends_at, is_active, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(
        "Could not load maintenance announcements. Please refresh the page or check the database policies."
      );
      setAnnouncements([]);
    } else {
      setAnnouncements((data ?? []) as Announcement[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  function openCreateForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      starts_at: toLocalDateTime(new Date().toISOString()),
    });
    setFormError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  }

  function openEditForm(item: Announcement) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      message: item.message,
      severity: item.severity,
      starts_at: toLocalDateTime(item.starts_at),
      ends_at: toLocalDateTime(item.ends_at),
      is_active: item.is_active,
    });
    setFormError(null);
    setSuccessMessage(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title || !message) {
      setFormError("Enter both a title and a message.");
      return;
    }

    if (!form.starts_at) {
      setFormError("Choose a start date and time.");
      return;
    }

    const startDate = new Date(form.starts_at);
    const endDate = form.ends_at
      ? new Date(form.ends_at)
      : null;

    if (Number.isNaN(startDate.getTime())) {
      setFormError("The start date is invalid.");
      return;
    }

    if (
      endDate &&
      (Number.isNaN(endDate.getTime()) ||
        endDate.getTime() <= startDate.getTime())
    ) {
      setFormError("The end date must be later than the start date.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setFormError("Your session has expired. Please sign in again.");
        return;
      }

      const payload = {
        title,
        message,
        severity: form.severity,
        starts_at: startDate.toISOString(),
        ends_at: endDate ? endDate.toISOString() : null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("maintenance_announcements")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          setFormError(error.message);
          return;
        }

        setSuccessMessage("Announcement updated.");
      } else {
        const { error } = await supabase
          .from("maintenance_announcements")
          .insert({
            ...payload,
            created_by: user.id,
          });

        if (error) {
          setFormError(error.message);
          return;
        }

        setSuccessMessage("Announcement created.");
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadAnnouncements();
    } catch {
      setFormError("Something went wrong while saving the announcement.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAnnouncement(item: Announcement) {
    setChangingId(item.id);
    setLoadError(null);
    setSuccessMessage(null);

    const { error } = await supabase
      .from("maintenance_announcements")
      .update({
        is_active: !item.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      setLoadError("Could not update the announcement status.");
    } else {
      setSuccessMessage(
        item.is_active
          ? "Announcement deactivated."
          : "Announcement activated."
      );

      await loadAnnouncements();
    }

    setChangingId(null);
  }

  const publishedCount = announcements.filter(
    (item) => getScheduleStatus(item).label === "Published"
  ).length;

  const scheduledCount = announcements.filter(
    (item) => getScheduleStatus(item).label === "Scheduled"
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <ShieldAlert className="h-4 w-4" />
            Administration
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage system maintenance notices and communicate planned
            downtime or important system updates to field interns.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#256628] focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          New announcement
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total announcements</p>
            <Bell className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {announcements.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Currently published</p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Scheduled</p>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {scheduledCount}
          </p>
        </div>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit announcement" : "Create announcement"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Interns will see active announcements only during their
                scheduled time window.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              aria-label="Close form"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="announcement-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Announcement title
                </label>
                <input
                  id="announcement-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  maxLength={150}
                  required
                  placeholder="Example: Scheduled maintenance"
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="announcement-message"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Message for interns
                </label>
                <textarea
                  id="announcement-message"
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                  required
                  rows={4}
                  maxLength={3000}
                  placeholder="Explain what is changing and whether interns need to take any action."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-severity"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Severity
                </label>
                <select
                  id="announcement-severity"
                  value={form.severity}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      severity: event.target.value as Severity,
                    })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >
                  <option value="info">Information</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="announcement-start"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Start date and time
                </label>
                <input
                  id="announcement-start"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) =>
                    setForm({ ...form, starts_at: event.target.value })
                  }
                  required
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-end"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  End date and time (optional)
                </label>
                <input
                  id="announcement-end"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) =>
                    setForm({ ...form, ends_at: event.target.value })
                  }
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leave blank if the announcement has no scheduled end.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <input
                  id="announcement-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({ ...form, is_active: event.target.checked })
                  }
                  className="h-4 w-4 accent-green-700"
                />
                <label
                  htmlFor="announcement-active"
                  className="text-sm font-medium text-slate-700"
                >
                  Announcement is active
                </label>
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-5 py-2 text-sm font-semibold text-white hover:bg-[#256628] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Publish announcement"}
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Maintenance announcements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage notices shown to active intern accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadAnnouncements()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="rounded-full bg-green-50 p-4">
              <Bell className="h-7 w-7 text-green-700" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              No announcements yet
            </h3>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Create a notice to inform interns about planned maintenance,
              temporary interruptions, or important system updates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((item) => {
              const severity = severityClasses(item.severity);
              const status = getScheduleStatus(item);

              return (
                <article key={item.id} className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${severity.badge}`}
                        >
                          {item.severity === "critical" ? (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          ) : item.severity === "warning" ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Bell className="h-3.5 w-3.5" />
                          )}
                          {severity.label}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-base font-semibold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>

                      <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
                        <span>Starts: {formatDate(item.starts_at)}</span>
                        <span>Ends: {formatDate(item.ends_at)}</span>
                        <span>Created: {formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(item)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleAnnouncement(item)}
                        disabled={changingId === item.id}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {changingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : item.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-700" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {item.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
