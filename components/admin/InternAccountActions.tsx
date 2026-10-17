"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Power,
} from "lucide-react";
import { toggleInternStatus } from "@/app/admin/users/actions";

type InternAccountActionsProps = {
  internId: string;
  isActive: boolean;
};

export default function InternAccountActions({
  internId,
  isActive,
}: InternAccountActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleToggle() {
    const action = isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this Intern account?`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await toggleInternStatus(
        internId
      );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setMessage(result.message);

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
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

      {message && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {message}
        </div>
      )}

      {error && (
        <p className="max-w-[220px] text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}