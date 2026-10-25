
import "./App.css";
import { useState } from "react";

import Home from "./pages/Home";
import ReportGarbage from "./pages/ReportGarbage";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div>
      <nav>
        <button onClick={() => setPage("home")}>
          Home
        </button>

        <button onClick={() => setPage("report")}>
          Report Garbage
        </button>


        <button onClick={() => setPage("admin")}>
          Admin Dashboard
        </button>
      </nav>

      {page === "home" && (
        <Home setPage={setPage} />
      )}

      {page === "report" && (
        <ReportGarbage />
      )}

      {page === "result" && (
        <Result />
      )}

      {page === "admin" && (
        <AdminDashboard />
      )}
    </div>
  );
}

export default App;
