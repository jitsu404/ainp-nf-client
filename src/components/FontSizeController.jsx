import { useEffect, useState } from "react";

const STORAGE_KEY = "ainp_font_size";
export const DEFAULT_FONT_SIZE = 14;
export const MIN_FONT_SIZE = 11; // 3 levels down: 13px (-1), 12px (-2), 11px (-3)
export const MAX_FONT_SIZE = 17; // 3 levels up: 15px (+1), 16px (+2), 17px (+3)

export function FontSizeController() {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_FONT_SIZE;
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = Number(saved);
    return Number.isInteger(parsed) &&
      parsed >= MIN_FONT_SIZE &&
      parsed <= MAX_FONT_SIZE
      ? parsed
      : DEFAULT_FONT_SIZE;
  });

  const applySize = (newSize) => {
    const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, newSize));
    setSize(clamped);
    if (typeof document !== "undefined") {
      document.body.style.fontSize = `${clamped}px`;
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.fontSize = `${size}px`;
    }
  }, [size]);

  const decrease = () => applySize(size - 1);
  const reset = () => applySize(DEFAULT_FONT_SIZE);
  const increase = () => applySize(size + 1);

  const delta = size - DEFAULT_FONT_SIZE;
  const deltaText =
    delta === 0 ? "default" : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <div
      className="font-size-controller"
      role="group"
      aria-label="Text size adjustment"
    >
      <button
        type="button"
        className={`font-size-btn ${size < DEFAULT_FONT_SIZE ? "active" : ""}`}
        onClick={decrease}
        disabled={size <= MIN_FONT_SIZE}
        title={`Decrease text size (current: ${size}px, min: ${MIN_FONT_SIZE}px)`}
        aria-label="Decrease text size (A-)"
      >
        A-
      </button>
      <button
        type="button"
        className={`font-size-btn ${size === DEFAULT_FONT_SIZE ? "active" : ""}`}
        onClick={reset}
        title={`Reset to default text size (${DEFAULT_FONT_SIZE}px · current: ${deltaText})`}
        aria-label="Reset text size to default (A)"
        aria-pressed={size === DEFAULT_FONT_SIZE}
      >
        A
      </button>
      <button
        type="button"
        className={`font-size-btn ${size > DEFAULT_FONT_SIZE ? "active" : ""}`}
        onClick={increase}
        disabled={size >= MAX_FONT_SIZE}
        title={`Increase text size (current: ${size}px, max: ${MAX_FONT_SIZE}px)`}
        aria-label="Increase text size (A+)"
      >
        A+
      </button>
    </div>
  );
}
