import { useEffect, useState } from "react";
import Select from "react-select";
import { MailCheck, Send } from "lucide-react";
import { useAuth } from "../../auth";
import { AsyncFormModal, ErrorNote, SaveModal } from "../../components/forms";
import {
  Badge,
  Body,
  Card,
  KV,
  Modal,
  Page,
  SmallBody,
  Table,
  Tabs,
} from "../../components/ui";
import { MAX_PAGE_SIZE } from "../../config/constants";
import { formatDate, formatDateTime, useDebounced } from "../../hooks";
import { toast } from "../../lib/toast";
import { useCentres } from "../../queries/centres";
import {
  useAcknowledgeCommunication,
  useCommunication,
  useCommunicationReplies,
  useCommunications,
  useMarkCommunicationRead,
  useReplyToCommunication,
  useSendCommunication,
} from "../../queries/communications";
import { customSelectStyles } from "../experiments/components/ExperimentSeasonsField";

// Communication & correspondence: the base mailbox. Mail belongs to a side, the PCU or a centre.
// The PCU issues circulars, letters, guidelines, reminders, meeting notices and notifications to
// all or chosen centres; a centre writes letters and issues to the PCU. Recipients mark items read
// and acknowledged, and each recipient has its own reply thread with the sender.

const PCU_TYPES = [
  "Circular",
  "Letter",
  "Guideline",
  "Reminder",
  "Meeting notice",
  "Notification",
];
const CENTRE_TYPES = ["Letter", "Issue"];
const ALL_TYPES = [...PCU_TYPES, "Issue"];

const typeTone = (t) =>
  t === "Reminder" || t === "Issue"
    ? "amber"
    : t === "Circular"
      ? "blue"
      : "grey";

/** Recipients with replies first, then acknowledged, then read, then the rest by name. */
const byActivity = (receipts) =>
  receipts
    .map((r) => ({ ...r, id: r.centreId ?? "PCU" }))
    .sort(
      (a, b) =>
        b.replies - a.replies ||
        Boolean(b.acknowledgedAt) - Boolean(a.acknowledgedAt) ||
        Boolean(b.readAt) - Boolean(a.readAt) ||
        a.name.localeCompare(b.name),
    );

/** The recipient's own status: Acknowledged / Read / Unread. */
const statusOf = (c) =>
  c.acknowledgedAt ? "Acknowledged" : c.readAt ? "Read" : "Unread";
const statusTone = (s) =>
  s === "Acknowledged" ? "green" : s === "Read" ? "blue" : "amber";

export default function Communication() {
  const { can } = useAuth();
  const isPcu = can("comm.issue");
  const [box, setBox] = useState("inbox");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const q = useDebounced(search);
  const [openId, setOpenId] = useState(null);
  const [composing, setComposing] = useState(false);

  const filters = {
    box,
    limit: MAX_PAGE_SIZE,
    ...(type ? { type } : {}),
    ...(box === "inbox" && status ? { status } : {}),
    ...(q.trim() ? { search: q.trim() } : {}),
  };
  const list = useCommunications(filters);
  const rows = list.data?.data ?? [];

  return (
    <Page
      title="Communication"
      actions={
        <button className="btn" onClick={() => setComposing(true)}>
          <Send size={15} />{" "}
          {isPcu ? "Issue communication" : "Write to the PCU"}
        </button>
      }
    >
      <Tabs
        value={box}
        onChange={(b) => {
          setBox(b);
          setStatus("");
        }}
        tabs={[
          ["inbox", "Inbox"],
          ["sent", "Sent"],
        ]}
      />
      <Card pad={false}>
        <div className="toolbar">
          <input
            className="select"
            aria-label="Search"
            placeholder="Search subject, reference or text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <select
            className="select"
            aria-label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {box === "inbox" && (
            <select
              className="select"
              aria-label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="unread">Unread</option>
              <option value="unacknowledged">Not acknowledged</option>
            </select>
          )}
        </div>
        <ErrorNote error={list.error} />
        <Table
          rows={rows}
          pageSize={15}
          onRow={(r) => setOpenId(r.id)}
          empty={
            list.isPending
              ? "Loading…"
              : box === "inbox"
                ? "Nothing received yet."
                : "Nothing sent yet."
          }
          columns={[
            {
              label: "Reference",
              render: (r) => (
                <SmallBody as="span" className="mono">
                  {r.refNo}
                </SmallBody>
              ),
            },
            {
              label: "Type",
              render: (r) => <Badge tone={typeTone(r.type)}>{r.type}</Badge>,
            },
            {
              label: "Subject",
              render: (r) => (
                <Body
                  as="span"
                  style={{
                    fontWeight: box === "inbox" && !r.readAt ? 700 : 500,
                  }}
                >
                  {r.subject}
                </Body>
              ),
            },
            box === "inbox"
              ? { label: "From", render: (r) => r.from }
              : {
                  label: "To",
                  render: (r) =>
                    r.toAllCentres
                      ? "All centres"
                      : r.fromCentreId
                        ? "PCU"
                        : `${r.recipients} centre${r.recipients === 1 ? "" : "s"}`,
                },
            { label: "Date", render: (r) => formatDate(r.createdAt) },
            {
              label: "Reply due",
              render: (r) => (r.dueDate ? formatDate(r.dueDate) : "—"),
            },
            box === "inbox"
              ? {
                  label: "Status",
                  render: (r) => (
                    <Badge tone={statusTone(statusOf(r))}>{statusOf(r)}</Badge>
                  ),
                }
              : {
                  label: "Read / acknowledged",
                  render: (r) =>
                    `${r.read} / ${r.acknowledged} of ${r.recipients}`,
                },
          ]}
        />
      </Card>

      {openId && (
        <CommunicationModal id={openId} onClose={() => setOpenId(null)} />
      )}
      {composing && (
        <ComposeModal isPcu={isPcu} onClose={() => setComposing(false)} />
      )}
    </Page>
  );
}

function ComposeModal({ isPcu, onClose }) {
  const send = useSendCommunication();
  const centres = useCentres({ isActive: true }, { enabled: isPcu });
  const centreOptions = (centres.data?.data ?? []).map((c) => ({
    value: c.id,
    label: `${c.code} · ${c.name}`,
  }));
  const [v, setV] = useState({
    type: isPcu ? "Circular" : "Letter",
    toAll: true,
    centreIds: [],
    subject: "",
    body: "",
    replyRequired: false,
    dueDate: "",
  });
  const set = (k, value) => setV((x) => ({ ...x, [k]: value }));
  const valid =
    v.subject.trim().length >= 3 &&
    v.body.trim() &&
    (!isPcu || v.toAll || v.centreIds.length > 0);

  return (
    <SaveModal
      title={isPcu ? "Issue communication" : "Write to the PCU"}
      subtitle={
        isPcu
          ? "Sent to the chosen centres' inboxes; each centre reads, acknowledges and can reply."
          : "Sent to the PCU's inbox. The PCU can reply here."
      }
      submitLabel="Send"
      wide={false}
      canSave={Boolean(valid)}
      onSave={async () => {
        const sent = await send.mutateAsync({
          type: v.type,
          subject: v.subject.trim(),
          body: v.body.trim(),
          ...(isPcu
            ? v.toAll
              ? { toAllCentres: true }
              : { centreIds: v.centreIds }
            : {}),
          replyRequired: v.replyRequired,
          dueDate: v.dueDate || null,
        });
        toast.success(`${sent.refNo} sent`);
      }}
      onClose={onClose}
    >
      <div className="form">
        <div className="field">
          <label htmlFor="cm-type">Type</label>
          <select
            id="cm-type"
            value={v.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {(isPcu ? PCU_TYPES : CENTRE_TYPES).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>To</label>
          {isPcu ? (
            <select
              aria-label="Send to"
              value={v.toAll ? "all" : "some"}
              onChange={(e) => set("toAll", e.target.value === "all")}
            >
              <option value="all">All centres</option>
              <option value="some">Chosen centres…</option>
            </select>
          ) : (
            <input value="Project Coordination Unit (PCU)" disabled />
          )}
        </div>
        {isPcu && !v.toAll && (
          <div className="field full">
            <label htmlFor="cm-centres">Centres</label>
            <Select
              inputId="cm-centres"
              isMulti
              styles={customSelectStyles}
              menuPortalTarget={document.body}
              placeholder="Choose centres…"
              options={centreOptions}
              value={centreOptions.filter((o) => v.centreIds.includes(o.value))}
              onChange={(xs) =>
                set(
                  "centreIds",
                  xs.map((x) => x.value),
                )
              }
            />
          </div>
        )}
        <div className="field full">
          <label htmlFor="cm-subject">Subject</label>
          <input
            id="cm-subject"
            value={v.subject}
            onChange={(e) => set("subject", e.target.value)}
          />
        </div>
        <div className="field full">
          <label htmlFor="cm-body">Message</label>
          <textarea
            id="cm-body"
            rows={7}
            value={v.body}
            onChange={(e) => set("body", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cm-due">
            Reply due by{" "}
            <SmallBody as="span" muted>
              (optional)
            </SmallBody>
          </label>
          <input
            id="cm-due"
            type="date"
            value={v.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
          />
        </div>
        <label className="row" style={{ gap: 8, alignSelf: "end" }}>
          <input
            type="checkbox"
            checked={v.replyRequired}
            onChange={(e) => set("replyRequired", e.target.checked)}
          />
          <Body as="span">Reply required</Body>
        </label>
      </div>
    </SaveModal>
  );
}

function CommunicationModal({ id, onClose }) {
  const detail = useCommunication(id);
  const markRead = useMarkCommunicationRead();
  const acknowledge = useAcknowledgeCommunication();
  const c = detail.data;
  const [thread, setThread] = useState(null); // sender: the recipient centre whose thread is open
  const [replying, setReplying] = useState(false);

  // Opening an unread item marks it read for the recipient's side.
  const needsRead = c && !c.sent && !c.readAt;
  useEffect(() => {
    if (needsRead) markRead.mutate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRead, id]);

  const single = c?.receipts.length === 1;
  const threadCentre = c?.sent
    ? single
      ? (c.receipts[0].centreId ?? undefined)
      : (thread ?? undefined)
    : undefined;
  const showThread = c && (!c.sent || single || thread !== null);

  return (
    <Modal
      wide
      title={c ? c.subject : "Communication"}
      subtitle={c ? `${c.type} · ${c.refNo}` : undefined}
      onClose={onClose}
    >
      <ErrorNote error={detail.error} />
      {!c ? (
        <Body muted>Loading…</Body>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          <KV
            items={[
              ["From", `${c.from} (${c.sentByName})`],
              ["Date", formatDateTime(c.createdAt)],
              [
                "To",
                c.toAllCentres
                  ? "All centres"
                  : c.fromCentreId
                    ? "PCU"
                    : c.receipts.map((r) => r.name).join(", "),
              ],
              ["Reply due", c.dueDate ? formatDate(c.dueDate) : "—"],
              ["Reply required", c.replyRequired ? "Yes" : "No"],
            ]}
          />
          <div className="note" style={{ whiteSpace: "pre-wrap" }}>
            {c.body}
          </div>

          {!c.sent && (
            <div className="row" style={{ gap: 10 }}>
              <Badge tone={statusTone(statusOf(c))}>{statusOf(c)}</Badge>
              {c.acknowledgedAt ? (
                <SmallBody muted>
                  Acknowledged {formatDateTime(c.acknowledgedAt)}
                </SmallBody>
              ) : (
                <button
                  className="btn ghost sm"
                  disabled={acknowledge.isPending}
                  onClick={async () => {
                    await acknowledge.mutateAsync(id);
                    toast.success("Acknowledged");
                  }}
                >
                  <MailCheck size={14} /> Acknowledge receipt
                </button>
              )}
            </div>
          )}

          {c.sent && !single && (
            <Card pad={false} title="Recipients">
              <Table
                rows={byActivity(c.receipts)}
                pageSize={10}
                onRow={(r) => setThread(r.centreId)}
                columns={[
                  { label: "Centre", render: (r) => r.name },
                  {
                    label: "Status",
                    render: (r) => (
                      <Badge tone={statusTone(statusOf(r))}>
                        {statusOf(r)}
                      </Badge>
                    ),
                  },
                  {
                    label: "Read",
                    render: (r) => (r.readAt ? formatDateTime(r.readAt) : "—"),
                  },
                  {
                    label: "Acknowledged",
                    render: (r) =>
                      r.acknowledgedAt
                        ? `${formatDateTime(r.acknowledgedAt)}${r.acknowledgedByName ? ` · ${r.acknowledgedByName}` : ""}`
                        : "—",
                  },
                  {
                    label: "Replies",
                    num: true,
                    render: (r) => (
                      <b
                        style={{
                          fontWeight: thread === r.centreId ? 700 : 400,
                        }}
                      >
                        {r.replies}
                      </b>
                    ),
                  },
                ]}
              />
              <SmallBody muted as="p" style={{ padding: "6px 12px" }}>
                Click a centre to open its reply thread.
              </SmallBody>
            </Card>
          )}

          {c.sent && single && (
            <SmallBody muted>
              {c.receipts[0].name}: {statusOf(c.receipts[0])}
              {c.receipts[0].readAt
                ? `, read ${formatDateTime(c.receipts[0].readAt)}`
                : ""}
            </SmallBody>
          )}

          {showThread && (
            <ReplyThread
              id={id}
              centreId={threadCentre}
              title={
                c.sent && !single
                  ? `Replies with ${c.receipts.find((r) => r.centreId === thread)?.name ?? ""}`
                  : "Replies"
              }
              onReply={() => setReplying(true)}
            />
          )}
        </div>
      )}
      {replying && c && (
        <ReplyModal
          id={id}
          centreId={threadCentre}
          onClose={() => setReplying(false)}
        />
      )}
    </Modal>
  );
}

function ReplyThread({ id, centreId, title, onReply }) {
  const replies = useCommunicationReplies(id, centreId);
  const rows = replies.data ?? [];
  return (
    <Card
      title={title}
      actions={
        <button className="btn ghost sm" onClick={onReply}>
          <Send size={14} /> Reply
        </button>
      }
    >
      <ErrorNote error={replies.error} />
      {rows.length === 0 && (
        <SmallBody muted>
          {replies.isPending ? "Loading…" : "No replies yet."}
        </SmallBody>
      )}
      <div className="stack" style={{ gap: 8 }}>
        {rows.map((r) => (
          <div
            key={r.id}
            className="note"
            style={{
              margin: 0,
              marginLeft: r.mine ? 40 : 0,
              marginRight: r.mine ? 0 : 40,
              background: r.mine ? "var(--brand-50)" : undefined,
            }}
          >
            <SmallBody muted as="div">
              {r.createdByName} · {formatDateTime(r.createdAt)}
            </SmallBody>
            <Body as="div" style={{ whiteSpace: "pre-wrap" }}>
              {r.body}
            </Body>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReplyModal({ id, centreId, onClose }) {
  const reply = useReplyToCommunication();
  return (
    <AsyncFormModal
      title="Reply"
      submitLabel="Send reply"
      fields={[{ name: "body", label: "Reply", type: "textarea", full: true }]}
      onSubmit={({ body }) => reply.mutateAsync({ id, body, centreId })}
      onDone={() => toast.success("Reply sent")}
      onClose={onClose}
    />
  );
}
