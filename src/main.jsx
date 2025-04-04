import "bootstrap/dist/css/bootstrap.min.css"
import React from "react";

import ReactDOM from "react-dom/client";
import App from "./App";
import  "./index.css";
import { AuthProvider } from "./context/AuthContext";

 // or any global CSS

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

