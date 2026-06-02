import React from "react";
import { createRoot } from "react-dom/client";
import { ClientesProveedores } from "./ClientesProveedores.jsx";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClientesProveedores />
  </React.StrictMode>
);