"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function setDocumentTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("anipins-theme", theme);
}

export default function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = document.documentElement.dataset.theme === "light" ? "light" : "dark";
    setTheme(saved);
    setReady(true);
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const toggle = () => {
    setDocumentTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ready ? `Switch to ${nextTheme} theme` : "Change color theme"}
      title={ready ? `Switch to ${nextTheme} theme` : "Change color theme"}
      className={mobile
        ? "flex items-center justify-between py-2.5 text-left text-[15px] text-fog hover:text-paper"
        : "grid h-9 w-9 place-items-center rounded-full hairline text-fog hover:border-gold-dim hover:bg-paper/5 hover:text-gold transition-colors"}
    >
      {mobile && <span>Theme</span>}
      <span className={mobile ? "inline-flex items-center gap-2 text-sm text-gold" : ""}>
        <svg aria-hidden="true" className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          {theme === "dark" ? (
            <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></>
          ) : (
            <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5a8.5 8.5 0 1 0 11.8 11.8Z"/>
          )}
        </svg>
        {mobile && <span>{ready && theme === "light" ? "Light" : "Dark"}</span>}
      </span>
    </button>
  );
}
