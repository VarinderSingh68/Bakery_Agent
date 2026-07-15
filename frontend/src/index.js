import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import axios from "axios";

// Set the base URL for all API requests.
// On Render, REACT_APP_BACKEND_URL must be set in the environment variables.
// e.g., https://your-backend-service-name.onrender.com
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
