import { FileText } from "lucide-react";
import { programme } from "../../programme/config";
import { Body, LargeHeading, SubHeading } from "../../components/ui";

// The About / Publications / Annual reports pages of the public site. Their documents and text are
// supplied by the Project Coordination Unit; until then the lists say so.

function PageHead({ title, lead }) {
  return (
    <div className="site-page-head">
      <LargeHeading as="h2">{title}</LargeHeading>
      {lead && <Body as="p">{lead}</Body>}
    </div>
  );
}

export function About() {
  return (
    <section className="site-wrap site-section">
      <PageHead
        title="About us"
        lead={`${programme.name} (${programme.short})`}
      />
      <div className="site-card site-prose">
        <Body>
          The {programme.name} is coordinated by the {programme.unit} at the{" "}
          {programme.institute}, {programme.place}. Its network of centres
          across the agro-climatic zones of India conducts common experiments on
          natural farming, so that results can be compared and pooled across
          locations.
        </Body>
        <Body>
          The {programme.system} records each experiment's protocol, the trials
          run at the centres, their observations and analyses, and the
          programme's finances.
        </Body>
        <SubHeading as="h3">Contact</SubHeading>
        <Body>
          {programme.instituteShort}
          <br />
          {programme.instituteHi}
          <br />
          {programme.place}
        </Body>
      </div>
    </section>
  );
}

function DocumentList({ title, lead, empty }) {
  return (
    <section className="site-wrap site-section">
      <PageHead title={title} lead={lead} />
      <div className="site-card">
        <div className="site-empty">
          <FileText size={28} />
          <Body>{empty}</Body>
        </div>
      </div>
    </section>
  );
}

export function Publications() {
  return (
    <DocumentList
      title="Publications"
      lead="Research papers, bulletins and extension material from the network."
      empty="Publications will be listed here once the Project Coordination Unit adds them."
    />
  );
}

export function AnnualReports() {
  return (
    <DocumentList
      title="Annual reports"
      lead={`Yearly reports of the ${programme.short} network.`}
      empty="Annual reports will be listed here once the Project Coordination Unit adds them."
    />
  );
}
