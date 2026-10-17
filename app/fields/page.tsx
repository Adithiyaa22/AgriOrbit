"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MapPin,
  Sprout,
  UserRound,
  Ruler,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";

type Field = {
  id: string;
  field_code: string;
  farmer_id: string;
  field_name: string;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  area_unit: string | null;
  land_ownership: string | null;
  land_type: string | null;
};

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  village: string | null;
  district: string | null;
};

type FieldRow = Field & {
  farmer: Farmer | null;
};

export default function FieldsPage() {
  const supabase = createClient();

  const [fields, setFields] = useState<FieldRow[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFields() {
      setLoading(true);
      setError("");

      try {
        /*
         * ---------------------------------------
         * Get fields
         * ---------------------------------------
         */

        const { data: fieldData, error: fieldError } = await supabase
          .from("fields")
          .select(
            `
              id,
              field_code,
              farmer_id,
              field_name,
              latitude,
              longitude,
              area,
              area_unit,
              land_ownership,
              land_type
            `
          )
          .order("created_at", { ascending: false });

        if (fieldError) {
          console.error("Fields fetch error:", fieldError);
          setError(fieldError.message);
          return;
        }

        if (!fieldData || fieldData.length === 0) {
          setFields([]);
          return;
        }

        /*
         * ---------------------------------------
         * Get farmer IDs
         * ---------------------------------------
         */

        const farmerIds = Array.from(
          new Set(
            fieldData
              .map((field) => field.farmer_id)
              .filter(Boolean)
          )
        );

        /*
         * ---------------------------------------
         * Get farmers
         * ---------------------------------------
         */

        let farmerData: Farmer[] = [];

        if (farmerIds.length > 0) {
          const { data, error: farmerError } = await supabase
            .from("farmers")
            .select(
              `
                id,
                farmer_code,
                full_name,
                village,
                district
              `
            )
            .in("id", farmerIds);

          if (farmerError) {
            console.error(
              "Farmer fetch error:",
              farmerError
            );
          } else {
            farmerData = data ?? [];
          }
        }

        /*
         * ---------------------------------------
         * Create farmer lookup
         * ---------------------------------------
         */

        const farmerMap: Record<string, Farmer> = {};

        farmerData.forEach((farmer) => {
          farmerMap[farmer.id] = farmer;
        });

        /*
         * ---------------------------------------
         * Prepare display data
         * ---------------------------------------
         */

        const formattedFields: FieldRow[] = fieldData.map(
          (field) => ({
            ...field,
            farmer: farmerMap[field.farmer_id] ?? null,
          })
        );

        setFields(formattedFields);
      } catch (err) {
        console.error("Unexpected fields error:", err);
        setError(
          "Something went wrong while loading fields."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFields();
  }, [supabase]);

  /*
   * ---------------------------------------
   * Search
   * ---------------------------------------
   */

  const filteredFields = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return fields;
    }

    return fields.filter((field) => {
      const farmer = field.farmer;

      return (
        field.field_name
          .toLowerCase()
          .includes(value) ||
        field.field_code
          .toLowerCase()
          .includes(value) ||
        (farmer?.full_name ?? "")
          .toLowerCase()
          .includes(value) ||
        (farmer?.farmer_code ?? "")
          .toLowerCase()
          .includes(value) ||
        (farmer?.village ?? "")
          .toLowerCase()
          .includes(value) ||
        (farmer?.district ?? "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [search, fields]);

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* -------------------------------- */}
          {/* Page Header */}
          {/* -------------------------------- */}

          <section className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Field Data Collection
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Fields
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  View and manage field records registered
                  by your field team.
                </p>
              </div>

              <Link
                href="/fields/new"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                <Plus size={18} />
                Add Field
              </Link>

            </div>
          </section>

          {/* -------------------------------- */}
          {/* Search */}
          {/* -------------------------------- */}

          <section className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">

            <div className="relative">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by field name, field ID, farmer, village or district..."
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                {loading
                  ? "Loading fields..."
                  : `Showing ${filteredFields.length} of ${fields.length} fields`}
              </p>
            </div>

          </section>

          {/* -------------------------------- */}
          {/* Error */}
          {/* -------------------------------- */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load fields: {error}
            </div>
          )}

          {/* -------------------------------- */}
          {/* Field List */}
          {/* -------------------------------- */}

          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">

            {/* Desktop Header */}

            <div className="hidden grid-cols-[1.4fr_1.8fr_1.5fr_1fr_1.2fr] gap-4 border-b border-[var(--border)] bg-slate-50 px-5 py-3 text-xs font-semibold text-[var(--muted)] lg:grid">

              <span>Field</span>
              <span>Farmer</span>
              <span>Location</span>
              <span>Area</span>
              <span>Land Details</span>

            </div>

            <div className="divide-y divide-[var(--border)]">

              {/* Loading */}

              {loading ? (
                <div className="px-5 py-12 text-center">

                  <p className="text-sm font-medium">
                    Loading fields...
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Fetching field records from
                    Supabase.
                  </p>

                </div>
              ) : filteredFields.length > 0 ? (

                /* Field Records */

                filteredFields.map((field) => {
                  const farmer = field.farmer;

                  return (
                    <Link
                      key={field.id}
                      href={`/fields/${field.field_code}`}
                      className="block transition hover:bg-[var(--light-green)]"
                    >

                      {/* Desktop */}

                      <div className="hidden grid-cols-[1.4fr_1.8fr_1.5fr_1fr_1.2fr] items-center gap-4 px-5 py-4 lg:grid">

                        {/* Field */}

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                            <Sprout size={19} />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold">
                              {field.field_name}
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {field.field_code}
                            </p>

                          </div>

                        </div>

                        {/* Farmer */}

                        <div className="flex items-center gap-2">

                          <UserRound
                            size={15}
                            className="shrink-0 text-[var(--muted)]"
                          />

                          <div className="min-w-0">

                            <p className="truncate text-sm">
                              {farmer?.full_name ||
                                "Unknown farmer"}
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {farmer?.farmer_code ||
                                "—"}
                            </p>

                          </div>

                        </div>

                        {/* Location */}

                        <div className="flex items-start gap-2">

                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                          />

                          <div className="min-w-0">

                            <p className="truncate text-sm">
                              {farmer?.village ||
                                "—"}
                            </p>

                            <p className="mt-1 truncate text-xs text-[var(--muted)]">
                              {farmer?.district ||
                                "—"}
                            </p>

                          </div>

                        </div>

                        {/* Area */}

                        <div className="flex items-center gap-2">

                          <Ruler
                            size={15}
                            className="shrink-0 text-[var(--muted)]"
                          />

                          <p className="text-sm font-medium">
                            {field.area !== null
                              ? `${field.area} ${
                                  field.area_unit ||
                                  ""
                                }`
                              : "—"}
                          </p>

                        </div>

                        {/* Land Details */}

                        <div>

                          <p className="text-sm">
                            {field.land_type ||
                              "Type not specified"}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {field.land_ownership ||
                              "Ownership not specified"}
                          </p>

                        </div>

                      </div>

                      {/* Mobile / Tablet */}

                      <div className="flex items-start gap-3 px-4 py-4 lg:hidden">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                          <Sprout size={19} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold">
                                {field.field_name}
                              </p>

                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {field.field_code}
                              </p>

                            </div>

                            <span className="shrink-0 rounded-full bg-[var(--light-green)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                              {field.area !== null
                                ? `${field.area} ${
                                    field.area_unit ||
                                    ""
                                  }`
                                : "Area —"}
                            </span>

                          </div>

                          <div className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">

                            <p>
                              Farmer:{" "}
                              {farmer?.full_name ||
                                "Unknown farmer"}
                            </p>

                            <p>
                              Farmer ID:{" "}
                              {farmer?.farmer_code ||
                                "—"}
                            </p>

                            <p>
                              Location:{" "}
                              {farmer?.village ||
                                "—"}
                              {farmer?.district
                                ? `, ${farmer.district}`
                                : ""}
                            </p>

                            <p>
                              Land:{" "}
                              {field.land_type ||
                                "Not specified"}
                              {" · "}
                              {field.land_ownership ||
                                "Ownership not specified"}
                            </p>

                            <p>
                              Coordinates:{" "}
                              {field.latitude !== null &&
                              field.longitude !== null
                                ? "Captured"
                                : "Not captured"}
                            </p>

                          </div>

                        </div>

                      </div>

                    </Link>
                  );
                })

              ) : (

                /* Empty */

                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                    <Search size={20} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    No fields found
                  </h3>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {search
                      ? "Try searching with a different field name, field ID, farmer, village or district."
                      : "No fields have been registered yet."}
                  </p>

                  {!search && (
                    <Link
                      href="/fields/new"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Plus size={16} />
                      Add First Field
                    </Link>
                  )}

                </div>
              )}

            </div>
          </section>

        </div>
      </main>
    </InternLayout>
  );
}