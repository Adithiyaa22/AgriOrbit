
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Headphones,
  Loader2,
  Mic,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type VoiceRecord = {
  id: string;
  survey_id: string;
  farmer_id: string;
  field_id: string;
  enumerator_id: string;
  section: string;
  question_key: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  duration_seconds: number | null;
  language: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

type VoiceWithDetails = VoiceRecord & {
  survey_code: string;
  farmer_code: string;
  farmer_name: string;
  field_code: string;
  field_name: string;
  audio_url: string;
};

export default function AdminVoiceContent() {
  const [voices, setVoices] = useState<VoiceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [selectedVoice, setSelectedVoice] =
    useState<VoiceWithDetails | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadVoices() {
      setLoading(true);
      setError("");

      try {
        const { data: voiceData, error: voiceError } =
          await supabase
            .from("voice_notes")
            .select(`
              id,
              survey_id,
              farmer_id,
              field_id,
              enumerator_id,
              section,
              question_key,
              storage_path,
              file_name,
              mime_type,
              file_size,
              duration_seconds,
              language,
              latitude,
              longitude,
              created_at
            `)
            .order("created_at", { ascending: false });

        if (voiceError) throw voiceError;

        if (!voiceData || voiceData.length === 0) {
          if (!cancelled) setVoices([]);
          return;
        }

        const surveyIds = [
          ...new Set(voiceData.map((voice) => voice.survey_id)),
        ];

        const farmerIds = [
          ...new Set(voiceData.map((voice) => voice.farmer_id)),
        ];

        const fieldIds = [
          ...new Set(voiceData.map((voice) => voice.field_id)),
        ];

        const [
          surveysResult,
          farmersResult,
          fieldsResult,
        ] = await Promise.all([
          supabase
            .from("surveys")
            .select("id, survey_code")
            .in("id", surveyIds),

          supabase
            .from("farmers")
            .select("id, farmer_code, full_name")
            .in("id", farmerIds),

          supabase
            .from("fields")
            .select("id, field_code, field_name")
            .in("id", fieldIds),
        ]);

        if (surveysResult.error) throw surveysResult.error;
        if (farmersResult.error) throw farmersResult.error;
        if (fieldsResult.error) throw fieldsResult.error;

        const surveysMap = new Map(
          (surveysResult.data ?? []).map((survey) => [
            survey.id,
            survey.survey_code,
          ])
        );

        const farmersMap = new Map(
          (farmersResult.data ?? []).map((farmer) => [
            farmer.id,
            {
              code: farmer.farmer_code,
              name: farmer.full_name,
            },
          ])
        );

        const fieldsMap = new Map(
          (fieldsResult.data ?? []).map((field) => [
            field.id,
            {
              code: field.field_code,
              name: field.field_name || "Unnamed field",
            },
          ])
        );

        const results = await Promise.all(
          voiceData.map(async (voice) => {
            const { data: signedData, error: signedError } =
              await supabase.storage
                .from("voices")
                .createSignedUrl(voice.storage_path, 60 * 60);

            const farmer = farmersMap.get(voice.farmer_id);
            const field = fieldsMap.get(voice.field_id);

            return {
              ...voice,
              survey_code:
                surveysMap.get(voice.survey_id) || "Unknown survey",
              farmer_code: farmer?.code || "Unknown",
              farmer_name: farmer?.name || "Unknown farmer",
              field_code: field?.code || "Unknown",
              field_name: field?.name || "Unknown field",
              audio_url:
                !signedError && signedData?.signedUrl
                  ? signedData.signedUrl
                  : "",
            };
          })
        );

        if (!cancelled) setVoices(results);
      } catch (err) {
        console.error("Unable to load voice recordings:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load voice recordings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVoices();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () =>
      [...new Set(voices.map((voice) => voice.section))]
        .filter(Boolean)
        .sort(),
    [voices]
  );

  const filteredVoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return voices.filter((voice) => {
      const matchesSearch =
        !query ||
        voice.file_name.toLowerCase().includes(query) ||
        voice.section.toLowerCase().includes(query) ||
        voice.question_key.toLowerCase().includes(query) ||
        voice.survey_code.toLowerCase().includes(query) ||
        voice.farmer_name.toLowerCase().includes(query) ||
        voice.farmer_code.toLowerCase().includes(query) ||
        voice.field_name.toLowerCase().includes(query) ||
        voice.field_code.toLowerCase().includes(query) ||
        voice.enumerator_id.toLowerCase().includes(query);

      const matchesSection =
        sectionFilter === "all" ||
        voice.section === sectionFilter;

      return matchesSearch && matchesSection;
    });
  }, [voices, search, sectionFilter]);

  function formatDuration(seconds: number | null) {
    if (seconds === null || !Number.isFinite(seconds)) {
      return "Unknown duration";
    }

    const total = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function formatSize(bytes: number | null) {
    if (bytes === null || bytes < 0) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] sm:text-3xl">
          Voice Library
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Browse and play audio recordings collected during field surveys.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Total recordings</p>
          <p className="mt-2 text-2xl font-bold text-[#1E293B]">
            {voices.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Filtered recordings</p>
          <p className="mt-2 text-2xl font-bold text-[#2E7D32]">
            {filteredVoices.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">Survey sections</p>
          <p className="mt-2 text-2xl font-bold text-[#1E293B]">
            {sections.length}
          </p>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search farmer, field, survey, question or file..."
            aria-label="Search voice recordings"
            className="h-11 w-full rounded-lg border border-[#E2E8F0] pl-10 pr-3 text-sm outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#E8F5E9]"
          />
        </div>

        <select
          value={sectionFilter}
          onChange={(event) => setSectionFilter(event.target.value)}
          aria-label="Filter by survey section"
          className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#E8F5E9]"
        >
          <option value="all">All sections</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading voice recordings...
          </div>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
        >
          Unable to load the Voice Library: {error}
        </div>
      )}

      {!loading && !error && filteredVoices.length === 0 && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5E9]">
            <Mic className="h-6 w-6 text-[#2E7D32]" />
          </div>
          <h2 className="mt-4 font-semibold text-[#1E293B]">
            No recordings found
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Try another search or section filter. Recordings must be synced
            and saved in the database to appear here.
          </p>
        </div>
      )}

      {!loading && !error && filteredVoices.length > 0 && (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:block">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <tr>
                  {[
                    "Recording",
                    "Section / Question",
                    "Farmer",
                    "Field",
                    "Survey",
                    "Duration",
                    "Uploaded",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredVoices.map((voice) => (
                  <tr key={voice.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-4">
                      <p className="max-w-48 truncate text-sm font-medium text-[#1E293B]">
                        {voice.file_name}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {formatSize(voice.file_size)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                        {voice.section}
                      </span>
                      <p className="mt-2 text-xs text-[#64748B]">
                        {voice.question_key}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-[#1E293B]">
                        {voice.farmer_name}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {voice.farmer_code}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm text-[#1E293B]">
                        {voice.field_name}
                      </p>
                      <p className="mt-1 text-xs text-[#64748B]">
                        {voice.field_code}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-[#64748B]">
                      {voice.survey_code}
                    </td>

                    <td className="px-4 py-4 text-sm text-[#64748B]">
                      {formatDuration(voice.duration_seconds)}
                    </td>

                    <td className="px-4 py-4 text-xs text-[#64748B]">
                      {formatDate(voice.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedVoice(voice)}
                        className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F8FAFC]"
                      >
                        View / Play
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
            {filteredVoices.map((voice) => (
              <div
                key={voice.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-[#2E7D32]">
                    <Headphones className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold text-[#1E293B]">
                      {voice.file_name}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {voice.section} · {formatDuration(voice.duration_seconds)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-[#64748B]">Farmer</p>
                    <p className="mt-1 text-sm font-medium text-[#1E293B]">
                      {voice.farmer_name}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {voice.farmer_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-[#64748B]">Field</p>
                    <p className="mt-1 text-sm font-medium text-[#1E293B]">
                      {voice.field_name}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {voice.field_code}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedVoice(voice)}
                  className="mt-4 w-full rounded-lg bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  View / Play Recording
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedVoice && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedVoice(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2
                  id="voice-details-title"
                  className="text-lg font-semibold text-[#1E293B]"
                >
                  Recording Details
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  {selectedVoice.question_key}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVoice(null)}
                aria-label="Close recording details"
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="break-all text-sm font-semibold text-[#1E293B]">
                  {selectedVoice.file_name}
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  {selectedVoice.mime_type} ·{" "}
                  {formatSize(selectedVoice.file_size)} ·{" "}
                  {formatDuration(selectedVoice.duration_seconds)}
                </p>

                {selectedVoice.audio_url ? (
                  <audio
                    key={selectedVoice.id}
                    controls
                    preload="none"
                    src={selectedVoice.audio_url}
                    className="mt-4 w-full"
                  >
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <p className="mt-4 text-sm text-red-600">
                    A playback URL could not be generated. Check the
                    storage object and your permissions.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Survey" value={selectedVoice.survey_code} />
                <Detail label="Section" value={selectedVoice.section} />
                <Detail label="Question key" value={selectedVoice.question_key} />
                <Detail label="Farmer" value={`${selectedVoice.farmer_name} (${selectedVoice.farmer_code})`} />
                <Detail label="Field" value={`${selectedVoice.field_name} (${selectedVoice.field_code})`} />
                <Detail label="Enumerator ID" value={selectedVoice.enumerator_id} />
                <Detail label="Language" value={selectedVoice.language || "Not specified"} />
                <Detail label="Uploaded" value={formatDate(selectedVoice.created_at)} />
                <Detail label="Latitude" value={selectedVoice.latitude === null ? "Not recorded" : String(selectedVoice.latitude)} />
                <Detail label="Longitude" value={selectedVoice.longitude === null ? "Not recorded" : String(selectedVoice.longitude)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-[#1E293B]">
        {value}
      </p>
    </div>
  );
}
