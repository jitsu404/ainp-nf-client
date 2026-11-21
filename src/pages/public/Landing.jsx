import { Building2, FlaskConical, MapPinned } from "lucide-react";
import { ExperimentCentresChart } from "../../components/stat-charts";
import { ErrorNote } from "../../components/forms";
import { PhotoCarousel } from "../../components/PhotoCarousel";
import { programme } from "../../programme/config";
import { usePublicSummary } from "../../queries/public";

// The public home page: field photos, then the network map beside the experiments running now and
// how many centres run each (GET /public/summary, no sign-in).

export default function Landing() {
  const summary = usePublicSummary();
  const s = summary.data;
  const allocations = s?.experiments.reduce((n, e) => n + e.centres, 0) ?? 0;

  return (
    <>
      <section className="site-hero">
        <PhotoCarousel className="site-carousel" />
      </section>

      <section className="site-wrap site-section">
        <h2 className="site-heading">
          {programme.short}: the network at a glance
        </h2>
        <div className="site-grid">
          <figure className="site-card site-map">
            <img
              src="/login-map.jpg"
              alt="Map of the 20 AINP-NF centres across India"
            />
            <figcaption className="muted small">
              <MapPinned size={13} /> Network centres across the agro-climatic
              zones of India
            </figcaption>
          </figure>

          <div className="site-card site-chart-card">
            <h3>Experiments and centres</h3>
            <p className="muted small" style={{ marginTop: 0 }}>
              Experiments running now and the number of centres conducting each.
            </p>
            <div className="site-stats">
              <div>
                <Building2 size={18} />
                <b>{s ? s.centres : "…"}</b>
                <span>Centres</span>
              </div>
              <div>
                <FlaskConical size={18} />
                <b>{s ? s.experiments.length : "…"}</b>
                <span>Experiments running</span>
              </div>
              <div>
                <MapPinned size={18} />
                <b>{s ? allocations : "…"}</b>
                <span>Centre allocations</span>
              </div>
            </div>
            <ErrorNote error={summary.error} />
            {summary.isPending && (
              <p className="muted center" style={{ padding: "30px 0" }}>
                Loading…
              </p>
            )}
            {s && (
              <div className="site-chart">
                <ExperimentCentresChart experiments={s.experiments} />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
