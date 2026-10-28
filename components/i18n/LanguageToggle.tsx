"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div
      data-i18n-ignore="true"
      className="fixed bottom-4 right-4 z-[100] flex items-center rounded-full border border-[var(--border)] bg-white/95 p-1 shadow-lg backdrop-blur"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => {
          if (language !== "en") toggleLanguage();
        }}
        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
          language === "en"
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--muted)] hover:bg-[var(--background)]"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => {
          if (language !== "ta") toggleLanguage();
        }}
        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
          language === "ta"
            ? "bg-[var(--primary)] text-white"
            : "text-[var(--muted)] hover:bg-[var(--background)]"
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
}
