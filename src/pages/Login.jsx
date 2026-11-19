import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import { programme } from "../programme/config";

export default function Login() {
  const { login, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login-hero">
        <div className="hero-text">
          <div>
            <img className="hero-logo" src="/logos/icar.png" alt="ICAR logo" />
            <h1>{programme.name}</h1>
            <p className="scheme">
              ({programme.short}) {programme.system}
            </p>
          </div>
          <div className="address">
            <b>{programme.institute}</b>
            {programme.instituteHi}
            <br />
            {programme.place}
          </div>
        </div>
        <img
          className="hero-map"
          src="/login-map.jpg"
          alt="Map of the 20 AINP-NF centres across India"
        />
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">{programme.short}</span>
          <h2>Sign in</h2>
          <form onSubmit={submit} noValidate>
            {notice && !error && <div className="note warn">{notice}</div>}
            <ErrorNote error={error} />
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              className="btn"
              type="submit"
              disabled={!email || !password || busy}
            >
              {busy ? (
                <Loader2 size={16} className="spin" />
              ) : (
                <LogIn size={16} />
              )}{" "}
              Sign in
            </button>
            <p className="muted small">
              Accounts are created by the Project Coordination Unit. Forgot your
              password? Ask the PCU to reset it.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
