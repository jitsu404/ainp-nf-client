import { useState } from "react";
import Select from "react-select";
import { Pencil, Plus } from "lucide-react";
import { useAuth } from "../../../../auth";
import { SaveModal } from "../../../../components/forms";
import { Badge, Body, Card, SmallBody, Table } from "../../../../components/ui";
import { TABLE_PAGE_SIZE } from "../../../../config/constants";
import { MAX_INTERCROPS, systemNameOf } from "../../../../lib/croppingSystems";
import { toast } from "../../../../lib/toast";
import {
  useCreateCroppingSystem,
  useCroppingSystems,
  useMasterOptions,
  useMasters,
  useUpdateCroppingSystem,
} from "../../../../queries/masters";
import { customSelectStyles } from "../../../experiments/components/ExperimentSeasonsField";

// Cropping systems master: one season, its main crop and up to five intercrops. A rotation over
// several seasons is several systems, and any number may share a season and main crop. Experiments
// choose a system as a sub plot level; each centre records its varieties, spacings and seed rates.

/** Code → name of every crop (inactive ones too, so old systems still read well). */
function useCropNames() {
  const crops = useMasters("crop");
  const all = crops.data ?? [];
  return {
    all,
    nameOf: (code) => all.find((c) => c.code === code)?.name ?? code,
  };
}

export default function CroppingSystemsTab() {
  const { can } = useAuth();
  const edit = can("masters.edit");
  const systems = useCroppingSystems();
  const seasons = useMasterOptions("season");
  const crops = useCropNames();
  const [editing, setEditing] = useState(null); // {} = new, or a system

  return (
    <Card
      pad={false}
      title="Cropping systems"
      actions={
        edit && (
          <button className="btn sm" onClick={() => setEditing({})}>
            <Plus size={14} /> Add cropping system
          </button>
        )
      }
    >
      <div className="toolbar">
        <SmallBody muted>
          A cropping system is one season, its main crop and the intercrops
          grown with it. For another season, add another system. Split and
          split-split plot experiments choose a system for each sub plot.
        </SmallBody>
      </div>
      <Table
        rows={systems.items}
        pageSize={TABLE_PAGE_SIZE}
        empty={systems.isPending ? "Loading…" : "No cropping systems yet."}
        columns={[
          { label: "Code", render: (s) => <b>{s.code}</b> },
          {
            label: "Name",
            render: (s) => (
              <Body as="span" style={{ fontWeight: 550 }}>
                {s.name}
              </Body>
            ),
          },
          { label: "Season", render: (s) => seasons.nameOf(s.seasonCode) },
          { label: "Main crop", render: (s) => crops.nameOf(s.mainCropCode) },
          {
            label: "Intercrops",
            render: (s) =>
              s.intercropCodes?.length ? (
                s.intercropCodes.map(crops.nameOf).join(", ")
              ) : (
                <span className="muted">None</span>
              ),
          },
          {
            label: "Status",
            render: (s) => (
              <Badge tone={s.isActive ? "green" : "grey"}>
                {s.isActive ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          ...(edit
            ? [
                {
                  label: " ",
                  render: (s) => (
                    <button
                      className="btn ghost sm"
                      onClick={() => setEditing(s)}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  ),
                },
              ]
            : []),
        ]}
      />
      {editing && (
        <CroppingSystemModal
          system={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function CroppingSystemModal({ system, onClose }) {
  const seasons = useMasterOptions("season");
  const crops = useCropNames();
  const create = useCreateCroppingSystem();
  const update = useUpdateCroppingSystem();
  const [seasonCode, setSeasonCode] = useState(system?.seasonCode ?? "");
  const [mainCropCode, setMainCropCode] = useState(system?.mainCropCode ?? "");
  const [intercropCodes, setIntercropCodes] = useState(
    system?.intercropCodes ?? [],
  );
  // A name made from the crops is left empty here, so it keeps following them; a typed one shows.
  const [name, setName] = useState(
    system && system.name !== systemNameOf(system, crops.nameOf)
      ? system.name
      : "",
  );
  const [description, setDescription] = useState(system?.description ?? "");
  const [isActive, setIsActive] = useState(system?.isActive ?? true);

  // Active crops, plus any crop the system already has (it may stay after being deactivated).
  const used = new Set(
    system ? [system.mainCropCode, ...system.intercropCodes] : [],
  );
  const cropChoices = crops.all.filter(
    (c) => c.isActive !== false || used.has(c.code),
  );
  const option = (code) => ({ value: code, label: crops.nameOf(code) });
  const autoName = systemNameOf({ mainCropCode, intercropCodes }, crops.nameOf);
  const valid = Boolean(seasonCode && mainCropCode);

  const body = () => ({
    seasonCode,
    mainCropCode,
    intercropCodes: intercropCodes.filter((c) => c !== mainCropCode),
    name: name.trim(),
    description: description.trim() || null,
    ...(system ? { isActive } : {}),
  });

  return (
    <SaveModal
      title={system ? `Edit ${system.code}` : "Add cropping system"}
      subtitle="One season, its main crop and the intercrops grown with it."
      wide={false}
      canSave={valid}
      onSave={async () => {
        const saved = system
          ? await update.mutateAsync({ id: system.id, ...body() })
          : await create.mutateAsync(body());
        toast.success(`${saved.code} · ${saved.name} saved`);
      }}
      onClose={onClose}
    >
      <div className="form">
        <div className="field">
          <label htmlFor="cs-season">Season</label>
          <select
            id="cs-season"
            value={seasonCode}
            onChange={(e) => setSeasonCode(e.target.value)}
          >
            <option value="">Select…</option>
            {seasons.options.map(([c, n]) => (
              <option key={c} value={c}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cs-main">Main crop</label>
          <select
            id="cs-main"
            value={mainCropCode}
            onChange={(e) => {
              setMainCropCode(e.target.value);
              setIntercropCodes((xs) => xs.filter((c) => c !== e.target.value));
            }}
          >
            <option value="">Select…</option>
            {cropChoices.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="cs-intercrops">
            Intercrops{" "}
            <SmallBody as="span" muted>
              (optional, up to {MAX_INTERCROPS})
            </SmallBody>
          </label>
          <Select
            inputId="cs-intercrops"
            isMulti
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            placeholder="None"
            value={intercropCodes.map(option)}
            options={cropChoices
              .filter((c) => c.code !== mainCropCode)
              .map((c) => option(c.code))}
            isOptionDisabled={() => intercropCodes.length >= MAX_INTERCROPS}
            onChange={(xs) => setIntercropCodes(xs.map((x) => x.value))}
          />
        </div>
        <div className="field full">
          <label htmlFor="cs-name">
            Name{" "}
            <SmallBody as="span" muted>
              (optional)
            </SmallBody>
          </label>
          <input
            id="cs-name"
            value={name}
            placeholder={autoName || "Made from the crops"}
            onChange={(e) => setName(e.target.value)}
          />
          <SmallBody muted>
            {name.trim()
              ? "Your name is kept when the crops change."
              : `Left empty, the name is “${autoName || "…"}” and follows the crops.`}
          </SmallBody>
        </div>
        <div className="field full">
          <label htmlFor="cs-description">
            Description{" "}
            <SmallBody as="span" muted>
              (optional)
            </SmallBody>
          </label>
          <textarea
            id="cs-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      {system && (
        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <Body as="span">
            Active (inactive systems stay where they are used, but can't be
            newly chosen)
          </Body>
        </label>
      )}
    </SaveModal>
  );
}
