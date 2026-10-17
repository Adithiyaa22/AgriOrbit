"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  MapPin,
  UserRound,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";

type Farmer = {
  id: string;
  full_name: string;
  mobile: string | null;
  village: string;
  district: string;
};

type FarmerRow = Farmer & {
  fields: number;
  lastSurvey: string;
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<FarmerRow[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadFarmers() {
      setLoading(true);
      setError("");

      try {
        // ---------------------------------
        // Get farmers
        // ---------------------------------

        const {
          data: farmerData,
          error: farmerError,
        } = await supabase
          .from("farmers")
          .select(
            "id, full_name, mobile, village, district"
          )
          .order("created_at", {
            ascending: false,
          });

        if (farmerError) {
          console.error(
            "Farmers fetch error:",
            farmerError
          );

          setError(farmerError.message);
          return;
        }

        if (!farmerData) {
          setFarmers([]);
          return;
        }

        // ---------------------------------
        // Get field records
        // ---------------------------------

        const {
          data: fieldData,
          error: fieldError,
        } = await supabase
          .from("fields")
          .select("farmer_id");

        if (fieldError) {
          console.error(
            "Fields fetch error:",
            fieldError
          );
        }

        // ---------------------------------
        // Count fields for each farmer
        // ---------------------------------

        const fieldCountMap: Record<
          string,
          number
        > = {};

        (fieldData ?? []).forEach((field) => {
          if (!field.farmer_id) return;

          fieldCountMap[field.farmer_id] =
            (fieldCountMap[field.farmer_id] || 0) + 1;
        });

        // ---------------------------------
        // Get survey records
        // ---------------------------------

        const {
          data: surveyData,
          error: surveyError,
        } = await supabase
          .from("surveys")
          .select(
            "farmer_id, submitted_at, created_at, status"
          )
          .order("created_at", {
            ascending: false,
          });

        if (surveyError) {
          console.error(
            "Surveys fetch error:",
            surveyError
          );
        }

        // ---------------------------------
        // Find latest submitted survey
        // for each farmer
        // ---------------------------------

        const lastSurveyMap: Record<
          string,
          string
        > = {};

        (surveyData ?? []).forEach((survey) => {
          if (!survey.farmer_id) return;

          if (
            survey.status === "submitted" &&
            survey.submitted_at
          ) {
            if (
              !lastSurveyMap[survey.farmer_id]
            ) {
              lastSurveyMap[survey.farmer_id] =
                survey.submitted_at;
            }
          }
        });

        // ---------------------------------
        // Prepare display data
        // ---------------------------------

        const formattedFarmers: FarmerRow[] =
          farmerData.map((farmer) => ({
            id: farmer.id,
            full_name: farmer.full_name,
            mobile: farmer.mobile,
            village: farmer.village,
            district: farmer.district,
            fields:
              fieldCountMap[farmer.id] || 0,
            lastSurvey: formatDate(
              lastSurveyMap[farmer.id] ?? null
            ),
          }));

        setFarmers(formattedFarmers);
      } catch (err) {
        console.error(
          "Unexpected farmers error:",
          err
        );

        setError(
          "Something went wrong while loading farmers."
        );
      } finally {
        setLoading(false);
      }
    }

    loadFarmers();
  }, [supabase]);

  // ---------------------------------
  // Search
  // ---------------------------------

  const filteredFarmers = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return farmers;
    }

    return farmers.filter(
      (farmer) =>
        farmer.full_name
          .toLowerCase()
          .includes(value) ||
        farmer.mobile?.includes(value) ||
        farmer.village
          .toLowerCase()
          .includes(value) ||
        farmer.district
          .toLowerCase()
          .includes(value) ||
        farmer.id
          .toLowerCase()
          .includes(value)
    );
  }, [search, farmers]);

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Page Header */}

          <section className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Field Data Collection
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Farmers
                </h1>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Search and manage farmers registered by
                  your field team.
                </p>
              </div>

              <Link
                href="/farmers/new"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                <Plus size={18} />
                Add Farmer
              </Link>

            </div>
          </section>

          {/* Search */}

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
                placeholder="Search by farmer name, mobile, village, district or ID..."
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[var(--muted)]">
                {loading
                  ? "Loading farmers..."
                  : `Showing ${filteredFarmers.length} of ${farmers.length} farmers`}
              </p>
            </div>

          </section>

          {/* Error */}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Failed to load farmers: {error}
            </div>
          )}

          {/* Farmer List */}

          <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">

            {/* Desktop Header */}

            <div className="hidden grid-cols-[2fr_1.4fr_1.5fr_1fr_1.2fr] gap-4 border-b border-[var(--border)] bg-slate-50 px-5 py-3 text-xs font-semibold text-[var(--muted)] lg:grid">

              <span>Farmer</span>
              <span>Location</span>
              <span>Mobile</span>
              <span>Fields</span>
              <span>Last Survey</span>

            </div>

            <div className="divide-y divide-[var(--border)]">

              {/* Loading */}

              {loading ? (
                <div className="px-5 py-12 text-center">

                  <p className="text-sm font-medium">
                    Loading farmers...
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Fetching farmer records from
                    Supabase.
                  </p>

                </div>
              ) : filteredFarmers.length > 0 ? (

                /* Farmers */

                filteredFarmers.map((farmer) => (
                  <Link
                    key={farmer.id}
                    href={`/farmers/${farmer.id}`}
                    className="block transition hover:bg-[var(--light-green)]"
                  >

                    {/* Desktop */}

                    <div className="hidden grid-cols-[2fr_1.4fr_1.5fr_1fr_1.2fr] items-center gap-4 px-5 py-4 lg:grid">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {farmer.full_name}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {farmer.id}
                          </p>
                        </div>

                      </div>

                      <div className="flex items-start gap-2">

                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-[var(--muted)]"
                        />

                        <div>
                          <p className="text-sm">
                            {farmer.village}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {farmer.district}
                          </p>
                        </div>

                      </div>

                      <p className="text-sm">
                        {farmer.mobile || "—"}
                      </p>

                      <p className="text-sm font-medium">
                        {farmer.fields}
                      </p>

                      <p className="text-sm text-[var(--muted)]">
                        {farmer.lastSurvey}
                      </p>

                    </div>

                    {/* Mobile / Tablet */}

                    <div className="flex items-start gap-3 px-4 py-4 lg:hidden">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <p className="text-sm font-semibold">
                              {farmer.full_name}
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {farmer.id}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-[var(--light-green)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                            {farmer.fields}{" "}
                            {farmer.fields === 1
                              ? "field"
                              : "fields"}
                          </span>

                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-[var(--muted)]">

                          <p>
                            {farmer.village},{" "}
                            {farmer.district}
                          </p>

                          <p>
                            {farmer.mobile ||
                              "No mobile number"}
                          </p>

                          <p>
                            Last survey:{" "}
                            {farmer.lastSurvey}
                          </p>

                        </div>

                      </div>

                    </div>

                  </Link>
                ))

              ) : (

                /* Empty */

                <div className="px-5 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                    <Search size={20} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    No farmers found
                  </h3>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {search
                      ? "Try searching with a different name, mobile number, village, district or ID."
                      : "No farmers have been registered yet."}
                  </p>

                </div>
              )}

            </div>
          </section>

        </div>
      </main>
    </InternLayout>
  );
}