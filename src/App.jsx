import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import Layout, { navItems } from "./components/Layout";
import { ROUTES } from "./config/constants";
import { Toaster } from "./lib/toast";
import Accounts from "./pages/Accounts";
import Audit from "./pages/Audit";
import BudgetAllocation from "./pages/BudgetAllocation";
import AccountPage, { ForcedPasswordChange } from "./pages/ChangePassword";
import CentreDetail from "./pages/CentreDetail";
import Centres from "./pages/Centres";
import ExperimentDetail from "./pages/experiment-details/index.jsx";
import ExperimentPis from "./pages/ExperimentPis";
import Experiments from "./pages/experiments/index.jsx";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Masters from "./pages/masters";
import SheetDetail from "./pages/SheetDetail";
import Sheets from "./pages/Sheets";
import TrialDetail from "./pages/trials/index.jsx";
import { About, AnnualReports, Publications } from "./pages/public/InfoPage";
import Landing from "./pages/public/Landing";
import PublicLayout from "./pages/public/PublicLayout";

// Two parts:
// - the public website (landing page, About us, Publications, Annual reports) and /login, open to
//   everyone;
// - the live app (centres and accounts, masters, research: experiments → trials → observation
//   sheets) behind sign-in, starting at ROUTES.home (/dashboard). Opening an app address while
//   signed out goes to /login, which comes back to that address after signing in.
// The prototype's other screens (Finance, AUC/SoE …) stay in the codebase and are brought back as
// each module gets its backend.

const publicRoutes = (
  <Route element={<PublicLayout />}>
    <Route path={ROUTES.landing} element={<Landing />} />
    <Route path={ROUTES.about} element={<About />} />
    <Route path={ROUTES.publications} element={<Publications />} />
    <Route path={ROUTES.annualReports} element={<AnnualReports />} />
  </Route>
);

/** After signing in: back to the page that sent the user to /login, else the dashboard. */
function AfterLogin() {
  const from = useLocation().state?.from;
  const to =
    from && from.pathname !== ROUTES.login
      ? `${from.pathname}${from.search ?? ""}`
      : ROUTES.home;
  return <Navigate to={to} replace />;
}

/** Signed out on an app address: go to /login and remember where to come back. */
function ToLogin() {
  const location = useLocation();
  return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
}

export default function App() {
  const auth = useAuth();

  let content;
  if (auth.status === "loading")
    content = (
      <Routes>
        {publicRoutes}
        <Route path="*" element={<div className="splash">Loading…</div>} />
      </Routes>
    );
  else if (auth.status === "anonymous")
    content = (
      <Routes>
        {publicRoutes}
        <Route path={ROUTES.login} element={<Login />} />
        <Route path="*" element={<ToLogin />} />
      </Routes>
    );
  else if (auth.session.mustChangePassword)
    content = (
      <Routes>
        {publicRoutes}
        <Route path="*" element={<ForcedPasswordChange />} />
      </Routes>
    );
  else {
    const allowed = new Set(navItems(auth).map((item) => item.to));
    content = (
      <Routes>
        {publicRoutes}
        <Route path={ROUTES.login} element={<AfterLogin />} />
        <Route element={<Layout />}>
          <Route path={ROUTES.home} element={<Home />} />
          {allowed.has(ROUTES.centres) && (
            <Route path={ROUTES.centres} element={<Centres />} />
          )}
          {allowed.has(ROUTES.centres) && (
            <Route path={ROUTES.centre(":id")} element={<CentreDetail />} />
          )}
          {allowed.has(ROUTES.accounts) && (
            <Route path={ROUTES.accounts} element={<Accounts />} />
          )}
          {allowed.has(ROUTES.experimentPis) && (
            <Route path={ROUTES.experimentPis} element={<ExperimentPis />} />
          )}
          {allowed.has(ROUTES.masters) && (
            <Route path={ROUTES.masters} element={<Masters />} />
          )}
          {allowed.has(ROUTES.audit) && (
            <Route path={ROUTES.audit} element={<Audit />} />
          )}
          {allowed.has(ROUTES.budgetAllocations) && (
            <Route
              path={ROUTES.budgetAllocations}
              element={<BudgetAllocation />}
            />
          )}
          {allowed.has(ROUTES.experiments) && (
            <>
              <Route path={ROUTES.experiments} element={<Experiments />} />
              <Route
                path={ROUTES.experiment(":id")}
                element={<ExperimentDetail />}
              />
              <Route path={ROUTES.trial(":id")} element={<TrialDetail />} />
            </>
          )}
          {allowed.has(ROUTES.sheets) && (
            <>
              <Route path={ROUTES.sheets} element={<Sheets />} />
              <Route path={ROUTES.sheet(":id")} element={<SheetDetail />} />
            </>
          )}
          <Route path={ROUTES.myAccount} element={<AccountPage />} />
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Route>
      </Routes>
    );
  }

  return (
    <>
      <div className="tricolour" />
      {content}
      <Toaster />
    </>
  );
}
