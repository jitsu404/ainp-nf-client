import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { AuthProvider } from "./auth";
import { AppErrorBoundary } from "./components/ErrorBoundaries";
import { installGlobalErrorHandlers } from "./lib/errors";
import { queryClient } from "./lib/queryClient";
import "./styles.css";
import "./programme/theme.css";

// Catch uncaught errors and unhandled promise rejections anywhere in the app.
installGlobalErrorHandlers();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        {/* Development only: tree-shaken out of production builds. */}
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);
