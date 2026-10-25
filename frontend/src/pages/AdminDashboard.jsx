import React from "react";
import "./Admin.css";

const reports = [
  {
    id: 1,
    location: "Semenjeri",
    type: "Illegal Dumping",
    date: "07 Oct 2026",
    status: "Pending",
  },
  {
    id: 2,
    location: "Thousand Lights",
    type: "Garbage Overflow",
    date: "06 Oct 2026",
    status: "Resolved",
  },
  {
    id: 3,
    location: "Velachery",
    type: "Roadside Waste",
    date: "05 Oct 2026",
    status: "In Progress",
  },
];

function Admin() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage and monitor garbage reports</p>
        </div>

        <button className="logout-btn">Logout</button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <p>128</p>
        </div>

        <div className="stat-card pending">
          <h3>Pending</h3>
          <p>32</p>
        </div>

        <div className="stat-card progress">
          <h3>In Progress</h3>
          <p>41</p>
        </div>

        <div className="stat-card resolved">
          <h3>Resolved</h3>
          <p>55</p>
        </div>
      </div>

      <div className="reports-section">
        <h2>Recent Reports</h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Location</th>
                <th>Report Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>#{report.id}</td>
                  <td>{report.location}</td>
                  <td>{report.type}</td>
                  <td>{report.date}</td>

                  <td>
                    <span
                      className={`status ${report.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {report.status}
                    </span>
                  </td>

                  <td>
                    <button className="view-btn">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Admin;