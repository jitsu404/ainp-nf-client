import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Plus, UserRoundCog, UsersRound } from "lucide-react";
import {
  CreateExperimentPiModal,
  EditExperimentPiModal,
  PiCard,
  ReplaceExperimentPiModal,
} from "../components/ExperimentPis";
import {
  AsyncFormModal,
  CredentialsModal,
  ErrorNote,
} from "../components/forms";
import { seatPasswordField } from "../components/personFields";
import { Badge, Card, Modal, Page, Table } from "../components/ui";
import { ROUTES } from "../config/constants";
import { formatDate } from "../hooks";
import { useExperimentPis } from "../queries/experimentPis";
import { useResetPassword } from "../queries/users";

// The PCU's list of Experiment PI seats (pi1.npnf@icar.org.in …): who holds each, which experiment
// it leads, and past holders. A seat is linked to an experiment from the experiment page.

export default function ExperimentPis() {
  const seats = useExperimentPis();
  const [open, setOpen] = useState(null); // seat id
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'replace' | 'reset'
  const [credentials, setCredentials] = useState(null);
  const resetPassword = useResetPassword();
  const rows = seats.data ?? [];
  const seat = rows.find((s) => s.id === open);
  const close = () => setModal(null);
  const showCredentials = (s, password, title) =>
    setCredentials({
      name: s.name,
      email: s.loginEmail,
      password,
      title,
      mustChange: false,
    });

  return (
    <Page
      title="Experiment PIs"
      actions={
        <button className="btn" onClick={() => setModal("create")}>
          <Plus size={15} /> New Experiment PI
        </button>
      }
    >
      <div className="stack">
        <ErrorNote error={seats.error} />
        <Card pad={false}>
          <Table
            rows={rows}
            pageSize={30}
            onRow={(s) => setOpen(s.id)}
            empty={
              seats.isPending
                ? "Loading…"
                : "No Experiment PIs yet. Create one, then link it to an experiment."
            }
            columns={[
              {
                label: "Login",
                render: (s) => <span className="mono">{s.loginEmail}</span>,
              },
              {
                label: "Held by",
                render: (s) => <b style={{ fontWeight: 550 }}>{s.name}</b>,
              },
              { label: "Designation", render: (s) => s.designation || "—" },
              { label: "Email", key: "email" },
              {
                label: "Experiment",
                render: (s) =>
                  s.experiment ? (
                    <span>
                      <span className="mono">{s.experiment.code}</span>{" "}
                      {s.experiment.title}
                    </span>
                  ) : (
                    <Badge tone="amber">Not linked</Badge>
                  ),
              },
              {
                label: "Since",
                render: (s) => (
                  <span className="nowrap">{formatDate(s.occupiedSince)}</span>
                ),
              },
              {
                label: "Status",
                render: (s) => (
                  <Badge>{s.isActive ? "Active" : "Inactive"}</Badge>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {seat && !modal && (
        <Modal
          wide
          title={<span className="mono">{seat.loginEmail}</span>}
          subtitle="Experiment PI login"
          onClose={() => setOpen(null)}
        >
          <div className="stack">
            <PiCard pi={seat} />
            <div>
              <span className="muted small">Experiment</span>
              <div>
                {seat.experiment ? (
                  <Link to={ROUTES.experiment(seat.experiment.id)}>
                    {seat.experiment.code} · {seat.experiment.title}
                  </Link>
                ) : (
                  "Not linked yet. Link it from the experiment's page."
                )}
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn ghost sm" onClick={() => setModal("edit")}>
                <UserRoundCog size={14} /> Edit details
              </button>
              <button
                className="btn ghost sm"
                onClick={() => setModal("reset")}
              >
                <KeyRound size={14} /> Set new password
              </button>
              <button className="btn sm" onClick={() => setModal("replace")}>
                <UsersRound size={14} /> Replace person
              </button>
            </div>
            <Card title="Previous holders" pad={false}>
              <Table
                rows={seat.history.map((h, i) => ({ ...h, id: i }))}
                empty="Nobody else has held this login."
                columns={[
                  {
                    label: "Name",
                    render: (h) => <b style={{ fontWeight: 550 }}>{h.name}</b>,
                  },
                  { label: "Designation", render: (h) => h.designation || "—" },
                  { label: "Email", render: (h) => h.email || "—" },
                  {
                    label: "From",
                    render: (h) => (
                      <span className="nowrap">{formatDate(h.from)}</span>
                    ),
                  },
                  {
                    label: "To",
                    render: (h) => (
                      <span className="nowrap">{formatDate(h.to)}</span>
                    ),
                  },
                  { label: "Reason", render: (h) => h.reason || "—" },
                ]}
              />
            </Card>
          </div>
        </Modal>
      )}

      {modal === "create" && (
        <CreateExperimentPiModal
          onClose={close}
          onCreated={(s, password) =>
            showCredentials(s, password, "Experiment PI created")
          }
        />
      )}
      {modal === "edit" && seat && (
        <EditExperimentPiModal seat={seat} onClose={close} />
      )}
      {modal === "replace" && seat && (
        <ReplaceExperimentPiModal
          seat={seat}
          onClose={close}
          onReplaced={(s, password) =>
            showCredentials(s, password, "New PI holds the login")
          }
        />
      )}
      {modal === "reset" && seat && (
        <AsyncFormModal
          title={`New password for ${seat.loginEmail}`}
          intro={
            <p className="muted" style={{ margin: 0 }}>
              {seat.name} is signed out everywhere and signs in again with this
              password.
            </p>
          }
          fields={[seatPasswordField("temporaryPassword")]}
          submitLabel="Set password"
          onSubmit={(body) =>
            resetPassword.mutateAsync({ id: seat.id, ...body })
          }
          onDone={(_r, body) =>
            showCredentials(seat, body.temporaryPassword, "Password set")
          }
          onClose={close}
        />
      )}
      {credentials && (
        <CredentialsModal
          {...credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </Page>
  );
}
