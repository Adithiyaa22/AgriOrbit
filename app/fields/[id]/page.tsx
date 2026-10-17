"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Sprout,
  UserRound,
  Ruler,
  Droplets,
  Route,
  Pencil,
  Save,
  X,
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
  boundary_captured: boolean;
  area: number | null;
  area_unit: string | null;
  land_ownership: string | null;
  land_type: string | null;
  nearby_water_source: string | null;
  access_condition: string | null;
  road_access: string | null;
  special_features: string | null;
  created_at: string | null;
};

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  mobile: string | null;
  village: string | null;
  taluk_block: string | null;
  district: string | null;
  state: string | null;
};

type FieldPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EditForm = {
  fieldName: string;
  latitude: string;
  longitude: string;
  boundaryCaptured: boolean;
  area: string;
  areaUnit: string;
  landOwnership: string;
  landType: string;
  nearbyWaterSource: string;
  accessCondition: string;
  roadAccess: string;
  specialFeatures: string;
};

export default function FieldDetailsPage({
  params,
}: FieldPageProps) {
  const supabase = createClient();

  const [field, setField] = useState<Field | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState<EditForm>({
    fieldName: "",
    latitude: "",
    longitude: "",
    boundaryCaptured: false,
    area: "",
    areaUnit: "",
    landOwnership: "",
    landType: "",
    nearbyWaterSource: "",
    accessCondition: "",
    roadAccess: "",
    specialFeatures: "",
  });

  // --------------------------------------------------
  // Load field
  // --------------------------------------------------

  useEffect(() => {
    async function loadField() {
      setLoading(true);
      setError("");

      try {
        const { id } = await params;

        // ---------------------------------------
        // Get field
        // ---------------------------------------

        const { data: fieldData, error: fieldError } =
          await supabase
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
            .eq("field_code", id)
            .single();

        if (fieldError) {
          console.error("Field fetch error:", fieldError);
          setError("Unable to load this field.");
          return;
        }

        if (!fieldData) {
          setError("Field not found.");
          return;
        }

        setField(fieldData);

        // ---------------------------------------
        // Prepare edit form
        // ---------------------------------------

        setForm({
          fieldName: fieldData.field_name || "",
          latitude:
            fieldData.latitude !== null
              ? String(fieldData.latitude)
              : "",
          longitude:
            fieldData.longitude !== null
              ? String(fieldData.longitude)
              : "",
          boundaryCaptured:
            fieldData.boundary_captured || false,
          area:
            fieldData.area !== null
              ? String(fieldData.area)
              : "",
          areaUnit: fieldData.area_unit || "",
          landOwnership: fieldData.land_ownership || "",
          landType: fieldData.land_type || "",
          nearbyWaterSource:
            fieldData.nearby_water_source || "",
          accessCondition:
            fieldData.access_condition || "",
          roadAccess: fieldData.road_access || "",
          specialFeatures:
            fieldData.special_features || "",
        });

        // ---------------------------------------
        // Get farmer
        // ---------------------------------------

        if (fieldData.farmer_id) {
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
                state
              `
            )
            .eq("id", fieldData.farmer_id)
            .single();

          if (farmerError) {
            console.error(
              "Farmer fetch error:",
              farmerError
            );
          } else {
            setFarmer(farmerData);
          }
        }
      } catch (err) {
        console.error(
          "Unexpected field error:",
          err
        );

        setError(
          "Something went wrong while loading the field."
        );
      } finally {
        setLoading(false);
      }
    }

    loadField();
  }, [supabase, params]);

  // --------------------------------------------------
  // Handle form changes
  // --------------------------------------------------

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

  function handleBoundaryChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((previous) => ({
      ...previous,
      boundaryCaptured: event.target.checked,
    }));

    setError("");
    setSuccess("");
  }

  // --------------------------------------------------
  // Start editing
  // --------------------------------------------------

  function handleEdit() {
    if (!field) return;

    setForm({
      fieldName: field.field_name || "",
      latitude:
        field.latitude !== null
          ? String(field.latitude)
          : "",
      longitude:
        field.longitude !== null
          ? String(field.longitude)
          : "",
      boundaryCaptured:
        field.boundary_captured || false,
      area:
        field.area !== null
          ? String(field.area)
          : "",
      areaUnit: field.area_unit || "",
      landOwnership:
        field.land_ownership || "",
      landType: field.land_type || "",
      nearbyWaterSource:
        field.nearby_water_source || "",
      accessCondition:
        field.access_condition || "",
      roadAccess:
        field.road_access || "",
      specialFeatures:
        field.special_features || "",
    });

    setError("");
    setSuccess("");
    setEditing(true);
  }

  // --------------------------------------------------
  // Cancel editing
  // --------------------------------------------------

  function handleCancelEdit() {
    if (!field) return;

    setForm({
      fieldName: field.field_name || "",
      latitude:
        field.latitude !== null
          ? String(field.latitude)
          : "",
      longitude:
        field.longitude !== null
          ? String(field.longitude)
          : "",
      boundaryCaptured:
        field.boundary_captured || false,
      area:
        field.area !== null
          ? String(field.area)
          : "",
      areaUnit: field.area_unit || "",
      landOwnership:
        field.land_ownership || "",
      landType:
        field.land_type || "",
      nearbyWaterSource:
        field.nearby_water_source || "",
      accessCondition:
        field.access_condition || "",
      roadAccess:
        field.road_access || "",
      specialFeatures:
        field.special_features || "",
    });

    setError("");
    setSuccess("");
    setEditing(false);
  }

  // --------------------------------------------------
  // Save field
  // --------------------------------------------------

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!field) return;

    setError("");
    setSuccess("");

    // ---------------------------------------
    // Validation
    // ---------------------------------------

    if (!form.fieldName.trim()) {
      setError("Please enter the field name.");
      return;
    }

    if (
      form.area.trim() &&
      Number.isNaN(Number(form.area))
    ) {
      setError("Field area must be a valid number.");
      return;
    }

    if (
      form.latitude.trim() &&
      Number.isNaN(Number(form.latitude))
    ) {
      setError("Latitude must be a valid number.");
      return;
    }

    if (
      form.longitude.trim() &&
      Number.isNaN(Number(form.longitude))
    ) {
      setError("Longitude must be a valid number.");
      return;
    }

    setSaving(true);

    try {
      // ---------------------------------------
      // Update field
      // ---------------------------------------

      const { data: updatedField, error: updateError } =
        await supabase
          .from("fields")
          .update({
            field_name: form.fieldName.trim(),

            latitude: form.latitude.trim()
              ? Number(form.latitude)
              : null,

            longitude: form.longitude.trim()
              ? Number(form.longitude)
              : null,

            boundary_captured:
              form.boundaryCaptured,

            area: form.area.trim()
              ? Number(form.area)
              : null,

            area_unit:
              form.areaUnit.trim() || null,

            land_ownership:
              form.landOwnership || null,

            land_type:
              form.landType || null,

            nearby_water_source:
              form.nearbyWaterSource.trim() || null,

            access_condition:
              form.accessCondition || null,

            road_access:
              form.roadAccess || null,

            special_features:
              form.specialFeatures.trim() || null,
          })
          .eq("id", field.id)
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
          .single();

      if (updateError) {
        console.error(
          "Field update error:",
          updateError
        );

        setError(
          updateError.message ||
            "Unable to update the field."
        );

        return;
      }

      if (!updatedField) {
        setError(
          "Field was not updated. Please try again."
        );

        return;
      }

      // ---------------------------------------
      // Update local state
      // ---------------------------------------

      setField(updatedField);

      setSuccess(
        "Field information updated successfully."
      );

      setEditing(false);
    } catch (err) {
      console.error(
        "Unexpected field update error:",
        err
      );

      setError(
        "Something went wrong while updating the field."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-[var(--border)] bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-sm font-medium">
                Loading field...
              </p>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Fetching field information from Supabase.
              </p>
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error && !field) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/fields"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Fields
            </Link>

            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-700">
              {error}
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  if (!field) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <Link
              href="/fields"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Fields
            </Link>

            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-5 text-sm text-red-700">
              Field not found.
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  const hasCoordinates =
    field.latitude !== null &&
    field.longitude !== null;

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

          {/* -------------------------------- */}
          {/* Top Navigation */}
          {/* -------------------------------- */}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href="/fields"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Fields
            </Link>

            {!editing && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"
              >
                <Pencil size={16} />
                Edit Field
              </button>
            )}

          </div>

          {/* -------------------------------- */}
          {/* Success */}
          {/* -------------------------------- */}

          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* -------------------------------- */}
          {/* Error while editing */}
          {/* -------------------------------- */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* -------------------------------- */}
          {/* Header */}
          {/* -------------------------------- */}

          <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="p-5 sm:p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                  <Sprout size={23} />
                </div>

                <div className="min-w-0">

                  <p className="text-sm font-medium text-[var(--primary)]">
                    Field Details
                  </p>

                  <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                    {field.field_name}
                  </h1>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {field.field_code}
                  </p>

                </div>

              </div>

            </div>
          </section>

          {/* ====================================== */}
          {/* EDIT FORM */}
          {/* ====================================== */}

          {editing ? (
            <form
              onSubmit={handleSave}
              className="space-y-6"
            >

              {/* -------------------------------- */}
              {/* Basic Field Information */}
              {/* -------------------------------- */}

              <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">
                  <h2 className="font-semibold">
                    Field Information
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Update the basic information recorded for this field.
                  </p>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2">

                  {/* Field Code */}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Field ID
                    </label>

                    <input
                      value={field.field_code}
                      disabled
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-[var(--muted)] outline-none"
                    />

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Field ID cannot be changed.
                    </p>
                  </div>

                  {/* Field Name */}

                  <div>
                    <label
                      htmlFor="fieldName"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Field name{" "}
                      <span className="text-red-600">*</span>
                    </label>

                    <input
                      id="fieldName"
                      name="fieldName"
                      value={form.fieldName}
                      onChange={handleChange}
                      placeholder="Enter field name"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* GPS Information */}
              {/* -------------------------------- */}

              <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <div className="flex items-center gap-2">
                    <MapPin
                      size={18}
                      className="text-[var(--primary)]"
                    />

                    <h2 className="font-semibold">
                      Location & Boundary
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Update GPS coordinates and boundary information.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2">

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
                      placeholder="e.g. 11.0168"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                      placeholder="e.g. 76.9558"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Boundary */}

                  <div className="sm:col-span-2">

                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-4">

                      <input
                        type="checkbox"
                        checked={form.boundaryCaptured}
                        onChange={handleBoundaryChange}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />

                      <div>
                        <p className="text-sm font-semibold">
                          Boundary captured
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Mark this when the field boundary has been captured.
                        </p>
                      </div>

                    </label>

                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Land Details */}
              {/* -------------------------------- */}

              <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <div className="flex items-center gap-2">
                    <Ruler
                      size={18}
                      className="text-[var(--primary)]"
                    />

                    <h2 className="font-semibold">
                      Land Details
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Update physical and ownership information.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">

                  {/* Area */}

                  <div>
                    <label
                      htmlFor="area"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Field area
                    </label>

                    <input
                      id="area"
                      name="area"
                      type="number"
                      min="0"
                      step="any"
                      value={form.area}
                      onChange={handleChange}
                      placeholder="Enter area"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Area Unit */}

                  <div>
                    <label
                      htmlFor="areaUnit"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Area unit
                    </label>

                    <select
                      id="areaUnit"
                      name="areaUnit"
                      value={form.areaUnit}
                      onChange={handleChange}
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        Select unit
                      </option>

                      <option value="Acre">
                        Acre
                      </option>

                      <option value="Cent">
                        Cent
                      </option>

                      <option value="Hectare">
                        Hectare
                      </option>

                      <option value="Sq. Meter">
                        Sq. Meter
                      </option>

                      <option value="Ground">
                        Ground
                      </option>
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
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        Select land type
                      </option>

                      <option value="Irrigated">
                        Irrigated
                      </option>

                      <option value="Rainfed">
                        Rainfed
                      </option>

                      <option value="Mixed">
                        Mixed
                      </option>
                    </select>
                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Water & Access */}
              {/* -------------------------------- */}

              <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <div className="flex items-center gap-2">
                    <Droplets
                      size={18}
                      className="text-[var(--primary)]"
                    />

                    <h2 className="font-semibold">
                      Water & Access
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Update water availability and field accessibility.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2">

                  {/* Water Source */}

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
                      placeholder="e.g. Borewell, canal, pond"
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  {/* Access Condition */}

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
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        Select access condition
                      </option>

                      <option value="Easy">
                        Easy
                      </option>

                      <option value="Moderate">
                        Moderate
                      </option>

                      <option value="Difficult">
                        Difficult
                      </option>
                    </select>
                  </div>

                  {/* Road Access */}

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
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        Select road access
                      </option>

                      <option value="Good">
                        Good
                      </option>

                      <option value="Moderate">
                        Moderate
                      </option>

                      <option value="Poor">
                        Poor
                      </option>

                      <option value="No road access">
                        No road access
                      </option>
                    </select>
                  </div>

                  {/* Special Features */}

                  <div className="sm:col-span-2">

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
                      rows={4}
                      placeholder="Enter any special features or observations..."
                      className="w-full rounded-lg border border-[var(--border)] px-3 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />

                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Edit Actions */}
              {/* -------------------------------- */}

              <section className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </section>

            </form>
          ) : (

            /* ====================================== */
            /* NORMAL FIELD DETAILS */
            /* ====================================== */

            <>
              {/* -------------------------------- */}
              {/* Farmer */}
              {/* -------------------------------- */}

              <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <h2 className="font-semibold">
                    Farmer
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Farmer associated with this field.
                  </p>

                </div>

                <div className="p-5">

                  {farmer ? (
                    <Link
                      href={`/farmers/${farmer.id}`}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-4 transition hover:bg-[var(--light-green)]"
                    >

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-semibold">
                          {farmer.full_name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {farmer.farmer_code}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {farmer.village || "—"}

                          {farmer.district
                            ? `, ${farmer.district}`
                            : ""}
                        </p>

                      </div>

                    </Link>
                  ) : (
                    <p className="text-sm text-[var(--muted)]">
                      Farmer information unavailable.
                    </p>
                  )}

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Location */}
              {/* -------------------------------- */}

              <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <h2 className="font-semibold">
                    Field Location
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    GPS and boundary information.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2">

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <div className="flex items-center gap-2">

                      <MapPin
                        size={17}
                        className="text-[var(--primary)]"
                      />

                      <p className="text-sm font-semibold">
                        Coordinates
                      </p>

                    </div>

                    {hasCoordinates ? (
                      <div className="mt-3 space-y-1">

                        <p className="text-sm">
                          Latitude:{" "}
                          <span className="font-medium">
                            {field.latitude}
                          </span>
                        </p>

                        <p className="text-sm">
                          Longitude:{" "}
                          <span className="font-medium">
                            {field.longitude}
                          </span>
                        </p>

                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--muted)]">
                        Location not captured.
                      </p>
                    )}

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <div className="flex items-center gap-2">

                      <MapPin
                        size={17}
                        className="text-[var(--primary)]"
                      />

                      <p className="text-sm font-semibold">
                        Boundary
                      </p>

                    </div>

                    <p className="mt-3 text-sm">
                      {field.boundary_captured
                        ? "Boundary captured"
                        : "Boundary not captured"}
                    </p>

                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Land Details */}
              {/* -------------------------------- */}

              <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <h2 className="font-semibold">
                    Land Details
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Physical and ownership information.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <div className="flex items-center gap-2 text-[var(--primary)]">

                      <Ruler size={17} />

                      <span className="text-xs font-medium">
                        Field Area
                      </span>

                    </div>

                    <p className="mt-2 text-base font-semibold">
                      {field.area !== null
                        ? `${field.area} ${
                            field.area_unit || ""
                          }`
                        : "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <p className="text-xs font-medium text-[var(--muted)]">
                      Land Ownership
                    </p>

                    <p className="mt-2 text-base font-semibold">
                      {field.land_ownership ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <p className="text-xs font-medium text-[var(--muted)]">
                      Land Type
                    </p>

                    <p className="mt-2 text-base font-semibold">
                      {field.land_type ||
                        "Not specified"}
                    </p>

                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Water & Access */}
              {/* -------------------------------- */}

              <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="border-b border-[var(--border)] px-5 py-4">

                  <h2 className="font-semibold">
                    Water & Access
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Water availability and field accessibility.
                  </p>

                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2">

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <div className="flex items-center gap-2">

                      <Droplets
                        size={17}
                        className="text-[var(--primary)]"
                      />

                      <p className="text-sm font-semibold">
                        Nearby Water Source
                      </p>

                    </div>

                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {field.nearby_water_source ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <div className="flex items-center gap-2">

                      <Route
                        size={17}
                        className="text-[var(--primary)]"
                      />

                      <p className="text-sm font-semibold">
                        Ease of Access
                      </p>

                    </div>

                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {field.access_condition ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <p className="text-sm font-semibold">
                      Road / Transport Access
                    </p>

                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {field.road_access ||
                        "Not specified"}
                    </p>

                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">

                    <p className="text-sm font-semibold">
                      Special Features
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">
                      {field.special_features ||
                        "No special features recorded."}
                    </p>

                  </div>

                </div>
              </section>

              {/* -------------------------------- */}
              {/* Bottom Navigation */}
              {/* -------------------------------- */}

              <div className="flex justify-start">

                <Link
                  href="/fields"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-5 text-sm font-semibold transition hover:bg-slate-50"
                >
                  <ArrowLeft size={17} />
                  Back to Fields
                </Link>

              </div>
            </>
          )}

        </div>
      </main>
    </InternLayout>
  );
}