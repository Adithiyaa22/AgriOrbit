"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  UserRound,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";

export default function AddFarmerPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    ageGroup: "",
    gender: "",
    village: "",
    taluk: "",
    district: "",
    state: "Tamil Nadu",
    farmingExperience: "",
    farmingType: "",
    landOwnership: "",
    totalLand: "",
    numberOfFields: "",
    mainFarmingActivity: "",
    mainIncomeSource: "",
    trainingSupport: "",
    informationSource: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please enter the farmer's name.");
      return;
    }

    if (!form.mobile.trim()) {
      setError("Please enter the farmer's mobile number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobile)) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    if (!form.village.trim()) {
      setError("Please enter the village.");
      return;
    }

    if (!form.district.trim()) {
      setError("Please enter the district.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const { data, error: insertError } = await supabase
        .from("farmers")
        .insert({
          full_name: form.name.trim(),
          mobile: form.mobile.trim(),
          age_group: form.ageGroup || null,
          gender: form.gender || null,

          village: form.village.trim(),
          taluk_block: form.taluk.trim() || null,
          district: form.district.trim(),
          state: form.state.trim() || null,

          farming_experience_years:
            form.farmingExperience
              ? Number(form.farmingExperience)
              : null,

          farming_type:
            form.farmingType || null,

          land_ownership:
            form.landOwnership || null,

          total_agricultural_land:
            form.totalLand
              ? Number(form.totalLand)
              : null,

          number_of_fields:
            form.numberOfFields
              ? Number(form.numberOfFields)
              : null,

          main_farming_activity:
            form.mainFarmingActivity.trim() || null,

          main_income_source:
            form.mainIncomeSource.trim() || null,

          training_support:
            form.trainingSupport || null,

          information_source:
            form.informationSource || null,

          created_by: user.id,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          "Farmer insert error:",
          insertError
        );

        setError(insertError.message);
        return;
      }

      if (!data) {
        setError(
          "Farmer was saved, but the created farmer record could not be retrieved."
        );
        return;
      }

      setSuccess(
        "Farmer saved successfully."
      );

      setTimeout(() => {
        router.push(`/farmers/${data.id}`);
        router.refresh();
      }, 800);
    } catch (err) {
      console.error(
        "Unexpected error:",
        err
      );

      setError(
        "Something went wrong while saving the farmer."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

          <Link
            href="/farmers"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Farmers
          </Link>

          <section className="mb-6">
            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <UserRound size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Farmer Registration
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Add Farmer
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Register a farmer before collecting field and survey
                  information.
                </p>
              </div>

            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* Basic Information */}

            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Basic Information
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Basic identification details of the farmer.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Farmer name{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter farmer name"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobile"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Mobile number{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ageGroup"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Age group
                  </label>

                  <select
                    id="ageGroup"
                    name="ageGroup"
                    value={form.ageGroup}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select age group
                    </option>
                    <option value="Below 25">
                      Below 25
                    </option>
                    <option value="25-34">
                      25–34
                    </option>
                    <option value="35-44">
                      35–44
                    </option>
                    <option value="45-54">
                      45–54
                    </option>
                    <option value="55-64">
                      55–64
                    </option>
                    <option value="65 and above">
                      65 and above
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Gender
                  </label>

                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select gender
                    </option>
                    <option value="Male">
                      Male
                    </option>
                    <option value="Female">
                      Female
                    </option>
                    <option value="Other">
                      Other
                    </option>
                    <option value="Prefer not to say">
                      Prefer not to say
                    </option>
                  </select>
                </div>

              </div>
            </section>

            {/* Location */}

            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Location
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Administrative location of the farmer.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="village"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Village{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="village"
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    placeholder="Enter village"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="taluk"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Taluk / Block
                  </label>

                  <input
                    id="taluk"
                    name="taluk"
                    value={form.taluk}
                    onChange={handleChange}
                    placeholder="Enter taluk or block"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="district"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    District{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="district"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    placeholder="Enter district"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    State
                  </label>

                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm outline-none"
                  />
                </div>

              </div>
            </section>

            {/* Farming Profile */}

            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Farming Profile
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Farming experience, land ownership and primary activities.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="farmingExperience"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Farming experience (years)
                  </label>

                  <input
                    id="farmingExperience"
                    name="farmingExperience"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.farmingExperience}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="farmingType"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Farming type
                  </label>

                  <select
                    id="farmingType"
                    name="farmingType"
                    value={form.farmingType}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select farming type
                    </option>
                    <option value="Full-time">
                      Full-time
                    </option>
                    <option value="Part-time">
                      Part-time
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="landOwnership"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Land ownership
                  </label>

                  <select
                    id="landOwnership"
                    name="landOwnership"
                    value={form.landOwnership}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select ownership
                    </option>
                    <option value="Own">
                      Own
                    </option>
                    <option value="Lease">
                      Lease
                    </option>
                    <option value="Both">
                      Both
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="totalLand"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Total agricultural land
                  </label>

                  <input
                    id="totalLand"
                    name="totalLand"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalLand}
                    onChange={handleChange}
                    placeholder="Enter land area"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Land unit will be captured during field registration.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="numberOfFields"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Number of fields
                  </label>

                  <input
                    id="numberOfFields"
                    name="numberOfFields"
                    type="number"
                    min="0"
                    value={form.numberOfFields}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="mainFarmingActivity"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Main farming activity
                  </label>

                  <input
                    id="mainFarmingActivity"
                    name="mainFarmingActivity"
                    value={form.mainFarmingActivity}
                    onChange={handleChange}
                    placeholder="e.g. Crop farming"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="mainIncomeSource"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Main agricultural income source
                  </label>

                  <input
                    id="mainIncomeSource"
                    name="mainIncomeSource"
                    value={form.mainIncomeSource}
                    onChange={handleChange}
                    placeholder="Enter main agricultural income source"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

              </div>
            </section>

            {/* Support & Information */}

            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Support & Information
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Existing support and common sources of farming information.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="trainingSupport"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Training / extension support
                  </label>

                  <select
                    id="trainingSupport"
                    name="trainingSupport"
                    value={form.trainingSupport}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select option
                    </option>
                    <option value="Yes">
                      Yes
                    </option>
                    <option value="No">
                      No
                    </option>
                    <option value="Don't know">
                      Don't know
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="informationSource"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Usual farming information source
                  </label>

                  <select
                    id="informationSource"
                    name="informationSource"
                    value={form.informationSource}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">
                      Select source
                    </option>
                    <option value="Other farmers">
                      Other farmers
                    </option>
                    <option value="Agriculture department">
                      Agriculture department
                    </option>
                    <option value="Agriculture officer">
                      Agriculture officer
                    </option>
                    <option value="Input dealer">
                      Input dealer
                    </option>
                    <option value="Family members">
                      Family members
                    </option>
                    <option value="Internet / Social media">
                      Internet / Social media
                    </option>
                    <option value="TV / Radio">
                      TV / Radio
                    </option>
                    <option value="Training / Extension">
                      Training / Extension
                    </option>
                    <option value="Other">
                      Other
                    </option>
                    <option value="Don't know">
                      Don't know
                    </option>
                  </select>
                </div>

              </div>
            </section>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <section className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <Link
                href="/farmers"
                className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {loading ? "Saving..." : "Save Farmer"}
              </button>

            </section>

          </form>
        </div>
      </main>
    </InternLayout>
  );
}