"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  Sprout,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import PhotoUpload from "@/components/survey/PhotoUpload";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  getSurveySectionOffline,
  saveSurveySectionOffline,
  markSectionSynced,
} from "@/lib/offline/surveyManager";

type Survey = {
  id: string;
  survey_code: string;
  farmer_id: string;
  field_id: string;
};

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
  overview_photo_path: string | null;
};

export default function SurveyCPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [field, setField] = useState<Field | null>(null);

  const [fieldName, setFieldName] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [boundaryCaptured, setBoundaryCaptured] = useState("");

  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("");

  const [landOwnership, setLandOwnership] = useState("");

  const [landType, setLandType] = useState("");

  const [nearbyWaterSource, setNearbyWaterSource] = useState("");

  const [accessCondition, setAccessCondition] = useState("");

  const [roadAccess, setRoadAccess] = useState("");

  const [specialFeatures, setSpecialFeatures] = useState("");

  const [photoPath, setPhotoPath] = useState("");

  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurveyAndField() {
      setLoading(true);
      setError("");

      const localDraft = await getSurveySectionOffline(
        surveyId,
        "C"
      );

      const localB = await getSurveySectionOffline(
        surveyId,
        "B"
      );

      let loadedSurvey: Survey | null = null;
      let loadedField: Field | null = null;

      if (isOnline) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: surveyData, error: surveyError } =
          await supabase
            .from("surveys")
            .select(
              "id, survey_code, farmer_id, field_id"
            )
            .eq("id", surveyId)
            .single();

        if (surveyError || !surveyData) {
          console.error(surveyError);

          if (!localDraft && !localB) {
            setError("Survey could not be found.");
            setLoading(false);
            return;
          }
        } else {
          loadedSurvey = surveyData;

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
                overview_photo_path
              `
              )
              .eq("id", surveyData.field_id)
              .single();

          if (fieldError || !fieldData) {
            console.error(fieldError);

            if (!localDraft) {
              setError(
                "The field linked to this survey could not be found."
              );
              setLoading(false);
              return;
            }
          } else {
            loadedField = fieldData;
          }
        }
      }

      const localData =
        localDraft?.data &&
        typeof localDraft.data === "object"
          ? localDraft.data
          : null;

      const localBData =
        localB?.data &&
        typeof localB.data === "object"
          ? localB.data
          : null;

      const localFarmerId =
        typeof localData?.farmerId === "string"
          ? localData.farmerId
          : typeof localBData?.farmerId === "string"
          ? localBData.farmerId
          : "";

      const localFieldId =
        typeof localData?.fieldId === "string"
          ? localData.fieldId
          : typeof localBData?.fieldId === "string"
          ? localBData.fieldId
          : "";

      if (!loadedSurvey) {
        if (!localFieldId) {
          setError(
            "Survey information is unavailable offline. Please open this survey while connected once before continuing offline."
          );
          setLoading(false);
          return;
        }

        loadedSurvey = {
          id: surveyId,
          survey_code:
            localDraft?.surveyCode ||
            localB?.surveyCode ||
            "Offline Survey",
          farmer_id: localFarmerId,
          field_id: localFieldId,
        };
      }

      if (!loadedField) {
        loadedField = {
          id: localFieldId || loadedSurvey.field_id,
          field_code:
            typeof localData?.fieldCode === "string"
              ? localData.fieldCode
              : "Offline field",
          farmer_id:
            localFarmerId || loadedSurvey.farmer_id,
          field_name:
            typeof localData?.field_name === "string"
              ? localData.field_name
              : null,
          latitude:
            typeof localData?.latitude === "number"
              ? localData.latitude
              : null,
          longitude:
            typeof localData?.longitude === "number"
              ? localData.longitude
              : null,
          boundary_captured:
            typeof localData?.boundary_captured ===
            "boolean"
              ? localData.boundary_captured
              : null,
          area:
            typeof localData?.area === "number"
              ? localData.area
              : null,
          area_unit:
            typeof localData?.area_unit === "string"
              ? localData.area_unit
              : null,
          land_ownership:
            typeof localData?.land_ownership === "string"
              ? localData.land_ownership
              : null,
          land_type:
            typeof localData?.land_type === "string"
              ? localData.land_type
              : null,
          nearby_water_source:
            typeof localData?.nearby_water_source ===
            "string"
              ? localData.nearby_water_source
              : null,
          access_condition:
            typeof localData?.access_condition ===
            "string"
              ? localData.access_condition
              : null,
          road_access:
            typeof localData?.road_access === "string"
              ? localData.road_access
              : null,
          special_features:
            typeof localData?.special_features ===
            "string"
              ? localData.special_features
              : null,
          overview_photo_path:
            typeof localData?.overview_photo_path ===
            "string"
              ? localData.overview_photo_path
              : null,
        };
      }

      setSurvey(loadedSurvey);
      setField(loadedField);

      setFieldName(
        typeof localData?.field_name === "string"
          ? localData.field_name
          : loadedField.field_name ?? ""
      );

      const localLatitude =
        typeof localData?.latitude === "number"
          ? String(localData.latitude)
          : "";

      const localLongitude =
        typeof localData?.longitude === "number"
          ? String(localData.longitude)
          : "";

      setLatitude(
        localLatitude ||
          (loadedField.latitude !== null
            ? String(loadedField.latitude)
            : "")
      );

      setLongitude(
        localLongitude ||
          (loadedField.longitude !== null
            ? String(loadedField.longitude)
            : "")
      );

      const localBoundary =
        typeof localData?.boundary_captured === "boolean"
          ? localData.boundary_captured
          : null;

      setBoundaryCaptured(
        localBoundary !== null
          ? localBoundary
            ? "Yes"
            : "No"
          : loadedField.boundary_captured === null
          ? ""
          : loadedField.boundary_captured
          ? "Yes"
          : "No"
      );

      setArea(
        typeof localData?.area === "number"
          ? String(localData.area)
          : loadedField.area !== null
          ? String(loadedField.area)
          : ""
      );

      setAreaUnit(
        typeof localData?.area_unit === "string"
          ? localData.area_unit
          : loadedField.area_unit ?? ""
      );

      setLandOwnership(
        typeof localData?.land_ownership === "string"
          ? localData.land_ownership
          : loadedField.land_ownership ?? ""
      );

      setLandType(
        typeof localData?.land_type === "string"
          ? localData.land_type
          : loadedField.land_type ?? ""
      );

      setNearbyWaterSource(
        typeof localData?.nearby_water_source ===
          "string"
          ? localData.nearby_water_source
          : loadedField.nearby_water_source ?? ""
      );

      setAccessCondition(
        typeof localData?.access_condition === "string"
          ? localData.access_condition
          : loadedField.access_condition ?? ""
      );

      setRoadAccess(
        typeof localData?.road_access === "string"
          ? localData.road_access
          : loadedField.road_access ?? ""
      );

      setSpecialFeatures(
        typeof localData?.special_features === "string"
          ? localData.special_features
          : loadedField.special_features ?? ""
      );

      setPhotoPath(
        typeof localData?.overview_photo_path ===
          "string"
          ? localData.overview_photo_path
          : loadedField.overview_photo_path ?? ""
      );

      setLoading(false);
    }

    loadSurveyAndField();
  }, [surveyId, router, isOnline]);

  function captureCurrentLocation() {
    setLocationError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationError(
        "Location is not supported by this browser."
      );
      return;
    }

    setCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {
          latitude: currentLatitude,
          longitude: currentLongitude,
        } = position.coords;

        setLatitude(currentLatitude.toFixed(6));
        setLongitude(currentLongitude.toFixed(6));

        setLocationMessage(
          "Current location captured successfully."
        );

        setCapturingLocation(false);
      },
      (error) => {
        setCapturingLocation(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          setLocationError(
            "Location permission was denied. Please allow location access and try again."
          );
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          setLocationError(
            "Your current location could not be determined."
          );
        } else if (
          error.code === error.TIMEOUT
        ) {
          setLocationError(
            "Location request timed out. Please try again."
          );
        } else {
          setLocationError(
            "Unable to capture your current location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function handleSaveAndContinue() {
    setError("");

    if (!fieldName.trim()) {
      setError("Field name is required.");
      return;
    }

    if (!field) {
      setError("Field information is missing.");
      return;
    }

    if (!survey) {
      setError("Survey information is missing.");
      return;
    }

    setSaving(true);

    const hasGps =
      latitude.trim() !== "" &&
      longitude.trim() !== "";

    const sectionData: Record<string, unknown> = {
      farmerId: survey.farmer_id,
      fieldId: field.id,
      fieldCode: field.field_code,

      field_name: fieldName.trim(),

      latitude:
        latitude.trim() !== ""
          ? Number(latitude)
          : null,

      longitude:
        longitude.trim() !== ""
          ? Number(longitude)
          : null,

      boundary_captured:
        boundaryCaptured === ""
          ? false
          : boundaryCaptured === "Yes",

      area:
        area.trim() !== ""
          ? Number(area)
          : null,

      area_unit: areaUnit || null,

      land_ownership:
        landOwnership || null,

      land_type:
        landType || null,

      nearby_water_source:
        nearbyWaterSource.trim() || null,

      access_condition:
        accessCondition || null,

      road_access:
        roadAccess || null,

      special_features:
        specialFeatures.trim() || null,

      overview_photo_path:
        photoPath || null,
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode: survey.survey_code,
        section: "C",
        data: sectionData,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/d`);
        return;
      }

      const { error: fieldUpdateError } =
        await supabase
          .from("fields")
          .update({
            field_name: fieldName.trim(),

            latitude:
              latitude.trim() !== ""
                ? Number(latitude)
                : null,

            longitude:
              longitude.trim() !== ""
                ? Number(longitude)
                : null,

            boundary_captured:
              boundaryCaptured === ""
                ? false
                : boundaryCaptured === "Yes",

            area:
              area.trim() !== ""
                ? Number(area)
                : null,

            area_unit: areaUnit || null,

            land_ownership:
              landOwnership || null,

            land_type:
              landType || null,

            nearby_water_source:
              nearbyWaterSource.trim() || null,

            access_condition:
              accessCondition || null,

            road_access:
              roadAccess || null,

            special_features:
              specialFeatures.trim() || null,

            overview_photo_path:
              photoPath || null,
          })
          .eq("id", field.id);

      if (fieldUpdateError) {
        console.error(fieldUpdateError);
        setError(fieldUpdateError.message);
        setSaving(false);
        return;
      }

      const { error: surveyUpdateError } =
        await supabase
          .from("surveys")
          .update({
            gps_captured: hasGps,
            gps_latitude:
              hasGps
                ? Number(latitude)
                : null,
            gps_longitude:
              hasGps
                ? Number(longitude)
                : null,
          })
          .eq("id", surveyId);

      if (surveyUpdateError) {
        console.error(surveyUpdateError);
        setError(surveyUpdateError.message);
        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "C"
      );

      router.push(
        `/surveys/${surveyId}/d`
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save field details."
      );

      setSaving(false);
    }
  }
    if (loading) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading field details...
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  if (!survey || !field) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error ||
                "Field information could not be loaded."}
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="mb-6">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/surveys/${surveyId}/b`
                )
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Section B
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <Sprout size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Survey {survey.survey_code}
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  C — Field / Land Details
                </h1>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Record the location, area, ownership and
                  access details of the selected field.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">
                  Survey progress
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Section C of P
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {isOnline
                  ? "Draft"
                  : "Saved Offline"}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: "18.75%" }}
              />
            </div>
          </div>

          {!isOnline && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You are offline. Your field details will be
              saved on this device and synchronized when
              the connection returns.
            </div>
          )}

          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Field information
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                This field is already linked to the survey.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Field ID
                </label>

                <input
                  value={field.field_code}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="fieldName"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Field / local name{" "}
                  <span className="text-red-600">
                    *
                  </span>
                </label>

                <input
                  id="fieldName"
                  value={fieldName}
                  onChange={(event) =>
                    setFieldName(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Enter field name"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <MapPin
                  size={18}
                  className="text-[var(--primary)]"
                />

                <h2 className="font-semibold">
                  Field location
                </h2>
              </div>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Capture the current field location using the device GPS.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={captureCurrentLocation}
                  disabled={
                    capturingLocation ||
                    saving
                  }
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {capturingLocation ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Capturing location...
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      Capture Current Location
                    </>
                  )}
                </button>

                {locationMessage && (
                  <p className="mt-2 text-sm text-green-700">
                    {locationMessage}
                  </p>
                )}

                {locationError && (
                  <p className="mt-2 text-sm text-red-600">
                    {locationError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="latitude"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Latitude
                </label>

                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(event) =>
                    setLatitude(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. 11.0168"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="longitude"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Longitude
                </label>

                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(event) =>
                    setLongitude(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. 76.9558"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="boundaryCaptured"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Boundary captured
                </label>

                <select
                  id="boundaryCaptured"
                  value={boundaryCaptured}
                  onChange={(event) =>
                    setBoundaryCaptured(
                      event.target.value
                    )
                  }
                  disabled={saving}
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
                </select>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Area & ownership
              </h2>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="area"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Field area
                </label>

                <input
                  id="area"
                  type="number"
                  min="0"
                  step="0.01"
                  value={area}
                  onChange={(event) =>
                    setArea(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Enter area"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="areaUnit"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Area unit
                </label>

                <select
                  id="areaUnit"
                  value={areaUnit}
                  onChange={(event) =>
                    setAreaUnit(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                  value={landOwnership}
                  onChange={(event) =>
                    setLandOwnership(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select ownership
                  </option>
                  <option value="Owned">
                    Owned
                  </option>
                  <option value="Leased">
                    Leased
                  </option>
                  <option value="Shared">
                    Shared
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="landType"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Land type
                </label>

                <select
                  id="landType"
                  value={landType}
                  onChange={(event) =>
                    setLandType(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select land type
                  </option>
                  <option value="Lowland">
                    Lowland
                  </option>
                  <option value="Upland">
                    Upland
                  </option>
                  <option value="Garden land">
                    Garden land
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Water & access
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Record nearby water sources and how easily the
                field can be accessed.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label
                  htmlFor="nearbyWaterSource"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Nearby water source
                </label>

                <select
                  id="nearbyWaterSource"
                  value={nearbyWaterSource}
                  onChange={(event) =>
                    setNearbyWaterSource(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select water source
                  </option>
                  <option value="Well">
                    Well
                  </option>
                  <option value="Pond">
                    Pond
                  </option>
                  <option value="Canal">
                    Canal
                  </option>
                  <option value="River">
                    River
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="accessCondition"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Ease of field access
                </label>

                <select
                  id="accessCondition"
                  value={accessCondition}
                  onChange={(event) =>
                    setAccessCondition(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select condition
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

              <div>
                <label
                  htmlFor="roadAccess"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Road / transport access
                </label>

                <select
                  id="roadAccess"
                  value={roadAccess}
                  onChange={(event) =>
                    setRoadAccess(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select access
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
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="specialFeatures"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Special features
                </label>

                <textarea
                  id="specialFeatures"
                  value={specialFeatures}
                  onChange={(event) =>
                    setSpecialFeatures(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  rows={4}
                  placeholder="Any notable features of the field..."
                  className="w-full resize-y rounded-lg border border-[var(--border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>
          </section>

          <div className="mt-5">
            <PhotoUpload
              surveyId={survey.id}
              farmerId={survey.farmer_id}
              fieldId={field.id}
              photoType="field_overview"
              latitude={latitude}
              longitude={longitude}
              title="Field overview photo"
              description="Capture a clear photo showing the overall field."
              existingPhotoPath={
                field.overview_photo_path
              }
              onUploaded={(storagePath) =>
                setPhotoPath(storagePath)
              }
            />
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/surveys/${surveyId}/b`
                )
              }
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
            >
              <ArrowLeft size={18} />
              Previous
            </button>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  {isOnline
                    ? "Save & Continue"
                    : "Save Offline & Continue"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </InternLayout>
  );
}