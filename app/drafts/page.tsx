"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import InternLayout from "@/components/layout/InternLayout";
import {
  deleteSurveyOfflineData,
} from "@/lib/offline/surveyManager";
import { syncSurvey } from "@/lib/offline/syncSurvey";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";

type DraftSection = {
  id: string;
  surveyId: string;
  surveyCode: string;
  section: string;
  status:
    | "saved"
    | "pending_sync"
    | "synced"
    | "sync_failed";
  updatedAt: string;
  errorMessage?: string;
};

type DraftSurvey = {
  surveyId: string;
  surveyCode: string;
  sections: DraftSection[];
  updatedAt: string;
  status:
    | "saved"
    | "pending_sync"
    | "synced"
    | "sync_failed";
};

const SURVEY_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];

function getStatusLabel(
  status: DraftSurvey["status"]
) {
  switch (status) {
    case "pending_sync":
      return "Syncing";

    case "synced":
      return "Synced";

    case "sync_failed":
      return "Sync failed";

    default:
      return "Saved offline";
  }
}

function getStatusClasses(
  status: DraftSurvey["status"]
) {
  switch (status) {
    case "pending_sync":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "synced":
      return "bg-green-50 text-green-700 border-green-200";

    case "sync_failed":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function getStatusIcon(
  status: DraftSurvey["status"]
) {
  switch (status) {
    case "pending_sync":
      return (
        <Loader2
          size={15}
          className="animate-spin"
        />
      );

    case "synced":
      return <CheckCircle2 size={15} />;

    case "sync_failed":
      return <XCircle size={15} />;

    default:
      return <WifiOff size={15} />;
  }
}

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Unknown";
  }

  return value.toLocaleString();
}

function getNextSection(
  sections: DraftSection[]
) {
  const savedSections = sections
    .map((section) => section.section)
    .filter((section) =>
      SURVEY_SECTIONS.includes(section)
    );

  if (savedSections.length === 0) {
    return "A";
  }

  let highestIndex = -1;

  for (const section of savedSections) {
    const index =
      SURVEY_SECTIONS.indexOf(section);

    if (index > highestIndex) {
      highestIndex = index;
    }
  }

  if (highestIndex < 0) {
    return "A";
  }

  const highestSection =
    SURVEY_SECTIONS[highestIndex];

  if (highestSection === "P") {
    return null;
  }

  return SURVEY_SECTIONS[
    highestIndex + 1
  ];
}

function getLatestSavedSection(
  sections: DraftSection[]
) {
  let latestSection = "A";
  let latestIndex = -1;

  for (const section of sections) {
    const index =
      SURVEY_SECTIONS.indexOf(
        section.section
      );

    if (index >= 0 && index > latestIndex) {
      latestIndex = index;
      latestSection = section.section;
    }
  }

  return latestSection;
}

export default function DraftsPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const [drafts, setDrafts] = useState<DraftSurvey[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [syncingSurveyId, setSyncingSurveyId] =
    useState<string | null>(null);

  async function loadDrafts() {
    setLoading(true);

    try {
      const { offlineDB } = await import(
        "@/lib/offline/db"
      );

      const sections =
        await offlineDB.surveyDrafts.toArray();

      const grouped = new Map<
        string,
        DraftSurvey
      >();

      for (const section of sections) {
        const existing = grouped.get(
          section.surveyId
        );

        if (!existing) {
          grouped.set(section.surveyId, {
            surveyId: section.surveyId,
            surveyCode: section.surveyCode,
            sections: [
              {
                id: section.id,
                surveyId: section.surveyId,
                surveyCode: section.surveyCode,
                section: section.section,
                status: section.status,
                updatedAt: section.updatedAt,
                errorMessage:
                  section.errorMessage,
              },
            ],
            updatedAt: section.updatedAt,
            status: section.status,
          });

          continue;
        }

        existing.sections.push({
          id: section.id,
          surveyId: section.surveyId,
          surveyCode: section.surveyCode,
          section: section.section,
          status: section.status,
          updatedAt: section.updatedAt,
          errorMessage:
            section.errorMessage,
        });

        if (
          new Date(section.updatedAt).getTime() >
          new Date(existing.updatedAt).getTime()
        ) {
          existing.updatedAt =
            section.updatedAt;
        }
      }

      const groupedDrafts = Array.from(
        grouped.values()
      );

      for (const draft of groupedDrafts) {
        const hasFailed = draft.sections.some(
          (section) =>
            section.status === "sync_failed"
        );

        const hasPending = draft.sections.some(
          (section) =>
            section.status === "pending_sync"
        );

        const allSynced =
          draft.sections.length > 0 &&
          draft.sections.every(
            (section) =>
              section.status === "synced"
          );

        if (hasFailed) {
          draft.status = "sync_failed";
        } else if (hasPending) {
          draft.status = "pending_sync";
        } else if (allSynced) {
          draft.status = "synced";
        } else {
          draft.status = "saved";
        }

        draft.sections.sort((a, b) => {
          const aIndex =
            SURVEY_SECTIONS.indexOf(
              a.section
            );

          const bIndex =
            SURVEY_SECTIONS.indexOf(
              b.section
            );

          return aIndex - bIndex;
        });
      }

      groupedDrafts.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime()
      );

      setDrafts(groupedDrafts);
    } catch (error) {
      console.error(
        "Unable to load offline drafts:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSync(
    surveyId: string
  ) {
    if (!isOnline) {
      return;
    }

    setSyncingSurveyId(surveyId);

    try {
      await syncSurvey(surveyId);
      await loadDrafts();
    } catch (error) {
      console.error(
        "Unable to sync survey:",
        error
      );
    } finally {
      setSyncingSurveyId(null);
    }
  }

  async function handleDelete(
    surveyId: string
  ) {
    const confirmed = window.confirm(
      "Delete this offline draft from this device?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSurveyOfflineData(
        surveyId
      );

      await loadDrafts();
    } catch (error) {
      console.error(
        "Unable to delete offline draft:",
        error
      );
    }
  }

  function handleContinue(
    draft: DraftSurvey
  ) {
    const nextSection =
      getNextSection(draft.sections);

    if (!nextSection) {
      return;
    }

    router.push(
      `/surveys/${draft.surveyId}/${nextSection.toLowerCase()}`
    );
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    loadDrafts();
  }, [isOnline]);

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">
                Draft Surveys
              </h1>

              <p className="mt-1 text-sm text-[var(--muted)]">
                Continue saved surveys or synchronize
                them when the internet connection is
                available.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDrafts}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text)] hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          {/* Offline information */}
          {!isOnline && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <WifiOff
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  You are offline
                </p>

                <p className="mt-1 text-sm">
                  Your saved survey data remains on
                  this device. You can continue
                  working on the survey and it will
                  synchronize when the connection
                  returns.
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="mt-8 flex items-center justify-center rounded-xl border border-[var(--border)] bg-white p-10">
              <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading drafts...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && drafts.length === 0 && (
            <div className="mt-8 rounded-xl border border-[var(--border)] bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                <FileText size={25} />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">
                No offline drafts
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Surveys saved while working offline
                will appear here.
              </p>
            </div>
          )}

          {/* Draft list */}
          {!loading && drafts.length > 0 && (
            <div className="mt-6 space-y-4">
              {drafts.map((draft) => {
                const isSyncing =
                  syncingSurveyId ===
                  draft.surveyId;

                const nextSection =
                  getNextSection(
                    draft.sections
                  );

                const latestSection =
                  getLatestSavedSection(
                    draft.sections
                  );

                const isSubmitted =
                  draft.sections.some(
                    (section) =>
                      section.section === "P"
                  );

                return (
                  <article
                    key={draft.surveyId}
                    className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-[var(--text)]">
                            {draft.surveyCode ||
                              draft.surveyId}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              draft.status
                            )}`}
                          >
                            {getStatusIcon(
                              draft.status
                            )}
                            {getStatusLabel(
                              draft.status
                            )}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Last updated:{" "}
                          {formatDate(
                            draft.updatedAt
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isSubmitted &&
                          nextSection && (
                            <button
                              type="button"
                              onClick={() =>
                                handleContinue(
                                  draft
                                )
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:opacity-90"
                            >
                              Continue Survey
                              <ChevronRight
                                size={17}
                              />
                            </button>
                          )}

                        {draft.status !==
                          "synced" &&
                          !isSubmitted && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSync(
                                  draft.surveyId
                                )
                              }
                              disabled={
                                isSyncing ||
                                !isOnline
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text)] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSyncing ? (
                                <>
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw
                                    size={17}
                                  />
                                  Sync
                                </>
                              )}
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              draft.surveyId
                            )
                          }
                          disabled={isSyncing}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Continue information */}
                    {!isSubmitted &&
                      nextSection && (
                        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                          <p className="text-sm font-medium text-green-800">
                            You last saved Section{" "}
                            {latestSection}.
                          </p>

                          <p className="mt-1 text-xs text-green-700">
                            Continue with Section{" "}
                            {nextSection}.
                          </p>
                        </div>
                      )}

                    {/* Submitted information */}
                    {isSubmitted && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                          <CheckCircle2
                            size={17}
                          />
                          Survey submitted
                        </div>

                        <p className="mt-1 text-xs text-green-700">
                          This survey has reached the
                          submission stage and cannot
                          be continued.
                        </p>
                      </div>
                    )}

                    {/* Sections */}
                    <div className="mt-5 border-t border-[var(--border)] pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Saved sections
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {draft.sections.map(
                          (section) => (
                            <span
                              key={section.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-1.5 text-xs font-medium text-[var(--text)]"
                            >
                              <Clock3
                                size={13}
                                className="text-[var(--muted)]"
                              />
                              Section{" "}
                              {section.section}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Sync error */}
                    {draft.status ===
                      "sync_failed" && (
                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-700">
                          Some sections could not
                          be synchronized.
                        </p>

                        {draft.sections
                          .filter(
                            (section) =>
                              section.status ===
                                "sync_failed" &&
                              section.errorMessage
                          )
                          .map((section) => (
                            <p
                              key={section.id}
                              className="mt-1 text-xs text-red-600"
                            >
                              Section{" "}
                              {section.section}:{" "}
                              {
                                section.errorMessage
                              }
                            </p>
                          ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </InternLayout>
  );
}