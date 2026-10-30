"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Crosshair,
  MapPin,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  village: string | null;
  district: string | null;
};

export default function AddFieldPage() {
  const router = useRouter();
  const supabase = createClient();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    farmerId: "",
    fieldName: "",
    latitude: "",
    longitude: "",
    boundaryCaptured: "No",
    area: "",
    areaUnit: "",
    landOwnership: "",
    landType: "",
    nearbyWaterSource: "",
    accessCondition: "",
    roadAccess: "",
    specialFeatures: "",
  });

  // Load farmers from Supabase
  useEffect(() => {
    async function loadFarmers() {
      const { data, error } = await supabase
        .from("farmers")
        .select(
          "id, farmer_code, full_name, village, district"
        )
        .order("full_name", { ascending: true });

      if (error) {
        setError("Unable to load farmers.");
        setLoadingFarmers(false);
        return;
      }

      setFarmers(data ?? []);
      setLoadingFarmers(false);
    }

    loadFarmers();
  }, []);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
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

  function captureLocation() {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));

        setLocationLoading(false);
      },
      () => {
        setError(
          "Unable to capture your location. Please allow location access and try again."
        );

        setLocationLoading(false);
      }
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.farmerId) {
      setError("Please select a farmer.");
      return;
    }

    if (!form.fieldName.trim()) {
      setError("Please enter the field name.");
      return;
    }

    if (!form.area.trim()) {
      setError("Please enter the field area.");
      return;
    }

    if (!form.areaUnit) {
      setError("Please select the area unit.");
      return;
    }

    const area = Number(form.area);

    if (Number.isNaN(area) || area <= 0) {
      setError("Field area must be greater than 0.");
      return;
    }

    const latitude = form.latitude
      ? Number(form.latitude)
      : null;

    const longitude = form.longitude
      ? Number(form.longitude)
      : null;

    if (
      (latitude !== null && Number.isNaN(latitude)) ||
      (longitude !== null && Number.isNaN(longitude))
    ) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("fields")
      .insert({
        farmer_id: form.farmerId,
        field_name: form.fieldName.trim(),
        latitude,
        longitude,
        boundary_captured: form.boundaryCaptured === "Yes",
        area,
        area_unit: form.areaUnit,
        land_ownership: form.landOwnership || null,
        land_type: form.landType || null,
        nearby_water_source:
          form.nearbyWaterSource.trim() || null,
        access_condition:
          form.accessCondition || null,
        road_access:
          form.roadAccess || null,
        special_features:
          form.specialFeatures.trim() || null,
        created_by: user.id,
      })
      .select("id, field_code")
      .single();

    if (error) {
      console.error(error);
      setError(error.message);
      setSaving(false);
      return;
    }

    setSuccess(
      `Field ${data.field_code} saved successfully.`
    );

    setSaving(false);

    setTimeout(() => {
      router.push(`/farmers/${form.farmerId}`);
      router.refresh();
    }, 1000);
  }

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Back */}
          <Link
            href="/farmers"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Farmers
          </Link>

          {/* Header */}
          <section className="mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <MapPin size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Field Registration
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Add Field
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Register a field and associate it with an existing farmer.
                </p>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Farmer & Field */}
            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Farmer & Field
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Select the farmer and provide the field name.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                {/* Farmer */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="farmerId"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Farmer <span className="text-red-600">*</span>
                  </label>

                  <select
                    id="farmerId"
                    name="farmerId"
                    value={form.farmerId}
                    onChange={handleChange}
                    disabled={loadingFarmers}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  >
                    <option value="">
                      {loadingFarmers
                        ? "Loading farmers..."
                        : "Select farmer"}
                    </option>

                    {farmers.map((farmer) => (
                      <option
                        key={farmer.id}
                        value={farmer.id}
                      >
                        {farmer.full_name} — {farmer.farmer_code}
                        {farmer.village
                          ? ` — ${farmer.village}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="fieldName"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Field / Local name{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="fieldName"
                    name="fieldName"
                    value={form.fieldName}
                    onChange={handleChange}
                    placeholder="e.g. North Field"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Field Location
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Capture the field location when available.
                </p>
              </div>

              <div className="space-y-5 p-5">

                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locationLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Crosshair size={18} />

                  {locationLoading
                    ? "Capturing location..."
                    : "Capture Current Location"}
                </button>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Latitude */}
                  <div>
                    <label
                      htmlFor="latitude"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Latitude
                    </label>

                    <input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 10.123456"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Longitude */}
                  <div>
                    <label
                      htmlFor="longitude"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Longitude
                    </label>

                    <input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={handleChange}
                      placeholder="e.g. 78.123456"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* Boundary */}
                <div>
                  <label
                    htmlFor="boundaryCaptured"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Field boundary captured?
                  </label>

                  <select
                    id="boundaryCaptured"
                    name="boundaryCaptured"
                    value={form.boundaryCaptured}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Land Details */}
            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Land Details
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Basic physical and ownership details of the field.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                {/* Area */}
                <div>
                  <label
                    htmlFor="area"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Field area{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <input
                    id="area"
                    name="area"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.area}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label
                    htmlFor="areaUnit"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Area unit{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <select
                    id="areaUnit"
                    name="areaUnit"
                    value={form.areaUnit}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Select unit</option>
                    <option value="Sq. Ft">Sq. Ft</option>
                    <option value="Acre">Acre</option>
                    <option value="Cent">Cent</option>
                    <option value="Hectare">Hectare</option>
                  </select>
                </div>

                {/* Ownership */}
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
                    <option value="">Select ownership</option>
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                    <option value="Shared">Shared</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Land Type */}
                <div>
                  <label
                    htmlFor="landType"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Land type
                  </label>

                  <select
                    id="landType"
                    name="landType"
                    value={form.landType}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Select land type</option>
                    <option value="Lowland">Lowland</option>
                    <option value="Upland">Upland</option>
                    <option value="Garden land">Garden land</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Access & Water */}
            <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <h2 className="font-semibold">
                  Water & Access
                </h2>

                <p className="mt-1 text-xs text-[var(--muted)]">
                  Nearby water source and field accessibility.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">

                <div>
                  <label
                    htmlFor="nearbyWaterSource"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Nearby water source
                  </label>

                  <input
                    id="nearbyWaterSource"
                    name="nearbyWaterSource"
                    value={form.nearbyWaterSource}
                    onChange={handleChange}
                    placeholder="e.g. Borewell, pond, canal"
                    className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="accessCondition"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Ease of access
                  </label>

                  <select
                    id="accessCondition"
                    name="accessCondition"
                    value={form.accessCondition}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Select condition</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Difficult">Difficult</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="roadAccess"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Road / transport access
                  </label>

                  <select
                    id="roadAccess"
                    name="roadAccess"
                    value={form.roadAccess}
                    onChange={handleChange}
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Select access</option>
                    <option value="Good">Good</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="specialFeatures"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Special features
                  </label>

                  <textarea
                    id="specialFeatures"
                    name="specialFeatures"
                    value={form.specialFeatures}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any notable field features..."
                    className="w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
            </section>

            {/* Messages */}
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

            {/* Actions */}
            <section className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/farmers"
                className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold text-[var(--text)] transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />

                {saving ? "Saving Field..." : "Save Field"}
              </button>
            </section>
          </form>
        </div>
      </main>
    </InternLayout>
  );
}