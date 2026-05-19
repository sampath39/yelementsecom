import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ✅ ADD THIS
import { setBaseUrl } from "@workspace/api-client-react";

// ✅ ADD THIS
setBaseUrl(import.meta.env.VITE_API_URL);

createRoot(document.getElementById("root")!).render(<App />);