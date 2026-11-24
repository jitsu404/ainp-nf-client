import { FileText } from "lucide-react";
import { ANNUAL_REPORTS, PCU } from "../../programme/publicContent";
import { programme } from "../../programme/config";
import { Body, LargeHeading, SmallBody, SubHeading } from "../../components/ui";

// The About / PCU / Publications / Annual reports pages of the public site. The PCU and Annual
// reports pages show content taken from the ICAR-IIFSR website (programme/publicContent.js), with a
// link to the source; Publications waits for the Project Coordination Unit's documents.

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

/** "Source: …" under content taken from another site. */
function Source({ href, name }) {
  return (
    <SmallBody muted as="p" className="site-source">
      Source:{" "}
      <a href={href} target="_blank" rel="noreferrer">
        {name ?? href.replace(/^https?:\/\//, "")}
      </a>
    </SmallBody>
  );
}

export function ProjectCoordinationUnit() {
  return (
    <section className="site-wrap site-section">
      <PageHead
        title="Project Coordination Unit (PCU)"
        lead={programme.institute}
      />
      <div className="stack" style={{ gap: 20 }}>
        <div className="site-card">
          <div className="site-prose">
            <Body>{PCU.intro}</Body>
            <SubHeading as="h3">Mandate</SubHeading>
            <Body>{PCU.mandate}</Body>
            <SubHeading as="h3">Target activities</SubHeading>
            <ul>
              {PCU.activities.map((a) => (
                <li key={a}>
                  <Body as="span">{a}</Body>
                </li>
              ))}
            </ul>
            <SubHeading as="h3">Schemes coordinated</SubHeading>
            <ul>
              {PCU.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="site-card">
          <SubHeading as="h3">Scientists and staff</SubHeading>
          <div className="table-wrap">
            <table className="site-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Name</th>
                  <th>Designation</th>
                </tr>
              </thead>
              <tbody>
                {PCU.staff.map(([name, designation], i) => (
                  <tr key={name}>
                    <td>{i + 1}</td>
                    <td>
                      <b>{name}</b>
                    </td>
                    <td>{designation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Source href={PCU.source} />
      </div>
    </section>
  );
}

export function AnnualReports() {
  return (
    <section className="site-wrap site-section">
      <PageHead
        title="Annual reports"
        lead={`Annual reports of the ${programme.institute}.`}
      />
      <div className="site-card">
        <div className="table-wrap">
          <table className="site-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Document</th>
              </tr>
            </thead>
            <tbody>
              {ANNUAL_REPORTS.reports.map((r) => (
                <tr key={r.href}>
                  <td>{r.title}</td>
                  <td>
                    <a href={r.href} target="_blank" rel="noreferrer">
                      <FileText size={14} /> View / download
                    </a>{" "}
                    <SmallBody muted>PDF, English</SmallBody>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Source href={ANNUAL_REPORTS.source} />
    </section>
  );
}
