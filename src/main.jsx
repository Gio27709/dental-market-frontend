import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { instalarRecargaPorBuildViejo } from "./lib/staleBuildReload";
import { instalarClarity } from "./lib/clarity";

instalarRecargaPorBuildViejo();
instalarClarity();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
