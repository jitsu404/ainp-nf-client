import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { PhotoCarousel } from "../components/PhotoCarousel";
import { ROUTES } from "../config/constants";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import { programme } from "../programme/config";

export default function Login() {
  const { login, notice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        <header className="hero-head">
          <img className="hero-logo" src="/logos/icar.png" alt="ICAR logo" />
          <div>
            <h1>{programme.name}</h1>
            <p className="scheme">{programme.system}</p>
          </div>
        </header>
        <div className="hero-media">
          <img
            className="hero-map"
            src="/login-map.jpg"
            alt="Map of the 20 AINP-NF centres across India"
          />
          <PhotoCarousel />
        </div>
        <div className="address">
          <b>
            {programme.unit}
            <br />
            {programme.instituteShort}
            {programme.place}
          </b>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Link to={ROUTES.landing} className="back-home small">
            <ArrowLeft size={13} /> Back to the home page
          </Link>
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
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 36 }}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 4,
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
