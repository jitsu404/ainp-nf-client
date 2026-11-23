import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import {
  Body,
  Card,
  LargeHeading,
  Page,
  SmallBody,
  SubHeading,
} from "../components/ui";
import { PASSWORD_RULE } from "../config/constants";
import { programme } from "../programme/config";

const RULE = PASSWORD_RULE.text;
const meetsRule = PASSWORD_RULE.test;

function PasswordForm({ onDone }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const mismatch = confirm && next !== confirm;
  const ready = current && meetsRule(next) && next === confirm;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      onDone?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="stack" noValidate>
      <ErrorNote error={error} />
      <div className="field">
        <label htmlFor="current">
          <Body as="span">Current password</Body>
        </label>
        <input
          id="current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="next">
          <Body as="span">New password</Body>
        </label>
        <input
          id="next"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <SmallBody
          className={next && !meetsRule(next) ? "field-error" : "muted"}
        >
          {RULE}
        </SmallBody>
      </div>
      <div className="field">
        <label htmlFor="confirm">
          <Body as="span">Confirm new password</Body>
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {mismatch && (
          <SmallBody className="field-error">
            The passwords don’t match
          </SmallBody>
        )}
      </div>
      <button className="btn" type="submit" disabled={!ready || busy}>
        {busy ? <Loader2 size={16} className="spin" /> : <KeyRound size={16} />}{" "}
        Change password
      </button>
    </form>
  );
}

/** Full-screen step shown after signing in with a temporary password. */
export function ForcedPasswordChange() {
  const { user, logout } = useAuth();
  return (
    <div className="login">
      <section className="login-hero">
        <div>
          <div className="logos">
            <img src="/logos/icar.png" alt="ICAR logo" />
            {/* <img src="/logos/iifsr.png" alt="ICAR-IIFSR logo" /> */}
          </div>
          <LargeHeading as="h1">
            {programme.short}
            <br />
            {programme.system}
          </LargeHeading>
          <Body as="p" className="scheme">
            {programme.name}
          </Body>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <SmallBody as="span" className="eyebrow">
            Welcome, {user.name}
          </SmallBody>
          <SubHeading as="h2" style={{ fontSize: "1.4em", marginBottom: 8 }}>
            Choose your password
          </SubHeading>
          <Body muted style={{ marginBottom: 14 }}>
            You signed in with a temporary password. Choose your own to
            continue.
          </Body>
          <PasswordForm />
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

/** "My account" page, for changing the password at any time. */
export default function AccountPage({ onChanged }) {
  const { user, role } = useAuth();
  const [done, setDone] = useState(false);
  return (
    <Page title="My account">
      <div className="grid g2">
        <Card title="Profile">
          <div className="kv" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <SmallBody muted as="span">
                Name
              </SmallBody>
              <Body as="b">{user.name}</Body>
            </div>
            <div>
              <SmallBody muted as="span">
                Email
              </SmallBody>
              <Body as="b">{user.email}</Body>
            </div>
            <div>
              <SmallBody muted as="span">
                Role
              </SmallBody>
              <Body as="b">{role.label}</Body>
            </div>
            {user.designation && (
              <div>
                <SmallBody muted as="span">
                  Designation
                </SmallBody>
                <Body as="b">{user.designation}</Body>
              </div>
            )}
          </div>
        </Card>
        <Card title="Change password">
          {done && (
            <div className="note" style={{ marginBottom: 12 }}>
              <Body>Password changed. Other devices have been signed out.</Body>
            </div>
          )}
          <PasswordForm
            onDone={() => {
              setDone(true);
              onChanged?.();
            }}
          />
        </Card>
      </div>
    </Page>
  );
}
