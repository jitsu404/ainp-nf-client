import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Database,
  FlaskConical,
  History,
  Mail,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ShieldCheck,
  UserCog,
  UserSquare2,
} from "lucide-react";
import { useAuth } from "../auth";
import { useUnreadCommunications } from "../queries/communications";
import { ROUTES } from "../config/constants";
import { programme } from "../programme/config";
import { PageErrorBoundary } from "./ErrorBoundaries";
import { FontSizeController } from "./FontSizeController";
import { Body, SmallBody, SubHeading } from "./ui";

/**
 * Navigation. Items appear based on the capabilities and manageable roles in the session from the
 * API; App.jsx only creates routes for the items shown. The prototype's other modules (finance,
 * AUC/SoE …) come back here one by one as each is connected to the backend.
 */
const researchUser = (auth) =>
  [
    "research.config",
    "research.enter",
    "research.review",
    "research.approve",
  ].some((c) => auth.can(c));

export const navItems = (auth) =>
  [
    { to: ROUTES.home, label: "Dashboard", icon: LayoutDashboard, show: true },
    {
      to: ROUTES.experiments,
      label: "Experiments",
      icon: FlaskConical,
      show: researchUser(auth),
    },
    {
      to: ROUTES.sheets,
      label: "Observation sheets",
      icon: ClipboardList,
      show: researchUser(auth),
    },
    {
      to: ROUTES.budgetAllocations,
      label: "Budget allocation",
      icon: PiggyBank,
      show: auth.can("finance.allocation") || auth.can("finance.manage"),
    },
    {
      to: ROUTES.centres,
      label: "Centres & PIs",
      icon: Building2,
      show: auth.can("centres.manage"),
    },
    {
      to: ROUTES.experimentPis,
      label: "Experiment PIs",
      icon: UserSquare2,
      show: auth.can("research.assign") && auth.can("users.manage"),
    },
    {
      to: ROUTES.accounts,
      label: "PCU accounts",
      icon: ShieldCheck,
      show: auth.assignable.some((r) => r.id === "pc"),
    },
    {
      to: ROUTES.masters,
      label: "Repository",
      icon: Database,
      show: auth.can("masters.edit"),
    },
    {
      to: ROUTES.communication,
      label: "Communication",
      icon: Mail,
      show: auth.can("comm.issue") || auth.can("comm.ack"),
      badge: "unreadCommunications",
    },
    {
      to: ROUTES.audit,
      label: "Audit trail",
      icon: History,
      show: auth.can("audit.view"),
    },
    { to: ROUTES.myAccount, label: "My account", icon: UserCog, show: true },
  ].filter((item) => item.show);

/** Unread communications for the user's side (PCU or centre), next to the nav item. */
function UnreadBadge() {
  const unread = useUnreadCommunications();
  if (!unread.data) return null;
  return (
    <span className="nav-badge" aria-label={`${unread.data} unread`}>
      {unread.data > 99 ? "99+" : unread.data}
    </span>
  );
}

export default function Layout() {
  const auth = useAuth();
  const { user, role, logout } = auth;
  const [open, setOpen] = useState(false);
  const initials = user.name
    .replace(/^(Dr|Mr|Mrs|Ms)\.?\s*/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <img src="/logos/icar.png" alt="ICAR logo" />
          <div>
            <SubHeading
              as="b"
              level="card"
              style={{ color: "var(--brand)", letterSpacing: "0.2px" }}
            >
              {programme.short}
            </SubHeading>
            <SmallBody
              muted
              as="span"
              style={{ display: "block", lineHeight: 1.3 }}
            >
              {programme.system}
              <br />
              ICAR-IIFSR, Modipuram
            </SmallBody>
          </div>
        </div>
        <nav className="nav" onClick={() => setOpen(false)}>
          <div>
            <SmallBody
              as="h5"
              color="text-muted"
              style={{
                display: "block",
                margin: "14px 8px 4px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {role.label}
            </SmallBody>
            {navItems(auth).map(({ to, label, icon: Icon, badge }) => (
              <NavLink key={to} to={to} end={to === ROUTES.home}>
                <Icon size={17} />
                <Body as="span" style={{ fontWeight: 500 }}>
                  {label}
                </Body>
                {badge === "unreadCommunications" && <UnreadBadge />}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="side-foot">
          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            {/* <img src="/logos/iifsr.png" alt="ICAR-IIFSR logo" height="34" /> */}
            <SmallBody muted>{programme.institute}</SmallBody>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <SubHeading
            as="span"
            className="title grow"
            style={{ fontWeight: 600 }}
          >
            {programme.name}
          </SubHeading>
          <FontSizeController />
          <div className="user">
            <span className="avatar">{initials}</span>
            <div>
              <Body
                as="b"
                style={{
                  fontSize: "0.929em",
                  lineHeight: 1.2,
                  display: "block",
                }}
              >
                {user.name}
              </Body>
              <SmallBody muted as="span" style={{ display: "block" }}>
                {role.label}
              </SmallBody>
            </div>
            <button
              className="icon-btn"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="content">
          {/* A failing page shows a fallback here; the sidebar and topbar keep working. */}
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
    </div>
  );
}
