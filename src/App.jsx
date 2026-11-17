import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import Layout, { navItems } from "./components/Layout";
import { ROUTES } from "./config/constants";
import { Toaster } from "./lib/toast";
import Accounts from "./pages/Accounts";
import Audit from "./pages/Audit";
import AccountPage, { ForcedPasswordChange } from "./pages/ChangePassword";
import CentreDetail from "./pages/CentreDetail";
import Centres from "./pages/Centres";
import ExperimentDetail from "./pages/ExperimentDetail";
import Experiments from "./pages/Experiments";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Masters from "./pages/Masters";
import SheetDetail from "./pages/SheetDetail";
import Sheets from "./pages/Sheets";
import TrialDetail from "./pages/TrialDetail";

// Live app: centres and accounts, masters, and research (experiments → trials → observation
// sheets), all through the API. The prototype's other screens (Finance, AUC/SoE …) stay in the
// codebase and are brought back as each module gets its backend.

export default function App() {
  const auth = useAuth();

  let content;
  if (auth.status === "loading")
    content = <div className="splash">Loading…</div>;
  else if (auth.status === "anonymous") content = <Login />;
  else if (auth.session.mustChangePassword) content = <ForcedPasswordChange />;
  else {
    const allowed = new Set(navItems(auth).map((item) => item.to));
    content = (
      <Routes>
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
          {allowed.has(ROUTES.masters) && (
            <Route path={ROUTES.masters} element={<Masters />} />
          )}
          {allowed.has(ROUTES.audit) && (
            <Route path={ROUTES.audit} element={<Audit />} />
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
