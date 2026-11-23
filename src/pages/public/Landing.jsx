import { Building2, FlaskConical, MapPinned } from "lucide-react";
import { ExperimentCentresChart } from "../../components/stat-charts";
import { ErrorNote } from "../../components/forms";
import { PhotoCarousel } from "../../components/PhotoCarousel";
import { programme } from "../../programme/config";
import { usePublicSummary } from "../../queries/public";
import { Body, LargeHeading, SmallBody, SubHeading } from "../../components/ui";

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
        <LargeHeading as="h2" className="site-heading">
          {programme.short}: the network at a glance
        </LargeHeading>
        <div className="site-grid">
          <figure className="site-card site-map">
            <img
              src="/login-map.jpg"
              alt="Map of the 20 AINP-NF centres across India"
            />
            <figcaption className="muted small">
              <MapPinned size={13} />{" "}
              <SmallBody muted>
                Network centres across the agro-climatic zones of India
              </SmallBody>
            </figcaption>
          </figure>

          <div className="site-card site-chart-card">
            <SubHeading as="h3">Experiments and centres</SubHeading>
            <SmallBody muted as="p" style={{ marginTop: 0 }}>
              Experiments running now and the number of centres conducting each.
            </SmallBody>
            <div className="site-stats">
              <div>
                <Building2 size={18} />
                <b>{s ? s.centres : "…"}</b>
                <SmallBody>Centres</SmallBody>
              </div>
              <div>
                <FlaskConical size={18} />
                <b>{s ? s.experiments.length : "…"}</b>
                <SmallBody>Experiments running</SmallBody>
              </div>
              <div>
                <MapPinned size={18} />
                <b>{s ? allocations : "…"}</b>
                <SmallBody>Centre allocations</SmallBody>
              </div>
            </div>
            <ErrorNote error={summary.error} />
            {summary.isPending && (
              <Body muted className="center" style={{ padding: "30px 0" }}>
                Loading…
              </Body>
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
