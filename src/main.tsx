import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const HelloWorld = () => {
  return (
    <div style={{ color: 'white', fontSize: '48px', textAlign: 'center', paddingTop: '20%' }}>
      Hello World
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelloWorld />
  </React.StrictMode>
);
