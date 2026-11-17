import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { ApiError } from "../api";
import { ROUTES } from "../config/constants";
import { describeError, markBoundaryHandled } from "../lib/errors";

const logInDev = (error, info) => {
  // The fallback already tells the user, so the global handler mustn't toast it as well.
  markBoundaryHandled(error);
  if (import.meta.env.DEV)
    console.error("[error boundary]", error, info?.componentStack); // eslint-disable-line no-console
};

function Details({ error }) {
  const reference = error instanceof ApiError && error.requestId;
  if (!reference && !import.meta.env.DEV) return null;
  return (
    <div className="muted small" style={{ marginTop: 8 }}>
      {reference && <div>Reference: {error.requestId}</div>}
      {import.meta.env.DEV && !(error instanceof ApiError) && (
        <pre className="error-stack">{String(error?.stack ?? error)}</pre>
      )}
    </div>
  );
}

/** Fallback inside the app frame: navigation stays usable, only the page content is replaced. */
function PageFallback({ error, resetErrorBoundary }) {
  return (
    <div className="card error-fallback" role="alert">
      <AlertTriangle size={28} color="var(--amber)" />
      <h2>This page couldn’t be shown</h2>
      <p className="muted">{describeError(error)}</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <button className="btn" onClick={resetErrorBoundary}>
          <RefreshCw size={15} /> Try again
        </button>
        <Link className="btn ghost" to={ROUTES.home}>
          <Home size={15} /> Dashboard
        </Link>
      </div>
      <Details error={error} />
    </div>
  );
}

/**
 * Wraps each page. Catches render errors and first-load query failures (see lib/queryClient.js).
 * "Try again" resets failed queries so they refetch; moving to another page resets it too.
 */
export function PageErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={PageFallback}
          onReset={reset}
          onError={logInDev}
          resetKeys={[pathname]}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

/** Last-resort fallback for the whole app (e.g. the layout itself failed). */
function AppFallback({ error }) {
  return (
    <div className="splash">
      <div className="card error-fallback" role="alert">
        <AlertTriangle size={32} color="var(--red)" />
        <h2>Something went wrong</h2>
        <p className="muted">
          The application ran into an unexpected problem. Reloading usually
          fixes it.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={() => window.location.reload()}>
            <RefreshCw size={15} /> Reload
          </button>
        </div>
        <Details error={error} />
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={AppFallback} onError={logInDev}>
      {children}
    </ErrorBoundary>
  );
}
