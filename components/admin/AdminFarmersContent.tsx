"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  MapPin,
  Phone,
  Map,
  Eye,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  mobile: string | null;
  village: string | null;
  taluk_block: string | null;
  district: string | null;
  state: string | null;
  created_at: string;
};

type FieldRow = {
  farmer_id: string;
};

type FarmerRow = Farmer & {
  fieldCount: number;
};

export default function AdminFarmersContent() {
  const [farmers, setFarmers] = useState<FarmerRow[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFarmers() {
      setLoading(true);
      setError("");

      try {
        const {
          data: farmerData,
          error: farmerError,
        } = await supabase
          .from("farmers")
          .select(
            `
              id,
              farmer_code,
              full_name,
              mobile,
              village,
              taluk_block,
              district,
              state,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (farmerError) {
          throw farmerError;
        }

        const {
          data: fieldData,
          error: fieldError,
        } = await supabase
          .from("fields")
          .select("farmer_id");

        if (fieldError) {
          throw fieldError;
        }

        const fieldCounts: Record<string, number> =
          {};

        ((fieldData || []) as FieldRow[]).forEach(
          (field) => {
            fieldCounts[field.farmer_id] =
              (fieldCounts[field.farmer_id] || 0) + 1;
          }
        );

        const rows: FarmerRow[] = (
          farmerData || []
        ).map((farmer) => ({
          id: farmer.id,
          farmer_code: farmer.farmer_code,
          full_name: farmer.full_name,
          mobile: farmer.mobile,
          village: farmer.village,
          taluk_block: farmer.taluk_block,
          district: farmer.district,
          state: farmer.state,
          created_at: farmer.created_at,
          fieldCount:
            fieldCounts[farmer.id] || 0,
        }));

        setFarmers(rows);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load farmers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFarmers();
  }, []);

  const filteredFarmers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return farmers;
    }

    return farmers.filter((farmer) => {
      return [
        farmer.farmer_code,
        farmer.full_name,
        farmer.mobile,
        farmer.village,
        farmer.taluk_block,
        farmer.district,
        farmer.state,
      ].some((value) =>
        value?.toLowerCase().includes(query)
      );
    });
  }, [farmers, search]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-green-600">
            Farmer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Farmers
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            View and manage farmer records collected
            through field surveys.
          </p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Users className="h-5 w-5 text-green-700" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Farmers
            </p>

            <p className="text-xl font-bold text-slate-900">
              {farmers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by farmer code, name, mobile, village or district..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
          />
        </div>

        {search && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredFarmers.length} of{" "}
            {farmers.length} farmers
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-green-600" />

            <p className="text-sm">
              Loading farmers...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load farmers
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        !error &&
        filteredFarmers.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {farmers.length === 0
                  ? "No farmers found"
                  : "No matching farmers"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {farmers.length === 0
                  ? "Farmer records will appear here after they are added."
                  : "Try changing your search."}
              </p>
            </div>
          </div>
        )}

      {/* Desktop Table */}
      {!loading &&
        !error &&
        filteredFarmers.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Farmer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fields
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredFarmers.map((farmer) => (
                    <tr
                      key={farmer.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {farmer.full_name}
                          </p>

                          <p className="mt-1 text-xs font-medium text-green-700">
                            {farmer.farmer_code}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {farmer.mobile ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4 text-slate-400" />
                            {farmer.mobile}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not provided
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {farmer.village || "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {[
                                farmer.taluk_block,
                                farmer.district,
                              ]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <Map className="h-3.5 w-3.5" />
                          {farmer.fieldCount}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {new Date(
                            farmer.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/farmers/${farmer.farmer_code}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Mobile / Tablet Cards */}
      {!loading &&
        !error &&
        filteredFarmers.length > 0 && (
          <div className="grid gap-4 lg:hidden">
            {filteredFarmers.map((farmer) => (
              <div
                key={farmer.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {farmer.full_name}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-green-700">
                      {farmer.farmer_code}
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <Map className="h-3.5 w-3.5" />
                    {farmer.fieldCount}{" "}
                    {farmer.fieldCount === 1
                      ? "Field"
                      : "Fields"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Mobile
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {farmer.mobile ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Location
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {farmer.village || "—"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {[
                          farmer.taluk_block,
                          farmer.district,
                          farmer.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Created
                    </p>

                    <p className="text-sm text-slate-700">
                      {new Date(
                        farmer.created_at
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Link
                    href={`/farmers/${farmer.farmer_code}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    <Eye className="h-4 w-4" />
                    View Farmer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}