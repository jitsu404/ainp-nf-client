import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Field photos for the carousel: every image in client/assets (add or remove files there; Vite
// bundles them), shown in file-name order.
export const PHOTOS = Object.entries(
  import.meta.glob("../../assets/*.{webp,jpg,jpeg,png}", {
    eager: true,
    import: "default",
  }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src]) => src);

const SLIDE_MS = 5000;

/**
 * Cross-fading photo carousel: advances every few seconds (not when the user prefers reduced
 * motion, and not while hovered or focused), with previous / next buttons and dots.
 */
export function PhotoCarousel({ photos = PHOTOS, className = "" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = photos.length;
  const go = (step) => setIndex((i) => (i + step + count) % count);

  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (count < 2 || paused || reduced) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;
  return (
    <div
      className={`hero-carousel ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Natural farming field photos"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Each photo is shown whole (they are wide banners) over a blurred copy that fills the panel. */}
      {photos.map((src, i) => (
        <div
          key={src}
          className={`slide ${i === index ? "on" : ""}`}
          aria-hidden={i !== index}
        >
          <img src={src} alt="" className="backdrop" loading="lazy" />
          <img
            src={src}
            alt={`Natural farming field photo ${i + 1} of ${count}`}
            className="photo"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
      {count > 1 && (
        <>
          <button
            type="button"
            className="carousel-nav prev"
            onClick={() => go(-1)}
            aria-label="Previous photo"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="carousel-nav next"
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            <ChevronRight size={18} />
          </button>
          <div className="carousel-dots">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                className={i === index ? "on" : ""}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
