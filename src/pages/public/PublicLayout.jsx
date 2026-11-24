import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import { useAuth } from "../../auth";
import { ROUTES } from "../../config/constants";
import { programme } from "../../programme/config";
import { Body, LargeHeading, SmallBody } from "../../components/ui";

// The public website around the landing page and the About / PCU / Publications / Annual reports pages:
// a government-style header (logo and programme name on one line), a menu bar and a footer.
// Anyone can see it; the menu's last button is "Login", or "Dashboard" once signed in.

const MENU = [
  { to: ROUTES.landing, label: "Home", end: true },
  { to: ROUTES.about, label: "About us" },
  { to: ROUTES.pcu, label: "PCU" },
  { to: ROUTES.publications, label: "Publications" },
  { to: ROUTES.annualReports, label: "Annual reports" },
];

export default function PublicLayout() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";
  const [open, setOpen] = useState(false);

  return (
    <div className="site">
      <header className="site-top">
        <div className="site-wrap site-brand">
          <Link to={ROUTES.landing} className="site-title">
            <img src="/logos/icar.png" alt="ICAR logo" />
            <LargeHeading as="h1">{programme.name}</LargeHeading>
          </Link>
          {/* <img
            className="site-partner"
            src="/logos/iifsr.png"
            alt="ICAR-IIFSR logo"
          /> */}
        </div>
      </header>

      <nav className="site-nav" aria-label="Main menu">
        <div className="site-wrap site-nav-row">
          <button
            type="button"
            className="site-menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={18} /> : <Menu size={18} />} Menu
          </button>
          <ul id="site-menu" className={open ? "open" : ""}>
            {MENU.map((m) => (
              <li key={m.to}>
                <NavLink to={m.to} end={m.end} onClick={() => setOpen(false)}>
                  <Body as="span">{m.label}</Body>
                </NavLink>
              </li>
            ))}
          </ul>
          <Link
            to={signedIn ? ROUTES.home : ROUTES.login}
            className="site-login"
          >
            {signedIn ? (
              <>
                <LayoutDashboard size={15} /> Dashboard
              </>
            ) : (
              <>
                <LogIn size={15} /> Login
              </>
            )}
          </Link>
        </div>
      </nav>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-wrap">
          <div>
            <Body as="b" style={{ fontWeight: 600 }}>
              {programme.instituteShort}
            </Body>
            <SmallBody as="div">{programme.instituteHi}</SmallBody>
            <SmallBody as="div">{programme.place}</SmallBody>
          </div>
          <SmallBody as="div" muted className="small">
            © {new Date().getFullYear()} {programme.institute}.{" "}
            {programme.short} {programme.system}.
          </SmallBody>
        </div>
      </footer>
    </div>
  );
}
