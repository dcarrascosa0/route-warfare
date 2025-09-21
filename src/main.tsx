import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/workers/service-worker";

// Register service worker for offline functionality
registerServiceWorker({
  onUpdate: (registration) => {
    console.log('New app version available. Please refresh to update.');
    // Could show a toast notification here
  },
  onSuccess: (registration) => {
    console.log('App is ready for offline use.');
  },
  onError: (error) => {
    console.error('Service worker registration failed:', error);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
