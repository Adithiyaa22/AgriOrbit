"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import { createInternAccount } from "@/app/admin/users/actions";

export default function CreateInternButton() {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function resetForm() {
    setFullName("");
    setEmployeeCode("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function handleClose() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("full_name", fullName.trim());
      formData.append(
        "employee_code",
        employeeCode.trim().toUpperCase()
      );
      formData.append("email", email.trim());
      formData.append("password", password);

      const result =
        await createInternAccount(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);

      setTimeout(() => {
        setOpen(false);
        resetForm();
        router.refresh();
      }, 1000);
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256628]"
      >
        <Plus className="h-4 w-4" />
        Create Intern
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                  <UserPlus className="h-5 w-5 text-[#2E7D32]" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-[#1E293B]">
                    Create Intern
                  </h2>

                  <p className="text-xs text-[#64748B]">
                    Add a new field enumerator account
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#F1F5F9] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              <div>
                <label
                  htmlFor="intern-full-name"
                  className="mb-1.5 block text-sm font-medium text-[#1E293B]"
                >
                  Full name
                </label>

                <input
                  id="intern-full-name"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter full name"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9] disabled:bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="intern-employee-code"
                  className="mb-1.5 block text-sm font-medium text-[#1E293B]"
                >
                  Employee code
                </label>

                <input
                  id="intern-employee-code"
                  type="text"
                  value={employeeCode}
                  onChange={(event) =>
                    setEmployeeCode(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="Example: INT-0002"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9] disabled:bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="intern-email"
                  className="mb-1.5 block text-sm font-medium text-[#1E293B]"
                >
                  Email address
                </label>

                <input
                  id="intern-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="intern@example.com"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9] disabled:bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label
                  htmlFor="intern-password"
                  className="mb-1.5 block text-sm font-medium text-[#1E293B]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="intern-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 pr-11 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9] disabled:bg-[#F8FAFC]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="intern-confirm-password"
                  className="mb-1.5 block text-sm font-medium text-[#1E293B]"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <input
                    id="intern-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 pr-11 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9] disabled:bg-[#F8FAFC]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#64748B] hover:bg-[#F1F5F9]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-[#F8FAFC] px-4 py-3 text-xs leading-5 text-[#64748B]">
                The new account will be created with the{" "}
                <span className="font-semibold text-[#2E7D32]">
                  Intern
                </span>{" "}
                role and activated immediately.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256628] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Intern
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}