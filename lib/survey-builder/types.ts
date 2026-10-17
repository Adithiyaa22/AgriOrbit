
export type QuestionType =
  | "short_text"
  | "long_text"
  | "number"
  | "date"
  | "dropdown"
  | "radio"
  | "yes_no";

export type QuestionOption = {
  value: string;
  label: string;
};

export type VisibilityCondition = {
  questionKey: string;
  operator: "equals" | "not_equals";
  value: string;
};

export type SurveyQuestion = {
  key: string;
  label: string;
  type: QuestionType;
  required: boolean;
  options: QuestionOption[];
  visibleWhen?: VisibilityCondition;
};

export type SurveySection = {
  key: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
};

export type SurveyDefinition = {
  sections: SurveySection[];
};

export type SurveyTemplate = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  current_version: number;
  published_version: number | null;
  created_at: string;
  updated_at: string;
};

export type SurveyTemplateVersion = {
  id: string;
  template_id: string;
  version: number;
  status: "draft" | "published" | "archived";
  definition: SurveyDefinition;
  created_at: string;
  published_at: string | null;
};
