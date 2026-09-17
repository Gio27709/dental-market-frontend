import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { instalarRecargaPorBuildViejo } from "./lib/staleBuildReload";
import { instalarClarity } from "./lib/clarity";
import { escucharInstalacion } from "./components/pwa/instalarApp";

instalarRecargaPorBuildViejo();
instalarClarity();
// Antes de montar React: el aviso de instalación del navegador llega muy pronto y solo una vez.
escucharInstalacion();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
