import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  MapPin,
  Phone,
  Sprout,
  User,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import InternLayout from "@/components/layout/InternLayout";

export default async function FarmerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  // Get farmer using the actual farmer UUID
  const {
    data: farmer,
    error: farmerError,
  } = await supabase
    .from("farmers")
    .select("*")
    .eq("id", id)
    .single();

  // Farmer not found
  if (farmerError || !farmer) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

            <Link
              href="/farmers"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Farmers
            </Link>

            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">

              <h1 className="text-lg font-semibold text-red-700">
                Farmer not found
              </h1>

              <p className="mt-2 text-sm text-red-600">
                No farmer record was found for farmer ID:
                {" "}
                {id}
              </p>

            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  // Get fields belonging to this farmer
  const {
    data: fields,
    error: fieldsError,
  } = await supabase
    .from("fields")
    .select("*")
    .eq("farmer_id", farmer.id)
    .order("created_at", {
      ascending: false,
    });

  const farmerFields =
    fieldsError || !fields ? [] : fields;

  // Get surveys belonging to this farmer
  const {
    data: surveys,
    error: surveysError,
  } = await supabase
    .from("surveys")
    .select("*")
    .eq("farmer_id", farmer.id)
    .order("created_at", {
      ascending: false,
    });

  const farmerSurveys =
    surveysError || !surveys ? [] : surveys;

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Back */}

          <Link
            href="/farmers"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--primary)]"
          >
            <ArrowLeft size={18} />
            Back to Farmers
          </Link>

          {/* Page heading */}

          <section className="mb-6">

            <p className="text-sm font-medium text-[var(--primary)]">
              Farmer Profile
            </p>

            <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  {farmer.full_name}
                </h1>

                <p className="mt-1 break-all text-xs text-[var(--muted)]">
                  Farmer ID: {farmer.id}
                </p>

              </div>

              <Link
                href={`/surveys/new?farmer=${farmer.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
              >
                <ClipboardList size={18} />
                Start New Survey
              </Link>

            </div>
          </section>

          {/* Farmer overview */}

          <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">

            {/* Basic information */}

            <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">

                <h2 className="font-semibold">
                  Farmer information
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Basic details about the farmer
                </p>

              </div>

              <div className="space-y-5 p-5">

                {/* Name */}

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <User size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Full name
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.full_name}
                    </p>

                  </div>

                </div>

                {/* Mobile */}

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <Phone size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Mobile number
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.mobile
                        ? `+91 ${farmer.mobile}`
                        : "Not provided"}
                    </p>

                  </div>

                </div>

                {/* Location */}

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <MapPin size={19} />
                  </div>

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.village ||
                        "Not provided"}

                      {farmer.taluk_block
                        ? `, ${farmer.taluk_block}`
                        : ""}
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {farmer.district ||
                        "District not provided"}

                      {farmer.state
                        ? `, ${farmer.state}`
                        : ""}
                    </p>

                  </div>

                </div>

                {/* Age + Experience */}

                <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5">

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Age group
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.age_group ||
                        "Not provided"}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Experience
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.farming_experience_years !==
                        null &&
                      farmer.farming_experience_years !==
                        undefined
                        ? `${farmer.farming_experience_years} years`
                        : "Not provided"}
                    </p>

                  </div>

                </div>

                {/* Farming type + ownership */}

                <div className="grid grid-cols-2 gap-4">

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Farm type
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.farming_type ||
                        "Not provided"}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-[var(--muted)]">
                      Land ownership
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {farmer.land_ownership ||
                        "Not provided"}
                    </p>

                  </div>

                </div>

              </div>
            </div>

            {/* Farming summary */}

            <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">

                <h2 className="font-semibold">
                  Farming summary
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Current farmer and field overview
                </p>

              </div>

              <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">

                {/* Agricultural land */}

                <div className="rounded-lg bg-[var(--light-green)] p-4">

                  <p className="text-xs font-medium text-[var(--muted)]">
                    Agricultural land
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {farmer.total_agricultural_land ??
                      "—"}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Total registered land
                  </p>

                </div>

                {/* Fields */}

                <div className="rounded-lg bg-[var(--light-green)] p-4">

                  <p className="text-xs font-medium text-[var(--muted)]">
                    Fields
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {farmerFields.length}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Registered
                  </p>

                </div>

                {/* Surveys */}

                <div className="rounded-lg bg-[var(--light-green)] p-4">

                  <p className="text-xs font-medium text-[var(--muted)]">
                    Surveys
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {farmerSurveys.length}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Recorded
                  </p>

                </div>

                {/* Main farming activity */}

                <div className="col-span-2 rounded-lg border border-[var(--border)] p-4 sm:col-span-3">

                  <div className="flex items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                      <Sprout size={19} />
                    </div>

                    <div>

                      <p className="text-xs text-[var(--muted)]">
                        Main farming activity
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {farmer.main_farming_activity ||
                          "Not provided"}
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {farmer.main_income_source ||
                          "Primary agricultural income source not provided"}
                      </p>

                    </div>

                  </div>

                </div>

              </div>
            </div>

          </section>

          {/* Registered fields */}

          <section className="mt-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="font-semibold">
                  Registered fields
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Fields associated with this farmer
                </p>

              </div>

              <Link
                href={`/fields/new?farmer=${farmer.id}`}
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                Add field
              </Link>

            </div>

            {farmerFields.length > 0 ? (

              <div className="divide-y divide-[var(--border)]">

                {farmerFields.map((field) => (

                  <div
                    key={field.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                        <MapPin size={19} />
                      </div>

                      <div>

                        <p className="text-sm font-semibold">
                          {field.field_name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {field.area !== null &&
                          field.area !== undefined
                            ? `${field.area} ${
                                field.area_unit || ""
                              }`
                            : "Area not provided"}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {field.land_type ||
                            "Land type not provided"}
                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-3">

                      <span className="text-xs text-[var(--muted)]">
                        {field.latitude !== null &&
                        field.longitude !== null
                          ? "GPS captured"
                          : "GPS not captured"}
                      </span>

                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
                        View field
                        <ChevronRight size={16} />
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              <div className="px-5 py-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                  <MapPin size={20} />
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  No fields registered
                </h3>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Add a field to start collecting field-level
                  information for this farmer.
                </p>

                <Link
                  href={`/fields/new?farmer=${farmer.id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  Add first field
                  <ChevronRight size={16} />
                </Link>

              </div>

            )}

          </section>

          {/* Survey history */}

          <section className="mt-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

            <div className="border-b border-[var(--border)] px-5 py-4">

              <h2 className="font-semibold">
                Survey history
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Previous field data collection records
              </p>

            </div>

            {farmerSurveys.length > 0 ? (

              <div className="divide-y divide-[var(--border)]">

                {farmerSurveys.map((survey) => (

                  <div
                    key={survey.id}
                    className="flex items-center justify-between px-5 py-4"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                        <FileText size={19} />
                      </div>

                      <div>

                        <p className="text-sm font-semibold">
                          Survey
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {survey.status ||
                            "Recorded"}
                        </p>

                      </div>

                    </div>

                    <p className="text-xs text-[var(--muted)]">
                      {survey.submitted_at
                        ? new Date(
                            survey.submitted_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Not submitted"}
                    </p>

                  </div>

                ))}

              </div>

            ) : (

              <div className="px-5 py-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                  <FileText size={20} />
                </div>

                <h3 className="mt-4 text-sm font-semibold">
                  No surveys recorded yet
                </h3>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Survey history will appear here after a survey
                  is recorded for this farmer.
                </p>

              </div>

            )}

          </section>

          {/* Footer information */}

          <section className="mt-6 flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold">
                Farmer record
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                All information shown here is collected through
                field surveys.
              </p>

            </div>

            <div className="break-all text-xs text-[var(--muted)]">
              Farmer ID: {farmer.id}
            </div>

          </section>

        </div>
      </main>
    </InternLayout>
  );
}