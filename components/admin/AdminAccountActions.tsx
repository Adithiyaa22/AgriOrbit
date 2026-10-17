"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Power,
} from "lucide-react";
import { toggleAdminStatus } from "@/app/super-admin/users/actions";

type AdminAccountActionsProps = {
  adminId: string;
  isActive: boolean;
};

export default function AdminAccountActions({
  adminId,
  isActive,
}: AdminAccountActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    const action = isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this Admin account?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result =
        await toggleAdminStatus(adminId);

      if (!result.success) {
        setError(result.message);
        return;
      }

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update Admin account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isActive
            ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
            : "border-green-200 bg-white text-green-700 hover:bg-green-50"
        }`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}

        {loading
          ? "Updating..."
          : isActive
          ? "Deactivate"
          : "Activate"}
      </button>

      {error && (
        <p className="max-w-48 text-right text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}