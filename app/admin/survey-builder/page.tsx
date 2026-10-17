
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import type {
  QuestionType,
  SurveyDefinition,
  SurveyQuestion,
  SurveySection,
  SurveyTemplate,
  SurveyTemplateVersion,
} from "@/lib/survey-builder/types";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
  { value: "yes_no", label: "Yes / No" },
];

const EMPTY_DEFINITION: SurveyDefinition = { sections: [] };

function makeKey(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function makeQuestion(): SurveyQuestion {
  return {
    key: makeKey("question"),
    label: "New question",
    type: "short_text",
    required: false,
    options: [],
  };
}

function makeSection(): SurveySection {
  return {
    key: makeKey("section"),
    title: "New section",
    description: "",
    questions: [],
  };
}

function normalizeDefinition(value: unknown): SurveyDefinition {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as SurveyDefinition).sections)
  ) {
    return EMPTY_DEFINITION;
  }

  return value as SurveyDefinition;
}

export default function SurveyBuilderPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{
    full_name: string | null;
    employee_code: string | null;
    role: "admin" | "super_admin";
  } | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<SurveyTemplate | null>(null);
  const [version, setVersion] = useState<SurveyTemplateVersion | null>(null);
  const [definition, setDefinition] =
    useState<SurveyDefinition>(EMPTY_DEFINITION);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTemplates = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("survey_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (queryError) throw queryError;

    setTemplates((data ?? []) as SurveyTemplate[]);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          router.replace("/login");
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, employee_code, role, is_active")
          .eq("id", authData.user.id)
          .single();

        if (
          profileError ||
          !userProfile ||
          !userProfile.is_active ||
          !["admin", "super_admin"].includes(userProfile.role)
        ) {
          router.replace("/dashboard");
          return;
        }

        if (cancelled) return;

        setProfile({
          full_name: userProfile.full_name,
          employee_code: userProfile.employee_code,
          role: userProfile.role as "admin" | "super_admin",
        });

        await loadTemplates();
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not initialize the Survey Builder.",
          );
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, loadTemplates]);

  async function selectTemplate(template: SurveyTemplate) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data, error: queryError } = await supabase
        .from("survey_template_versions")
        .select("*")
        .eq("template_id", template.id)
        .order("version", { ascending: false });

      if (queryError) throw queryError;

      const versions = (data ?? []) as SurveyTemplateVersion[];
      const latestDraft = versions.find((item) => item.status === "draft");
      const published = versions.find((item) => item.status === "published");
      const chosen = latestDraft ?? published ?? versions[0] ?? null;

      setSelectedTemplate(template);
      setTemplateName(template.name);
      setTemplateDescription(template.description ?? "");

      if (chosen) {
        setVersion(chosen);
        setDefinition(normalizeDefinition(chosen.definition));
      } else {
        setVersion(null);
        setDefinition(EMPTY_DEFINITION);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load this template.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createTemplate() {
    const name = templateName.trim();

    if (!name) {
      setError("Enter a survey template name first.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/login");
        return;
      }

      const { data: template, error: insertError } = await supabase
        .from("survey_templates")
        .insert({
          name,
          description: templateDescription.trim() || null,
          status: "draft",
          current_version: 1,
          created_by: authData.user.id,
          updated_by: authData.user.id,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      const { data: newVersion, error: versionError } = await supabase
        .from("survey_template_versions")
        .insert({
          template_id: template.id,
          version: 1,
          status: "draft",
          definition: EMPTY_DEFINITION,
          created_by: authData.user.id,
        })
        .select("*")
        .single();

      if (versionError) {
        // Remove the template if its initial version could not be created.
        await supabase.from("survey_templates").delete().eq("id", template.id);
        throw versionError;
      }

      const createdTemplate = template as SurveyTemplate;

      setTemplates((previous) => [createdTemplate, ...previous]);
      setSelectedTemplate(createdTemplate);
      setVersion(newVersion as SurveyTemplateVersion);
      setDefinition(EMPTY_DEFINITION);
      setMessage("Template created. Add sections and questions.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create the template.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function startNewDraft() {
    if (!selectedTemplate || !version) return;

    if (version.status === "draft") {
      setMessage("You are already editing a draft.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Your session has expired.");

      const { data: existingDraft, error: draftError } = await supabase
        .from("survey_template_versions")
        .select("*")
        .eq("template_id", selectedTemplate.id)
        .eq("status", "draft")
        .maybeSingle();

      if (draftError) throw draftError;

      if (existingDraft) {
        setVersion(existingDraft as SurveyTemplateVersion);
        setDefinition(normalizeDefinition(existingDraft.definition));
        setMessage("Opened the existing draft.");
        return;
      }

      const { data: allVersions, error: versionsError } = await supabase
        .from("survey_template_versions")
        .select("version")
        .eq("template_id", selectedTemplate.id)
        .order("version", { ascending: false })
        .limit(1);

      if (versionsError) throw versionsError;

      const nextVersion = (allVersions?.[0]?.version ?? 0) + 1;

      const { data: newVersion, error: insertError } = await supabase
        .from("survey_template_versions")
        .insert({
          template_id: selectedTemplate.id,
          version: nextVersion,
          status: "draft",
          definition,
          created_by: authData.user.id,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("survey_templates")
        .update({
          current_version: nextVersion,
          updated_by: authData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTemplate.id);

      if (updateError) throw updateError;

      setVersion(newVersion as SurveyTemplateVersion);
      setSelectedTemplate({
        ...selectedTemplate,
        current_version: nextVersion,
      });
      setTemplates((previous) =>
        previous.map((item) =>
          item.id === selectedTemplate.id
            ? { ...item, current_version: nextVersion }
            : item,
        ),
      );
      setMessage(`Draft version ${nextVersion} created.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not create a new draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    if (!selectedTemplate || !version) return;

    if (version.status !== "draft") {
      setError("Published versions are read-only. Start a new draft to edit.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Your session has expired.");

      const { error: versionError } = await supabase
        .from("survey_template_versions")
        .update({ definition })
        .eq("id", version.id)
        .eq("status", "draft");

      if (versionError) throw versionError;

      const { error: templateError } = await supabase
        .from("survey_templates")
        .update({
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          updated_by: authData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTemplate.id);

      if (templateError) throw templateError;

      const updatedTemplate = {
        ...selectedTemplate,
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        updated_at: new Date().toISOString(),
      };

      setSelectedTemplate(updatedTemplate);
      setTemplates((previous) =>
        previous.map((item) =>
          item.id === updatedTemplate.id ? updatedTemplate : item,
        ),
      );
      setVersion({ ...version, definition });
      setMessage("Draft saved successfully.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save the draft.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishDraft() {
    if (!selectedTemplate || !version) return;

    if (version.status !== "draft") {
      setError("Create a new draft before publishing changes.");
      return;
    }

    if (definition.sections.length === 0) {
      setError("Add at least one section before publishing.");
      return;
    }

    for (const section of definition.sections) {
      if (!section.title.trim()) {
        setError("Every section needs a title.");
        return;
      }

      for (const question of section.questions) {
        if (!question.label.trim()) {
          setError("Every question needs a label.");
          return;
        }

        if (
          ["dropdown", "radio"].includes(question.type) &&
          question.options.length === 0
        ) {
          setError(
            `Add at least one option to "${question.label}" before publishing.`,
          );
          return;
        }
      }
    }

    if (
      !window.confirm(
        `Publish "${templateName}" version ${version.version}? Published versions should remain unchanged.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Your session has expired.");

      const { error: versionError } = await supabase
        .from("survey_template_versions")
        .update({
          definition,
          status: "published",
          published_by: authData.user.id,
          published_at: new Date().toISOString(),
        })
        .eq("id", version.id)
        .eq("status", "draft");

      if (versionError) throw versionError;

      const { error: templateError } = await supabase
        .from("survey_templates")
        .update({
          name: templateName.trim(),
          description: templateDescription.trim() || null,
          status: "published",
          current_version: version.version,
          published_version: version.version,
          updated_by: authData.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTemplate.id);

      if (templateError) {
        throw new Error(
          `The version may have been published, but template metadata failed to update: ${templateError.message}`,
        );
      }

      const publishedVersion: SurveyTemplateVersion = {
        ...version,
        definition,
        status: "published",
        published_at: new Date().toISOString(),
      };

      const updatedTemplate: SurveyTemplate = {
        ...selectedTemplate,
        name: templateName.trim(),
        description: templateDescription.trim() || null,
        status: "published",
        current_version: version.version,
        published_version: version.version,
        updated_at: new Date().toISOString(),
      };

      setVersion(publishedVersion);
      setSelectedTemplate(updatedTemplate);
      setTemplates((previous) =>
        previous.map((item) =>
          item.id === updatedTemplate.id ? updatedTemplate : item,
        ),
      );
      setMessage(`Version ${version.version} published successfully.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not publish this version.",
      );
    } finally {
      setSaving(false);
    }
  }

  function updateSection(
    sectionKey: string,
    update: Partial<SurveySection>,
  ) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey ? { ...section, ...update } : section,
      ),
    }));
  }

  function updateQuestion(
    sectionKey: string,
    questionKey: string,
    update: Partial<SurveyQuestion>,
  ) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.key === questionKey
                  ? { ...question, ...update }
                  : question,
              ),
            }
          : section,
      ),
    }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setDefinition((current) => {
      const sections = [...current.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return current;

      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections };
    });
  }

  function moveQuestion(
    sectionKey: string,
    index: number,
    direction: -1 | 1,
  ) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) => {
        if (section.key !== sectionKey) return section;

        const questions = [...section.questions];
        const target = index + direction;

        if (target < 0 || target >= questions.length) return section;

        [questions[index], questions[target]] = [
          questions[target],
          questions[index],
        ];

        return { ...section, questions };
      }),
    }));
  }

  function addSection() {
    setDefinition((current) => ({
      ...current,
      sections: [...current.sections, makeSection()],
    }));
  }

  function addQuestion(sectionKey: string) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? { ...section, questions: [...section.questions, makeQuestion()] }
          : section,
      ),
    }));
  }

  function removeSection(sectionKey: string) {
    if (!window.confirm("Delete this section and all its questions?")) return;

    setDefinition((current) => ({
      ...current,
      sections: current.sections.filter(
        (section) => section.key !== sectionKey,
      ),
    }));
  }

  function removeQuestion(sectionKey: string, questionKey: string) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              questions: section.questions.filter(
                (question) => question.key !== questionKey,
              ),
            }
          : section,
      ),
    }));
  }

  function addOption(sectionKey: string, questionKey: string) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.key === questionKey
                  ? {
                      ...question,
                      options: [
                        ...question.options,
                        {
                          value: makeKey("option"),
                          label: `Option ${question.options.length + 1}`,
                        },
                      ],
                    }
                  : question,
              ),
            }
          : section,
      ),
    }));
  }

  function updateOption(
    sectionKey: string,
    questionKey: string,
    optionValue: string,
    label: string,
  ) {
    setDefinition((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.key === sectionKey
          ? {
              ...section,
              questions: section.questions.map((question) =>
                question.key === questionKey
                  ? {
                      ...question,
                      options: question.options.map((option) =>
                        option.value === optionValue
                          ? { ...option, label, value: label.trim() }
                          : option,
                      ),
                    }
                  : question,
              ),
            }
          : section,
      ),
    }));
  }

  if (checkingAuth || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking administrator access…
      </main>
    );
  }

  const isDraft = version?.status === "draft";

  return (
    <AdminLayout
      role={profile.role}
      profile={{
        full_name: profile.full_name,
        employee_code: profile.employee_code,
        role: profile.role,
      }}
    >
      <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dynamic Survey Builder
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create, edit, save and publish versioned survey templates.
              </p>
            </div>
            <button
              onClick={() => void loadTemplates()}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Refresh templates
            </button>
          </header>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {message}
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4 rounded-xl border bg-white p-4">
              <h2 className="font-semibold text-slate-900">Survey templates</h2>

              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => void selectTemplate(template)}
                    className={`w-full rounded-lg border p-3 text-left ${
                      selectedTemplate?.id === template.id
                        ? "border-green-600 bg-green-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block font-medium text-slate-900">
                      {template.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {template.status} · v{template.current_version}
                      {template.published_version
                        ? ` · Published v${template.published_version}`
                        : ""}
                    </span>
                  </button>
                ))}

                {templates.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No templates yet. Create your first one below.
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3 font-medium">Create template</h3>
                <label className="mb-1 block text-sm">Name</label>
                <input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="e.g. Farmer baseline survey"
                  className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                />
                <label className="mb-1 block text-sm">Description</label>
                <textarea
                  value={templateDescription}
                  onChange={(event) => setTemplateDescription(event.target.value)}
                  placeholder="What is this survey for?"
                  rows={3}
                  className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
                />
                <button
                  disabled={saving}
                  onClick={() => void createTemplate()}
                  className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {saving ? "Working…" : "Create template"}
                </button>
              </div>
            </aside>

            <section className="min-w-0 space-y-4">
              {!selectedTemplate ? (
                <div className="rounded-xl border bg-white p-8 text-center">
                  <h2 className="font-semibold text-slate-900">
                    Select or create a template
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Your sections and questions will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border bg-white p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                          {selectedTemplate.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {version
                            ? `Version ${version.version} · ${version.status}`
                            : "No version loaded"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {version?.status === "published" && (
                          <button
                            disabled={saving}
                            onClick={() => void startNewDraft()}
                            className="rounded-lg border border-green-700 px-3 py-2 text-sm font-medium text-green-800 disabled:opacity-50"
                          >
                            New draft
                          </button>
                        )}
                        <button
                          disabled={saving || !isDraft}
                          onClick={() => void saveDraft()}
                          className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
                        >
                          Save draft
                        </button>
                        <button
                          disabled={saving || !isDraft}
                          onClick={() => void publishDraft()}
                          className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Publish version
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      Published versions are read-only. Create a new draft to
                      make further changes.
                    </p>
                  </div>

                  {loading ? (
                    <div className="rounded-xl border bg-white p-8 text-center">
                      Loading template…
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {definition.sections.map((section, sectionIndex) => (
                        <article
                          key={section.key}
                          className="rounded-xl border bg-white p-4 sm:p-6"
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">
                              Section {sectionIndex + 1}
                            </h3>
                            {isDraft && (
                              <div className="flex gap-2">
                                <button
                                  disabled={sectionIndex === 0}
                                  onClick={() => moveSection(sectionIndex, -1)}
                                  className="rounded border px-2 py-1 text-sm disabled:opacity-30"
                                  aria-label="Move section up"
                                >
                                  ↑
                                </button>
                                <button
                                  disabled={sectionIndex === definition.sections.length - 1}
                                  onClick={() => moveSection(sectionIndex, 1)}
                                  className="rounded border px-2 py-1 text-sm disabled:opacity-30"
                                  aria-label="Move section down"
                                >
                                  ↓
                                </button>
                                <button
                                  onClick={() => removeSection(section.key)}
                                  className="rounded border border-red-200 px-2 py-1 text-sm text-red-700"
                                >
                                  Delete section
                                </button>
                              </div>
                            )}
                          </div>

                          <fieldset disabled={!isDraft} className="space-y-3 disabled:opacity-80">
                            <label className="block text-sm font-medium">
                              Section title
                              <input
                                value={section.title}
                                onChange={(event) =>
                                  updateSection(section.key, { title: event.target.value })
                                }
                                className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                              />
                            </label>

                            <label className="block text-sm font-medium">
                              Description
                              <textarea
                                value={section.description}
                                onChange={(event) =>
                                  updateSection(section.key, { description: event.target.value })
                                }
                                rows={2}
                                className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                              />
                            </label>
                          </fieldset>

                          <div className="mt-5 space-y-4">
                            {section.questions.map((question, questionIndex) => (
                              <div key={question.key} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold">
                                    Question {questionIndex + 1}
                                  </h4>
                                  {isDraft && (
                                    <div className="flex gap-2">
                                      <button
                                        disabled={questionIndex === 0}
                                        onClick={() => moveQuestion(section.key, questionIndex, -1)}
                                        className="rounded border bg-white px-2 py-1 text-sm disabled:opacity-30"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        disabled={questionIndex === section.questions.length - 1}
                                        onClick={() => moveQuestion(section.key, questionIndex, 1)}
                                        className="rounded border bg-white px-2 py-1 text-sm disabled:opacity-30"
                                      >
                                        ↓
                                      </button>
                                      <button
                                        onClick={() => removeQuestion(section.key, question.key)}
                                        className="rounded border border-red-200 bg-white px-2 py-1 text-sm text-red-700"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <fieldset disabled={!isDraft} className="grid gap-3 sm:grid-cols-2 disabled:opacity-80">
                                  <label className="text-sm font-medium sm:col-span-2">
                                    Question label
                                    <input
                                      value={question.label}
                                      onChange={(event) =>
                                        updateQuestion(section.key, question.key, { label: event.target.value })
                                      }
                                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                                    />
                                  </label>

                                  <label className="text-sm font-medium">
                                    Answer type
                                    <select
                                      value={question.type}
                                      onChange={(event) => {
                                        const type = event.target.value as QuestionType;
                                        updateQuestion(section.key, question.key, {
                                          type,
                                          options: ["dropdown", "radio"].includes(type)
                                            ? question.options.length
                                              ? question.options
                                              : [{ value: "option_1", label: "Option 1" }]
                                            : [],
                                        });
                                      }}
                                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal"
                                    >
                                      {QUESTION_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                          {type.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <label className="flex items-center gap-2 self-end pb-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={question.required}
                                      onChange={(event) =>
                                        updateQuestion(section.key, question.key, { required: event.target.checked })
                                      }
                                    />
                                    Required question
                                  </label>
                                </fieldset>

                                {["dropdown", "radio"].includes(question.type) && (
                                  <div className="mt-4 space-y-2">
                                    <p className="text-sm font-medium">Options</p>
                                    {question.options.map((option) => (
                                      <div key={option.value} className="flex gap-2">
                                        <input
                                          disabled={!isDraft}
                                          value={option.label}
                                          onChange={(event) =>
                                            updateOption(section.key, question.key, option.value, event.target.value)
                                          }
                                          className="w-full rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-70"
                                        />
                                        {isDraft && (
                                          <button
                                            onClick={() =>
                                              updateQuestion(section.key, question.key, {
                                                options: question.options.filter((item) => item.value !== option.value),
                                              })
                                            }
                                            className="rounded border border-red-200 bg-white px-3 text-sm text-red-700"
                                            aria-label="Remove option"
                                          >
                                            ×
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    {isDraft && (
                                      <button
                                        onClick={() => addOption(section.key, question.key)}
                                        className="rounded border bg-white px-3 py-2 text-sm"
                                      >
                                        + Add option
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {isDraft && (
                            <button
                              onClick={() => addQuestion(section.key)}
                              className="mt-4 rounded-lg border border-green-700 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-50"
                            >
                              + Add question
                            </button>
                          )}
                        </article>
                      ))}

                      {isDraft && (
                        <button
                          onClick={addSection}
                          className="w-full rounded-xl border-2 border-dashed border-green-700 bg-white px-4 py-4 font-semibold text-green-800 hover:bg-green-50"
                        >
                          + Add section
                        </button>
                      )}

                      {definition.sections.length === 0 && (
                        <div className="rounded-xl border bg-white p-8 text-center">
                          <p className="text-slate-600">
                            This template has no sections yet.
                          </p>
                          {isDraft && (
                            <button
                              onClick={addSection}
                              className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white"
                            >
                              Create first section
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </section>
        </div>
      </main>
    </AdminLayout>
  );
}
