"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  UserRound,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import VoiceRecorder from "@/components/survey/VoiceRecorder";
import { createClient } from "@/lib/supabase/client";
import { getClientUser } from "@/lib/auth/get-client-user";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  saveSurveySectionOffline,
  getSurveySectionOffline,
  markSectionSynced,
} from "@/lib/offline/surveyManager";

type Survey = {
  id: string;
  survey_code: string;
  farmer_id: string;
  field_id: string;
};

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  mobile: string | null;
  age_group: string | null;
  gender: string | null;
  village: string | null;
  taluk_block: string | null;
  district: string | null;
  state: string | null;
  farming_experience_years: number | null;
  farming_type: string | null;
  land_ownership: string | null;
  total_agricultural_land: number | null;
  land_unit: string | null;
  number_of_fields: number | null;
  main_farming_activity: string | null;
  main_income_source: string | null;
  training_support: string | null;
  information_source: string | null;
};

export default function SurveyBPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [gender, setGender] = useState("");

  const [village, setVillage] = useState("");
  const [talukBlock, setTalukBlock] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");

  const [farmingExperience, setFarmingExperience] = useState("");
  const [farmingType, setFarmingType] = useState("");
  const [landOwnership, setLandOwnership] = useState("");

  const [totalAgriculturalLand, setTotalAgriculturalLand] =
    useState("");

  const [landUnit, setLandUnit] = useState("");

  const [numberOfFields, setNumberOfFields] = useState("");

  const [mainFarmingActivity, setMainFarmingActivity] =
    useState("");

  const [mainIncomeSource, setMainIncomeSource] =
    useState("");

  const [trainingSupport, setTrainingSupport] =
    useState("");

  const [informationSource, setInformationSource] =
    useState("");

  const [existingVoicePath, setExistingVoicePath] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurveyAndFarmer() {
      setLoading(true);
      setError("");

      const localDraft = await getSurveySectionOffline(
        surveyId,
        "B"
      );

      const localSurveyDraft = await getSurveySectionOffline(
        surveyId,
        "A"
      );

      const localData = localDraft?.data ?? {};
      const localSurveyData = localSurveyDraft?.data ?? {};

      const user = await getClientUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let surveyData: Survey | null = null;
      let farmerData: Farmer | null = null;

      if (isOnline) {
        const { data, error: surveyError } = await supabase
          .from("surveys")
          .select("id, survey_code, farmer_id, field_id")
          .eq("id", surveyId)
          .single();

        if (!surveyError && data) {
          surveyData = data;

          const {
            data: farmerResult,
            error: farmerError,
          } = await supabase
            .from("farmers")
            .select(`
              id,
              farmer_code,
              full_name,
              mobile,
              age_group,
              gender,
              village,
              taluk_block,
              district,
              state,
              farming_experience_years,
              farming_type,
              land_ownership,
              total_agricultural_land,
              land_unit,
              number_of_fields,
              main_farming_activity,
              main_income_source,
              training_support,
              information_source
            `)
            .eq("id", data.farmer_id)
            .single();

          if (!farmerError && farmerResult) {
            farmerData = farmerResult;
          }
        }
      }

      if (!surveyData) {
        const farmerId =
          typeof localData.farmerId === "string"
            ? localData.farmerId
            : typeof localSurveyData.farmerId === "string"
            ? localSurveyData.farmerId
            : "";

        const fieldId =
          typeof localData.fieldId === "string"
            ? localData.fieldId
            : typeof localSurveyData.fieldId === "string"
            ? localSurveyData.fieldId
            : "";

        if (!farmerId || !fieldId) {
          setError(
            "Section B is not available offline yet. Open this survey while online once, then try again offline."
          );
          setLoading(false);
          return;
        }

        surveyData = {
          id: surveyId,
          survey_code:
            localDraft?.surveyCode ?? "Offline Survey",
          farmer_id: farmerId,
          field_id: fieldId,
        };
      }

      if (!farmerData && isOnline) {
        setError(
          "The farmer linked to this survey could not be found."
        );
        setLoading(false);
        return;
      }

      if (!farmerData) {
        const cachedFarmers = await import("@/lib/offline/referenceData");
        const cached = (await cachedFarmers.getCachedFarmers()).find(
          (item) => item.id === surveyData.farmer_id
        );

        farmerData = {
          id: surveyData.farmer_id,
          farmer_code: String(
            cached?.farmer_code ??
              localData.farmerCode ??
              "Offline Farmer"
          ),
          full_name: String(
            localData.full_name ??
              cached?.full_name ??
              ""
          ),
          mobile: null,
          age_group: null,
          gender: null,
          village: null,
          taluk_block: null,
          district: null,
          state: null,
          farming_experience_years: null,
          farming_type: null,
          land_ownership: null,
          total_agricultural_land: null,
          land_unit: null,
          number_of_fields: null,
          main_farming_activity: null,
          main_income_source: null,
          training_support: null,
          information_source: null,
        };
      }

      let voicePath: string | null = null;

      if (isOnline) {
        const { data: voiceData } = await supabase
          .from("voice_notes")
          .select("storage_path")
          .eq("survey_id", surveyId)
          .eq("section", "B")
          .eq("question_key", "farmer_profile")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        voicePath = voiceData?.storage_path ?? null;
      }

      setExistingVoicePath(voicePath);

      setSurvey(surveyData);
      setFarmer(farmerData);

      setFullName(
        String(
          localData.full_name ??
            farmerData.full_name ??
            ""
        )
      );

      setMobile(
        String(
          localData.mobile ??
            farmerData.mobile ??
            ""
        )
      );

      setAgeGroup(
        String(
          localData.age_group ??
            farmerData.age_group ??
            ""
        )
      );

      setGender(
        String(
          localData.gender ??
            farmerData.gender ??
            ""
        )
      );

      setVillage(
        String(
          localData.village ??
            farmerData.village ??
            ""
        )
      );

      setTalukBlock(
        String(
          localData.taluk_block ??
            farmerData.taluk_block ??
            ""
        )
      );

      setDistrict(
        String(
          localData.district ??
            farmerData.district ??
            ""
        )
      );

      setState(
        String(
          localData.state ??
            farmerData.state ??
            ""
        )
      );

      setFarmingExperience(
        localData.farming_experience_years != null
          ? String(localData.farming_experience_years)
          : farmerData.farming_experience_years != null
          ? String(
              farmerData.farming_experience_years
            )
          : ""
      );

      setFarmingType(
        String(
          localData.farming_type ??
            farmerData.farming_type ??
            ""
        )
      );

      setLandOwnership(
        String(
          localData.land_ownership ??
            farmerData.land_ownership ??
            ""
        )
      );

      setTotalAgriculturalLand(
        localData.total_agricultural_land != null
          ? String(
              localData.total_agricultural_land
            )
          : farmerData.total_agricultural_land != null
          ? String(
              farmerData.total_agricultural_land
            )
          : ""
      );

      setLandUnit(
        String(
          localData.land_unit ??
            farmerData.land_unit ??
            ""
        )
      );

      setNumberOfFields(
        localData.number_of_fields != null
          ? String(localData.number_of_fields)
          : farmerData.number_of_fields != null
          ? String(farmerData.number_of_fields)
          : ""
      );

      setMainFarmingActivity(
        String(
          localData.main_farming_activity ??
            farmerData.main_farming_activity ??
            ""
        )
      );

      setMainIncomeSource(
        String(
          localData.main_income_source ??
            farmerData.main_income_source ??
            ""
        )
      );

      setTrainingSupport(
        String(
          localData.training_support ??
            farmerData.training_support ??
            ""
        )
      );

      setInformationSource(
        String(
          localData.information_source ??
            farmerData.information_source ??
            ""
        )
      );

      setLoading(false);
    }

    loadSurveyAndFarmer();
  }, [surveyId, router, supabase, isOnline]);

  async function handleSaveAndContinue() {
    setError("");

    if (!fullName.trim()) {
      setError("Farmer name is required.");
      return;
    }

    setSaving(true);

    const data = {
      farmerId: farmer?.id ?? "",
      fieldId: survey?.field_id ?? "",
      farmerCode: farmer?.farmer_code ?? "",

      full_name: fullName.trim(),
      mobile: mobile.trim() || null,
      age_group: ageGroup || null,
      gender: gender || null,

      village: village.trim() || null,
      taluk_block: talukBlock.trim() || null,
      district: district.trim() || null,
      state: state.trim() || null,

      farming_experience_years:
        farmingExperience.trim() !== ""
          ? Number(farmingExperience)
          : null,

      farming_type: farmingType || null,
      land_ownership: landOwnership || null,

      total_agricultural_land:
        totalAgriculturalLand.trim() !== ""
          ? Number(totalAgriculturalLand)
          : null,

      land_unit: landUnit || null,

      number_of_fields:
        numberOfFields.trim() !== ""
          ? Number(numberOfFields)
          : null,

      main_farming_activity:
        mainFarmingActivity.trim() || null,

      main_income_source:
        mainIncomeSource.trim() || null,

      training_support:
        trainingSupport || null,

      information_source:
        informationSource.trim() || null,
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode:
          survey?.survey_code ?? "Offline Survey",
        section: "B",
        data,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/c`);
        return;
      }

      const { error: updateError } = await supabase
        .from("farmers")
        .update({
          full_name: data.full_name,
          mobile: data.mobile,
          age_group: data.age_group,
          gender: data.gender,

          village: data.village,
          taluk_block: data.taluk_block,
          district: data.district,
          state: data.state,

          farming_experience_years:
            data.farming_experience_years,

          farming_type: data.farming_type,
          land_ownership: data.land_ownership,

          total_agricultural_land:
            data.total_agricultural_land,

          land_unit: data.land_unit,

          number_of_fields:
            data.number_of_fields,

          main_farming_activity:
            data.main_farming_activity,

          main_income_source:
            data.main_income_source,

          training_support:
            data.training_support,

          information_source:
            data.information_source,
        })
        .eq("id", farmer?.id);

      if (updateError) {
        throw updateError;
      }

      await markSectionSynced(
        surveyId,
        "B"
      );

      router.push(
        `/surveys/${surveyId}/c`
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save Section B."
      );
    } finally {
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
              Loading farmer profile...
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  if (!survey || !farmer) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error ||
                "Farmer information could not be loaded."}
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

          {/* Header */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/surveys/${surveyId}/a`
                )
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Section A
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <UserRound size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Survey {survey.survey_code}
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  B — Farmer Profile
                </h1>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Record the farmer&apos;s basic profile and farming background.
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">
                  Survey progress
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Section B of P
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Draft
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: "12.5%" }}
              />
            </div>
          </div>

          {/* Farmer identity */}
          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Farmer information
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                This farmer is already linked to the survey.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Farmer ID
                </label>

                <input
                  value={farmer.farmer_code}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Farmer name{" "}
                  <span className="text-red-600">*</span>
                </label>

                <input
                  id="fullName"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter farmer name"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="mobile"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Mobile number
                </label>

                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter mobile number"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                  value={ageGroup}
                  onChange={(event) =>
                    setAgeGroup(event.target.value)
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select age group
                  </option>
                  <option value="18–25">18–25</option>
                  <option value="26–35">26–35</option>
                  <option value="36–45">36–45</option>
                  <option value="46–55">46–55</option>
                  <option value="56–65">56–65</option>
                  <option value="66+">66+</option>
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
                  value={gender}
                  onChange={(event) =>
                    setGender(event.target.value)
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Prefer not to say
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

            </div>
          </section>

          {/* Voice recording */}
          <div className="mt-5">
            <VoiceRecorder
              surveyId={survey.id}
              farmerId={farmer.id}
              fieldId={survey.field_id}
              section="B"
              questionKey="farmer_profile"
              title="Farmer Profile Voice Note"
              description="Record a short voice response from the farmer about their farming background or introduction."
              existingVoicePath={existingVoicePath}
              onUploaded={(storagePath) =>
                setExistingVoicePath(storagePath)
              }
            />
          </div>

          {/* Location */}
          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Location
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Record the farmer&apos;s administrative location.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="village"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Village
                </label>

                <input
                  id="village"
                  value={village}
                  onChange={(event) =>
                    setVillage(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter village"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="talukBlock"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Taluk / Block
                </label>

                <input
                  id="talukBlock"
                  value={talukBlock}
                  onChange={(event) =>
                    setTalukBlock(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter taluk or block"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="district"
                  className="mb-1.5 block text-sm font-medium"
                >
                  District
                </label>

                <input
                  id="district"
                  value={district}
                  onChange={(event) =>
                    setDistrict(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter district"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  disabled={saving}
                  placeholder="Enter state"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>
          </section>
            {/* Farming background */}
          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Farming background
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Capture the farmer&apos;s experience, land ownership and main farming activity.
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
                  type="number"
                  min="0"
                  step="0.1"
                  value={farmingExperience}
                  onChange={(event) =>
                    setFarmingExperience(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. 12"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                  value={farmingType}
                  onChange={(event) =>
                    setFarmingType(event.target.value)
                  }
                  disabled={saving}
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
                  <option value="Own">Own</option>
                  <option value="Lease">Lease</option>
                  <option value="Both">Both</option>
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
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAgriculturalLand}
                  onChange={(event) =>
                    setTotalAgriculturalLand(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Enter land area"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label
                  htmlFor="landUnit"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Land unit
                </label>

                <select
                  id="landUnit"
                  value={landUnit}
                  onChange={(event) =>
                    setLandUnit(event.target.value)
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select unit
                  </option>
                  <option value="Sq. Ft">Sq. Ft</option>
                  <option value="Acre">Acre</option>
                  <option value="Cent">Cent</option>
                  <option value="Hectare">
                    Hectare
                  </option>
                </select>
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
                  type="number"
                  min="0"
                  step="1"
                  value={numberOfFields}
                  onChange={(event) =>
                    setNumberOfFields(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. 3"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="mainFarmingActivity"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Main farming activity
                </label>

                <input
                  id="mainFarmingActivity"
                  value={mainFarmingActivity}
                  onChange={(event) =>
                    setMainFarmingActivity(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. Paddy cultivation"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
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
                  value={mainIncomeSource}
                  onChange={(event) =>
                    setMainIncomeSource(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Enter main income source"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>
          </section>

          {/* Support and information */}
          <section className="mt-5 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Support & information sources
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Record existing training or extension support and where the farmer usually gets farming information.
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
                  value={trainingSupport}
                  onChange={(event) =>
                    setTrainingSupport(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select option
                  </option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="informationSource"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Usual farming information source
                </label>

                <input
                  id="informationSource"
                  value={informationSource}
                  onChange={(event) =>
                    setInformationSource(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="e.g. fellow farmers, extension officer"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>
          </section>

          {!isOnline && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You are offline. Section B will be saved on this device and synced when you are online again.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/surveys/${surveyId}/a`
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
                  Save & Continue
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