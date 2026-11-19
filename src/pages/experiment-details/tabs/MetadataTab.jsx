import { useEffect, useState } from "react";
import { Check, FileText, Loader2, Save } from "lucide-react";
import { ErrorNote } from "../../../components/forms";
import { Card } from "../../../components/ui";
import {
  useCreateExperimentAssignment,
  useExperimentAssignments,
  useUpdateExperimentAssignment,
} from "../../../queries/assignments";

const METADATA_FIELDS = [
  "code",
  "title",
  "smdName",
  "instituteName",
  "unitType",
  "unitName",
  "projectCode",
  "fundingType",
  "fundingSource",
  "subject",
  "keywords",
  "dataCategory",
  "dataType",
  "methodology",
  "dataScale",
  "language",
];

export function MetadataTab({ experiment, user }) {
  const centreId = user?.centreId;
  const experimentId = experiment.id || experiment._id;

  const assignmentsQuery = useExperimentAssignments(
    { experiment: experimentId, centre: centreId },
    { enabled: Boolean(centreId && experimentId) },
  );

  const rawList = assignmentsQuery.data;
  const assignment = Array.isArray(rawList)
    ? rawList[0]
    : rawList?.data?.[0] || null;

  const updateMutation = useUpdateExperimentAssignment(
    assignment?.id || assignment?._id,
  );
  const createMutation = useCreateExperimentAssignment();

  const [form, setForm] = useState(() => {
    const md = assignment?.metaData || {};
    return {
      code: md.code ?? experiment.code ?? "",
      title: md.title ?? experiment.title ?? "",
      projectCode: md.projectCode ?? "IIFSR/NF/01",
      smdName: md.smdName ?? "",
      instituteName: md.instituteName ?? "",
      unitType: md.unitType ?? "",
      unitName: md.unitName ?? "",
      fundingType: md.fundingType ?? "",
      fundingSource: md.fundingSource ?? "",
      subject: md.subject ?? "",
      keywords: md.keywords ?? "",
      dataCategory: md.dataCategory ?? "",
      dataType: md.dataType ?? "",
      methodology: md.methodology ?? "",
      dataScale: md.dataScale ?? "",
      language: md.language ?? "English",
    };
  });

  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState(null);

  // Sync form when assignment loads
  useEffect(() => {
    if (assignment) {
      const md = assignment.metaData || {};
      setForm({
        code: md.code ?? experiment.code ?? "",
        title: md.title ?? experiment.title ?? "",
        projectCode: md.projectCode ?? "IIFSR/NF/01",
        smdName: md.smdName ?? "",
        instituteName: md.instituteName ?? "",
        unitType: md.unitType ?? "",
        unitName: md.unitName ?? "",
        fundingType: md.fundingType ?? "",
        fundingSource: md.fundingSource ?? "",
        subject: md.subject ?? "",
        keywords: md.keywords ?? "",
        dataCategory: md.dataCategory ?? "",
        dataType: md.dataType ?? "",
        methodology: md.methodology ?? "",
        dataScale: md.dataScale ?? "",
        language: md.language ?? "English",
      });
    }
  }, [assignment, experiment.code, experiment.title]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg("");

    try {
      const cleanMetaData = {};
      for (const field of METADATA_FIELDS) {
        const val = form[field];
        cleanMetaData[field] =
          typeof val === "string" && val.trim().length > 0 ? val.trim() : null;
      }

      const assignmentId = assignment?.id || assignment?._id;
      if (assignmentId) {
        await updateMutation.mutateAsync({ metaData: cleanMetaData });
      } else {
        await createMutation.mutateAsync({
          experiment: experimentId,
          centre: centreId,
          status: "In progress",
          metaData: cleanMetaData,
          seasons: experiment.seasons || {},
        });
      }

      setSuccessMsg("Metadata updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err);
    }
  };

  const isSaving = updateMutation.isPending || createMutation.isPending;

  return (
    <Card
      title="Experiment Metadata"
      actions={
        <button
          type="button"
          className="btn"
          disabled={isSaving || assignmentsQuery.isPending}
          onClick={handleSave}
        >
          {isSaving ? (
            <Loader2 size={15} className="spin" />
          ) : (
            <Save size={15} />
          )}
          <span>{isSaving ? "Saving…" : "Save metadata"}</span>
        </button>
      }
    >
      <div className="stack" style={{ gap: 20 }}>
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Provide standardized KRISHI / ICAR research metadata for this
          experiment at your centre.
        </p>

        <ErrorNote error={error || assignmentsQuery.error} />

        {successMsg && (
          <div
            className="row"
            style={{
              padding: "10px 14px",
              background: "var(--green-bg, #e7f5ec)",
              color: "var(--green, #1b7f4b)",
              borderRadius: "6px",
              fontWeight: 500,
              alignItems: "center",
              gap: 8,
              fontSize: "0.9rem",
            }}
          >
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="stack" style={{ gap: 24 }}>
          {/* Section 1: Identification */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 12,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 6,
              }}
            >
              General & Project Information
            </h4>
            <div className="grid two" style={{ gap: 14 }}>
              <div className="field">
                <label>Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="e.g. NF-LTE"
                />
              </div>

              <div className="field">
                <label>Project Code</label>
                <input
                  type="text"
                  value={form.projectCode}
                  onChange={(e) => handleChange("projectCode", e.target.value)}
                  placeholder="e.g. IIFSR/NF/01"
                />
              </div>

              <div className="field full">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Experiment title"
                />
              </div>

              <div className="field">
                <label>Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="e.g. Agronomy / Soil Science"
                />
              </div>

              <div className="field full">
                <label>Keywords</label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={(e) => handleChange("keywords", e.target.value)}
                  placeholder="e.g. natural farming, jeevamrit, rice, yield"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Institutional Affiliation */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 12,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 6,
              }}
            >
              Institutional Affiliation
            </h4>
            <div className="grid two" style={{ gap: 14 }}>
              <div className="field">
                <label>Institute Name</label>
                <input
                  type="text"
                  value={form.instituteName}
                  onChange={(e) =>
                    handleChange("instituteName", e.target.value)
                  }
                  placeholder="e.g. ICAR-IIFSR Modipuram"
                />
              </div>

              <div className="field">
                <label>SMD Name</label>
                <input
                  type="text"
                  value={form.smdName}
                  onChange={(e) => handleChange("smdName", e.target.value)}
                  placeholder="e.g. Natural Resource Management (NRM)"
                />
              </div>

              <div className="field">
                <label>Unit Type</label>
                <input
                  type="text"
                  value={form.unitType}
                  onChange={(e) => handleChange("unitType", e.target.value)}
                  placeholder="e.g. Division / Regional Centre"
                />
              </div>

              <div className="field">
                <label>Unit Name</label>
                <input
                  type="text"
                  value={form.unitName}
                  onChange={(e) => handleChange("unitName", e.target.value)}
                  placeholder="e.g. Organic & Natural Farming Division"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Funding & Sponsorship */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 12,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 6,
              }}
            >
              Funding & Sponsorship
            </h4>
            <div className="grid two" style={{ gap: 14 }}>
              <div className="field">
                <label>Funding Type</label>
                <input
                  type="text"
                  value={form.fundingType}
                  onChange={(e) => handleChange("fundingType", e.target.value)}
                  placeholder="e.g. Core / Network Project"
                />
              </div>

              <div className="field">
                <label>Funding Source</label>
                <input
                  type="text"
                  value={form.fundingSource}
                  onChange={(e) =>
                    handleChange("fundingSource", e.target.value)
                  }
                  placeholder="e.g. ICAR"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dataset Specifications */}
          <div>
            <h4
              style={{
                fontSize: "0.95rem",
                fontWeight: 650,
                color: "var(--ink, #1b2420)",
                marginBottom: 12,
                borderBottom: "1px solid var(--line, #e3e8e4)",
                paddingBottom: 6,
              }}
            >
              Research & Dataset Specifications
            </h4>
            <div className="grid two" style={{ gap: 14 }}>
              <div className="field">
                <label>Data Category</label>
                <input
                  type="text"
                  value={form.dataCategory}
                  onChange={(e) => handleChange("dataCategory", e.target.value)}
                  placeholder="e.g. Research Experiment"
                />
              </div>

              <div className="field">
                <label>Data Type</label>
                <input
                  type="text"
                  value={form.dataType}
                  onChange={(e) => handleChange("dataType", e.target.value)}
                  placeholder="e.g. Quantitative / Tabular"
                />
              </div>

              <div className="field">
                <label>Methodology</label>
                <input
                  type="text"
                  value={form.methodology}
                  onChange={(e) => handleChange("methodology", e.target.value)}
                  placeholder="e.g. Field trials under RBD"
                />
              </div>

              <div className="field">
                <label>Data Scale</label>
                <input
                  type="text"
                  value={form.dataScale}
                  onChange={(e) => handleChange("dataScale", e.target.value)}
                  placeholder="e.g. Plot-level"
                />
              </div>

              <div className="field">
                <label>Language</label>
                <input
                  type="text"
                  value={form.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  placeholder="e.g. English"
                />
              </div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button
              type="submit"
              className="btn"
              disabled={isSaving || assignmentsQuery.isPending}
            >
              {isSaving ? (
                <Loader2 size={15} className="spin" />
              ) : (
                <Save size={15} />
              )}
              <span>{isSaving ? "Saving…" : "Save metadata"}</span>
            </button>
          </div>
        </form>
      </div>
    </Card>
  );
}
