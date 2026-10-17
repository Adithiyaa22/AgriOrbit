"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Map,
  MapPin,
  User,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Field = {
  id: string;
  field_code: string;
  farmer_id: string;
  field_name: string | null;
  latitude: number | null;
  longitude: number | null;
  boundary_captured: boolean | null;
  area: number | null;
  area_unit: string | null;
  land_ownership: string | null;
  land_type: string | null;
  nearby_water_source: string | null;
  access_condition: string | null;
  road_access: string | null;
  special_features: string | null;
  created_at: string;
};

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  village: string | null;
  taluk_block: string | null;
  district: string | null;
};

type FieldRow = Field & {
  farmer: Farmer | null;
};

export default function AdminFieldsContent() {
  const [fields, setFields] = useState<FieldRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFields() {
      setLoading(true);
      setError("");

      try {
        const {
          data: fieldData,
          error: fieldError,
        } = await supabase
          .from("fields")
          .select(
            `
              id,
              field_code,
              farmer_id,
              field_name,
              latitude,
              longitude,
              boundary_captured,
              area,
              area_unit,
              land_ownership,
              land_type,
              nearby_water_source,
              access_condition,
              road_access,
              special_features,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (fieldError) {
          throw fieldError;
        }

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
              village,
              taluk_block,
              district
            `
          );

        if (farmerError) {
          throw farmerError;
        }

        const farmerMap: Record<string, Farmer> =
          {};

        ((farmerData || []) as Farmer[]).forEach(
          (farmer) => {
            farmerMap[farmer.id] = farmer;
          }
        );

        const rows: FieldRow[] = (
          fieldData || []
        ).map((field) => ({
          id: field.id,
          field_code: field.field_code,
          farmer_id: field.farmer_id,
          field_name: field.field_name,
          latitude: field.latitude,
          longitude: field.longitude,
          boundary_captured:
            field.boundary_captured,
          area: field.area,
          area_unit: field.area_unit,
          land_ownership: field.land_ownership,
          land_type: field.land_type,
          nearby_water_source:
            field.nearby_water_source,
          access_condition:
            field.access_condition,
          road_access: field.road_access,
          special_features:
            field.special_features,
          created_at: field.created_at,
          farmer:
            farmerMap[field.farmer_id] || null,
        }));

        setFields(rows);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load fields."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFields();
  }, []);

  const filteredFields = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return fields;
    }

    return fields.filter((field) => {
      return [
        field.field_code,
        field.field_name,
        field.area?.toString(),
        field.area_unit,
        field.land_ownership,
        field.land_type,
        field.nearby_water_source,
        field.access_condition,
        field.road_access,
        field.special_features,
        field.farmer?.farmer_code,
        field.farmer?.full_name,
        field.farmer?.village,
        field.farmer?.taluk_block,
        field.farmer?.district,
      ].some((value) =>
        value
          ?.toString()
          .toLowerCase()
          .includes(query)
      );
    });
  }, [fields, search]);

  const gpsCount = useMemo(() => {
    return fields.filter(
      (field) =>
        field.latitude !== null &&
        field.longitude !== null
    ).length;
  }, [fields]);

  const boundaryCount = useMemo(() => {
    return fields.filter(
      (field) => field.boundary_captured === true
    ).length;
  }, [fields]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-green-600">
            Field Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Fields
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            View field records and location information
            collected through field surveys.
          </p>
        </div>

        {/* Total Fields */}
        <div className="flex w-fit items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Map className="h-5 w-5 text-green-700" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Fields
            </p>

            <p className="text-xl font-bold text-slate-900">
              {fields.length}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Map className="h-5 w-5 text-green-700" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Total Fields
              </p>

              <p className="text-xl font-bold text-slate-900">
                {fields.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                GPS Captured
              </p>

              <p className="text-xl font-bold text-slate-900">
                {gpsCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <Map className="h-5 w-5 text-purple-600" />
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">
                Boundaries Captured
              </p>

              <p className="text-xl font-bold text-slate-900">
                {boundaryCount}
              </p>
            </div>
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
            placeholder="Search by field code, field name, farmer, village or district..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
          />
        </div>

        {search && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredFields.length} of{" "}
            {fields.length} fields
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-green-600" />

            <p className="text-sm">
              Loading fields...
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
                Unable to load fields
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
        filteredFields.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Map className="h-6 w-6 text-slate-400" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {fields.length === 0
                  ? "No fields found"
                  : "No matching fields"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {fields.length === 0
                  ? "Field records will appear here after they are registered."
                  : "Try changing your search."}
              </p>
            </div>
          </div>
        )}

      {/* Desktop Table */}
      {!loading &&
        !error &&
        filteredFields.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Field
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Farmer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Area
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Land Type
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      GPS
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredFields.map((field) => (
                    <tr
                      key={field.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      {/* Field */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {field.field_name ||
                              "Unnamed Field"}
                          </p>

                          <p className="mt-1 text-xs font-medium text-green-700">
                            {field.field_code}
                          </p>
                        </div>
                      </td>

                      {/* Farmer */}
                      <td className="px-5 py-4">
                        {field.farmer ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />

                              <p className="text-sm font-semibold text-slate-700">
                                {field.farmer.full_name}
                              </p>
                            </div>

                            <p className="mt-1 text-xs font-medium text-green-700">
                              {
                                field.farmer
                                  .farmer_code
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Farmer unavailable
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {field.farmer?.village ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {[
                                field.farmer
                                  ?.taluk_block,
                                field.farmer
                                  ?.district,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">
                          {field.area !== null
                            ? field.area
                            : "—"}{" "}
                          {field.area_unit || ""}
                        </p>
                      </td>

                      {/* Land Type */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {field.land_type || "—"}
                        </p>
                      </td>

                      {/* GPS */}
                      <td className="px-5 py-4 text-center">
                        {field.latitude !== null &&
                        field.longitude !== null ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Captured
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            <Circle className="h-3.5 w-3.5" />
                            Not captured
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-600">
                          {new Date(
                            field.created_at
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
        filteredFields.length > 0 && (
          <div className="grid gap-4 lg:hidden">
            {filteredFields.map((field) => (
              <div
                key={field.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {field.field_name ||
                        "Unnamed Field"}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-green-700">
                      {field.field_code}
                    </p>
                  </div>

                  {field.latitude !== null &&
                  field.longitude !== null ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      GPS
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      <Circle className="h-3.5 w-3.5" />
                      No GPS
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="mt-4 space-y-3">
                  {/* Farmer */}
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Farmer
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {field.farmer?.full_name ||
                          "Farmer unavailable"}
                      </p>

                      {field.farmer && (
                        <p className="text-xs text-green-700">
                          {
                            field.farmer
                              .farmer_code
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Location
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {field.farmer?.village ||
                          "—"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {[
                          field.farmer?.taluk_block,
                          field.farmer?.district,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Area */}
                  <div>
                    <p className="text-xs text-slate-500">
                      Area
                    </p>

                    <p className="text-sm font-medium text-slate-700">
                      {field.area !== null
                        ? field.area
                        : "—"}{" "}
                      {field.area_unit || ""}
                    </p>
                  </div>

                  {/* Land Type */}
                  <div>
                    <p className="text-xs text-slate-500">
                      Land Type
                    </p>

                    <p className="text-sm text-slate-700">
                      {field.land_type || "—"}
                    </p>
                  </div>

                  {/* Ownership */}
                  <div>
                    <p className="text-xs text-slate-500">
                      Land Ownership
                    </p>

                    <p className="text-sm text-slate-700">
                      {field.land_ownership || "—"}
                    </p>
                  </div>

                  {/* Water */}
                  <div>
                    <p className="text-xs text-slate-500">
                      Nearby Water Source
                    </p>

                    <p className="text-sm text-slate-700">
                      {field.nearby_water_source ||
                        "—"}
                    </p>
                  </div>
                </div>

                {/* Coordinates */}
                {field.latitude !== null &&
                  field.longitude !== null && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        GPS Coordinates
                      </p>

                      <p className="mt-1 text-xs text-slate-700">
                        {field.latitude},{" "}
                        {field.longitude}
                      </p>
                    </div>
                  )}

                {/* Created */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">
                    Created
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {new Date(
                      field.created_at
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
            ))}
          </div>
        )}
    </div>
  );
}