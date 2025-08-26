import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from './firebase';

import Login from './Login';
import Register from './Register';
import AdminDashboard from './AdminDashboard';
import StockClerkDashboard from './StockClerkDashboard';
import UserDashboard from './UserDashboard';
import ForemanDashboard from './ForemanDashboard';
import ChangePassword from './ChangePassword';
import ProtectedRoute from './ProtectedRoute';
import './App.css';

const mockRequisitions = [
  { id: 'req1', name: 'John Doe', items: 'Cement', quantity: 20, status: 'approved', projectName: 'Building A', category: 'Construction', reasonForRequest: 'New construction phase', date: '2025-08-15', unitCost: 50 },
  { id: 'req2', name: 'Jane Smith', items: 'Bricks', quantity: 200, status: 'approved', projectName: 'Building B', category: 'Construction', reasonForRequest: 'Wall repair', date: '2025-08-14', unitCost: 2 },
  { id: 'req3', name: 'John Doe', items: 'Steel Rods', quantity: 10, status: 'pending', projectName: 'Building A', category: 'Construction', reasonForRequest: 'Foundation work', date: '2025-08-13', unitCost: 120 },
  { id: 'req4', name: 'Jane Smith', items: 'Paint', quantity: 5, status: 'approved', projectName: 'Building C', category: 'Finishing', reasonForRequest: 'Interior painting', date: '2025-08-16', unitCost: 25 },
  { id: 'req5', name: 'Peter Jones', items: 'Tiles', quantity: 50, status: 'pending', projectName: 'Building B', category: 'Finishing', reasonForRequest: 'Bathroom renovation', date: '2025-08-12', unitCost: 15 }
];

function App() {
  const [projects, setProjects] = useState([
    { id: 'proj1', name: 'Building A', budget: 50000, startDate: '2025-08-01', expectedCompletionDate: '2026-02-01', status: 'active' },
    { id: 'proj2', name: 'Building B', budget: 75000, startDate: '2025-08-05', expectedCompletionDate: '2026-08-05', status: 'active' },
    { id: 'proj3', name: 'Building C', budget: 30000, startDate: '2025-08-10', expectedCompletionDate: '2025-12-10', status: 'pending' }
  ]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [requisitions, setRequisitions] = useState(mockRequisitions);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUserData(userDocSnap.data());
        } else {
          setCurrentUserData(null);
        }
      } else {
        setCurrentUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const addProject = (project) => {
    setProjects([...projects, { ...project, id: `proj${projects.length + 1}` }]);
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const addRequisition = (requisition) => {
    setRequisitions([...requisitions, { ...requisition, id: `req${requisitions.length + 1}` }]);
  };

  const updateRequisitionStatus = (id, newStatus) => {
    setRequisitions(prevRequisitions =>
      prevRequisitions.map(req =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    );
  };

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard projects={projects} addProject={addProject} deleteProject={deleteProject} currentUserData={currentUserData} requisitions={requisitions} updateRequisitionStatus={updateRequisitionStatus} /></ProtectedRoute>} />
          <Route path="/stock-clerk" element={<ProtectedRoute><StockClerkDashboard currentUserData={currentUserData} /></ProtectedRoute>} />
          <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard projects={projects.map(p => p.name)} currentUserData={currentUserData} requisitions={requisitions} addRequisition={addRequisition} /></ProtectedRoute>} />
          <Route path="/foreman-dashboard" element={<ProtectedRoute><ForemanDashboard currentUserData={currentUserData} /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;