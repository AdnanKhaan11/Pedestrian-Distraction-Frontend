import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Violators from "./pages/Violators/Violators";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Detection from "./pages/Detection/Detection";
import "./index.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/violators" element={<Violators />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/detection" element={<Detection />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
