import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AppServicesProvider } from "./services";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppServicesProvider>
      <App />
    </AppServicesProvider>
  </StrictMode>
);
