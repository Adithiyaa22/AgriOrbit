"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PhotoRecord = {
  id: string;
  survey_id: string;
  farmer_id: string;
  field_id: string;
  enumerator_id: string;
  photo_type: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

type PhotoWithDetails = PhotoRecord & {
  survey_code: string;
  farmer_code: string;
  farmer_name: string;
  field_code: string;
  field_name: string;
  photo_url: string;
};

export default function AdminPhotosContent() {
  const supabase = createClient();

  const [photos, setPhotos] = useState<PhotoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [photoTypeFilter, setPhotoTypeFilter] =
    useState("all");

  const [selectedPhoto, setSelectedPhoto] =
    useState<PhotoWithDetails | null>(null);

  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);
      setError("");

      try {
        const { data: photoData, error: photoError } =
          await supabase
            .from("photos")
            .select(
              `
                id,
                survey_id,
                farmer_id,
                field_id,
                enumerator_id,
                photo_type,
                storage_path,
                file_name,
                mime_type,
                file_size,
                latitude,
                longitude,
                created_at
              `
            )
            .order("created_at", {
              ascending: false,
            });

        if (photoError) {
          throw photoError;
        }

        if (!photoData || photoData.length === 0) {
          setPhotos([]);
          return;
        }

        const surveyIds = [
          ...new Set(
            photoData.map((photo) => photo.survey_id)
          ),
        ];

        const farmerIds = [
          ...new Set(
            photoData.map((photo) => photo.farmer_id)
          ),
        ];

        const fieldIds = [
          ...new Set(
            photoData.map((photo) => photo.field_id)
          ),
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
            .select(
              "id, farmer_code, full_name"
            )
            .in("id", farmerIds),

          supabase
            .from("fields")
            .select(
              "id, field_code, field_name"
            )
            .in("id", fieldIds),
        ]);

        if (surveysResult.error) {
          throw surveysResult.error;
        }

        if (farmersResult.error) {
          throw farmersResult.error;
        }

        if (fieldsResult.error) {
          throw fieldsResult.error;
        }

        const surveysMap = new Map(
          (surveysResult.data ?? []).map(
            (survey) => [
              survey.id,
              survey.survey_code,
            ]
          )
        );

        const farmersMap = new Map(
          (farmersResult.data ?? []).map(
            (farmer) => [
              farmer.id,
              {
                farmer_code: farmer.farmer_code,
                full_name: farmer.full_name,
              },
            ]
          )
        );

        const fieldsMap = new Map(
          (fieldsResult.data ?? []).map(
            (field) => [
              field.id,
              {
                field_code: field.field_code,
                field_name:
                  field.field_name ||
                  "Unnamed field",
              },
            ]
          )
        );

        const photoRows =
          await Promise.all(
            photoData.map(async (photo) => {
              const {
                data: signedUrlData,
              } = await supabase.storage
                .from("photos")
                .createSignedUrl(
                  photo.storage_path,
                  60 * 60
                );

              const farmer =
                farmersMap.get(photo.farmer_id);

              const field =
                fieldsMap.get(photo.field_id);

              return {
                ...photo,
                survey_code:
                  surveysMap.get(
                    photo.survey_id
                  ) || "Unknown survey",
                farmer_code:
                  farmer?.farmer_code ||
                  "Unknown",
                farmer_name:
                  farmer?.full_name ||
                  "Unknown farmer",
                field_code:
                  field?.field_code ||
                  "Unknown",
                field_name:
                  field?.field_name ||
                  "Unknown field",
                photo_url:
                  signedUrlData?.signedUrl ||
                  "",
              };
            })
          );

        setPhotos(photoRows);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load photos."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPhotos();
  }, [supabase]);

  const photoTypes = useMemo(() => {
    const types = new Set(
      photos.map((photo) => photo.photo_type)
    );

    return [...types].sort();
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return photos.filter((photo) => {
      const matchesSearch =
        searchValue === "" ||
        photo.file_name
          .toLowerCase()
          .includes(searchValue) ||
        photo.photo_type
          .toLowerCase()
          .includes(searchValue) ||
        photo.survey_code
          .toLowerCase()
          .includes(searchValue) ||
        photo.farmer_code
          .toLowerCase()
          .includes(searchValue) ||
        photo.farmer_name
          .toLowerCase()
          .includes(searchValue) ||
        photo.field_code
          .toLowerCase()
          .includes(searchValue) ||
        photo.field_name
          .toLowerCase()
          .includes(searchValue);

      const matchesType =
        photoTypeFilter === "all" ||
        photo.photo_type === photoTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [
    photos,
    search,
    photoTypeFilter,
  ]);

  function formatFileSize(
    bytes: number | null
  ) {
    if (!bytes) {
      return "Unknown size";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] sm:text-3xl">
          Photos
        </h1>

        <p className="mt-1 text-sm text-[#64748B]">
          View and manage photos collected during
          field surveys.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            Total Photos
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1E293B]">
            {photos.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            Filtered Photos
          </p>

          <p className="mt-2 text-2xl font-bold text-[#2E7D32]">
            {filteredPhotos.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#64748B]">
            Photo Types
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1E293B]">
            {photoTypes.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by farmer, field, survey or photo..."
              className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#1E293B] outline-none transition focus:border-[#4CAF50] focus:ring-2 focus:ring-[#E8F5E9]"
            />
          </div>

          <select
            value={photoTypeFilter}
            onChange={(event) =>
              setPhotoTypeFilter(
                event.target.value
              )
            }
            className="h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#1E293B] outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#E8F5E9]"
          >
            <option value="all">
              All photo types
            </option>

            {photoTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading photos...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredPhotos.length === 0 && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5E9]">
              <Camera className="h-6 w-6 text-[#2E7D32]" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-[#1E293B]">
              No photos found
            </h2>

            <p className="mt-1 max-w-md text-sm text-[#64748B]">
              Try changing the search or photo type
              filter.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        filteredPhotos.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Photo
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Type
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Farmer
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Field
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Survey
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Uploaded
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredPhotos.map(
                      (photo) => (
                        <tr
                          key={photo.id}
                          className="hover:bg-[#F8FAFC]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                                {photo.photo_url ? (
                                  <img
                                    src={
                                      photo.photo_url
                                    }
                                    alt={
                                      photo.photo_type
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Camera className="h-5 w-5 text-[#94A3B8]" />
                                  </div>
                                )}
                              </div>

                              <div className="max-w-[220px]">
                                <p className="truncate text-sm font-medium text-[#1E293B]">
                                  {photo.file_name}
                                </p>

                                <p className="mt-1 text-xs text-[#64748B]">
                                  {formatFileSize(
                                    photo.file_size
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                              {photo.photo_type}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-[#1E293B]">
                              {photo.farmer_name}
                            </p>

                            <p className="mt-1 text-xs text-[#64748B]">
                              {photo.farmer_code}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-[#1E293B]">
                              {photo.field_name}
                            </p>

                            <p className="mt-1 text-xs text-[#64748B]">
                              {photo.field_code}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-[#64748B]">
                            {photo.survey_code}
                          </td>

                          <td className="px-5 py-4 text-xs text-[#64748B]">
                            {formatDate(
                              photo.created_at
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedPhoto(
                                  photo
                                )
                              }
                              className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F8FAFC]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 lg:hidden">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
                >
                  <div className="aspect-video bg-[#F8FAFC]">
                    {photo.photo_url ? (
                      <img
                        src={photo.photo_url}
                        alt={photo.photo_type}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Camera className="h-8 w-8 text-[#94A3B8]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {photo.file_name}
                        </p>

                        <p className="mt-1 text-xs text-[#64748B]">
                          {formatFileSize(
                            photo.file_size
                          )}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-xs font-medium text-[#2E7D32]">
                        {photo.photo_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[#64748B]">
                          Farmer
                        </p>

                        <p className="mt-1 font-medium text-[#1E293B]">
                          {photo.farmer_name}
                        </p>

                        <p className="text-xs text-[#64748B]">
                          {photo.farmer_code}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-[#64748B]">
                          Field
                        </p>

                        <p className="mt-1 font-medium text-[#1E293B]">
                          {photo.field_name}
                        </p>

                        <p className="text-xs text-[#64748B]">
                          {photo.field_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-3">
                      <div>
                        <p className="text-xs text-[#64748B]">
                          Survey
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#1E293B]">
                          {photo.survey_code}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto(
                            photo
                          )
                        }
                        className="rounded-lg bg-[#2E7D32] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                      >
                        View Photo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() =>
            setSelectedPhoto(null)
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  Photo Details
                </h2>

                <p className="mt-1 text-xs text-[#64748B]">
                  {selectedPhoto.photo_type}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPhoto(null)
                }
                className="rounded-lg p-2 text-[#64748B] hover:bg-[#F1F5F9]"
                aria-label="Close photo details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                {selectedPhoto.photo_url ? (
                  <img
                    src={selectedPhoto.photo_url}
                    alt={
                      selectedPhoto.photo_type
                    }
                    className="max-h-[65vh] w-full object-contain"
                  />
                ) : (
                  <div className="flex min-h-64 items-center justify-center">
                    <Camera className="h-10 w-10 text-[#94A3B8]" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#64748B]">
                    File name
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-[#1E293B]">
                    {selectedPhoto.file_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    Photo type
                  </p>

                  <p className="mt-1 text-sm font-medium capitalize text-[#1E293B]">
                    {selectedPhoto.photo_type}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    Survey
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#1E293B]">
                    {selectedPhoto.survey_code}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    Farmer
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#1E293B]">
                    {selectedPhoto.farmer_name}
                  </p>

                  <p className="text-xs text-[#64748B]">
                    {selectedPhoto.farmer_code}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    Field
                  </p>

                  <p className="mt-1 text-sm font-medium text-[#1E293B]">
                    {selectedPhoto.field_name}
                  </p>

                  <p className="text-xs text-[#64748B]">
                    {selectedPhoto.field_code}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    File size
                  </p>

                  <p className="mt-1 text-sm text-[#1E293B]">
                    {formatFileSize(
                      selectedPhoto.file_size
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">
                    Uploaded
                  </p>

                  <p className="mt-1 text-sm text-[#1E293B]">
                    {formatDate(
                      selectedPhoto.created_at
                    )}
                  </p>
                </div>

                {(selectedPhoto.latitude !== null ||
                  selectedPhoto.longitude !== null) && (
                  <div>
                    <p className="text-xs text-[#64748B]">
                      Photo location
                    </p>

                    <p className="mt-1 text-sm text-[#1E293B]">
                      {selectedPhoto.latitude ??
                        "—"}
                      {" , "}
                      {selectedPhoto.longitude ??
                        "—"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}