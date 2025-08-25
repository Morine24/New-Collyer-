import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import StockClerkDashboard from './StockClerkDashboard';
import UserDashboard from './UserDashboard';
import ForemanDashboard from './ForemanDashboard';
import ChangePassword from './ChangePassword';
import './App.css';

function App() {
  const [projects, setProjects] = useState([
    { id: 'proj1', name: 'Building A', budget: 50000, startDate: '2025-08-01', expectedCompletionDate: '2026-02-01', status: 'active' },
    { id: 'proj2', name: 'Building B', budget: 75000, startDate: '2025-08-05', expectedCompletionDate: '2026-08-05', status: 'active' },
    { id: 'proj3', name: 'Building C', budget: 30000, startDate: '2025-08-10', expectedCompletionDate: '2025-12-10', status: 'pending' }
  ]);

  const addProject = (project) => {
    setProjects([...projects, { ...project, id: `proj${projects.length + 1}` }]);
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/admin" element={<AdminDashboard projects={projects} addProject={addProject} deleteProject={deleteProject} />} />
          <Route path="/stock-clerk" element={<StockClerkDashboard />} />
          <Route path="/user-dashboard" element={<UserDashboard projects={projects.map(p => p.name)} />} />
          <Route path="/foreman-dashboard" element={<ForemanDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;