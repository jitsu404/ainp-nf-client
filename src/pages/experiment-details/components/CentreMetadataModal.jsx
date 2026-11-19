import { Modal } from "../../../components/ui";

const METADATA_LABELS = {
  code: "Code",
  title: "Title",
  projectCode: "Project Code",
  subject: "Subject",
  keywords: "Keywords",
  instituteName: "Institute Name",
  smdName: "SMD Name",
  unitType: "Unit Type",
  unitName: "Unit Name",
  fundingType: "Funding Type",
  fundingSource: "Funding Source",
  dataCategory: "Data Category",
  dataType: "Data Type",
  methodology: "Methodology",
  dataScale: "Data Scale",
  language: "Language",
};

export function CentreMetadataModal({
  assignment,
  centreName,
  experimentCode,
  onClose,
}) {
  const metaData = assignment?.metaData || {};
  const hasData = Object.values(metaData).some(
    (v) => v !== null && v !== undefined && String(v).trim().length > 0,
  );

  return (
    <Modal
      title={`Metadata · ${centreName || "Centre"}`}
      subtitle={`Experiment: ${experimentCode || "—"}`}
      wide={true}
      style={{ maxWidth: 760 }}
      onClose={onClose}
      footer={
        <button type="button" className="btn ghost" onClick={onClose}>
          Close
        </button>
      }
    >
      {!hasData ? (
        <div
          className="muted center"
          style={{ padding: "40px 16px", fontSize: "0.95rem" }}
        >
          No metadata has been submitted by this centre yet.
        </div>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          {/* General & Project */}
          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 10,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 4,
              }}
            >
              General & Project Information
            </h4>
            <div className="grid two" style={{ gap: "8px 16px" }}>
              <div>
                <span className="muted small font-medium">Code</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.code || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Project Code</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.projectCode || "—"}
                </div>
              </div>
              <div className="full">
                <span className="muted small font-medium">Title</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.title || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Subject</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.subject || "—"}
                </div>
              </div>
              <div className="full">
                <span className="muted small font-medium">Keywords</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.keywords || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Affiliation */}
          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 10,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 4,
              }}
            >
              Institutional Affiliation
            </h4>
            <div className="grid two" style={{ gap: "8px 16px" }}>
              <div>
                <span className="muted small font-medium">Institute Name</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.instituteName || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">SMD Name</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.smdName || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Unit Type</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.unitType || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Unit Name</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.unitName || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Funding & Sponsorship */}
          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 10,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 4,
              }}
            >
              Funding & Sponsorship
            </h4>
            <div className="grid two" style={{ gap: "8px 16px" }}>
              <div>
                <span className="muted small font-medium">Funding Type</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.fundingType || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Funding Source</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.fundingSource || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Research & Data Specs */}
          <div>
            <h4
              style={{
                fontSize: "0.9rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 10,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 4,
              }}
            >
              Research & Dataset Specifications
            </h4>
            <div className="grid two" style={{ gap: "8px 16px" }}>
              <div>
                <span className="muted small font-medium">Data Category</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.dataCategory || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Data Type</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.dataType || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Methodology</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.methodology || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Data Scale</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.dataScale || "—"}
                </div>
              </div>
              <div>
                <span className="muted small font-medium">Language</span>
                <div style={{ fontWeight: 550, marginTop: 2 }}>
                  {metaData.language || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
