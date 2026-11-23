import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { PhotoCarousel } from "../components/PhotoCarousel";
import { ROUTES } from "../config/constants";
import { useAuth } from "../auth";
import { ErrorNote } from "../components/forms";
import { programme } from "../programme/config";
import { Body, LargeHeading, SmallBody, SubHeading } from "../components/ui";

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
            <LargeHeading as="h1">{programme.name}</LargeHeading>
            <Body as="p" className="scheme">
              {programme.system}
            </Body>
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
          <Body as="b" style={{ fontWeight: 600 }}>
            {programme.unit}
            <br />
            {programme.instituteShort}
            {programme.place}
          </Body>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Link to={ROUTES.landing} className="back-home small">
            <ArrowLeft size={13} /> <SmallBody>Back to the home page</SmallBody>
          </Link>
          <SmallBody as="span" className="eyebrow">
            {programme.short}
          </SmallBody>
          <SubHeading as="h2" style={{ fontSize: "1.4em", marginBottom: 12 }}>
            Sign in
          </SubHeading>
          <form onSubmit={submit} noValidate>
            {notice && !error && (
              <div className="note warn">
                <Body>{notice}</Body>
              </div>
            )}
            <ErrorNote error={error} />
            <div className="field">
              <label htmlFor="email">
                <Body as="span">Email</Body>
              </label>
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
              <label htmlFor="password">
                <Body as="span">Password</Body>
              </label>
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
            <SmallBody muted as="p" style={{ marginTop: 14 }}>
              Accounts are created by the Project Coordination Unit. Forgot your
              password? Ask the PCU to reset it.
            </SmallBody>
          </form>
        </div>
      </section>
    </div>
  );
}
