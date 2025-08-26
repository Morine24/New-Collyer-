import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore'; 
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
  const [projects, setProjects] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [requisitions, setRequisitions] = useState([]);

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

  // Fetch projects from Firestore
  useEffect(() => {
    const db = getFirestore(app);
    const fetchProjects = async () => {
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
    };

    fetchProjects();
  }, []);

  // Fetch requisitions from Firestore
  useEffect(() => {
    const db = getFirestore(app);
    const fetchRequisitions = async () => {
      const requisitionsCollection = collection(db, 'requisitions');
      const requisitionSnapshot = await getDocs(requisitionsCollection);
      const requisitionList = requisitionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequisitions(requisitionList);
    };

    fetchRequisitions();
  }, []);

  const addProject = (project) => {
    setProjects([...projects, { ...project, id: `proj${projects.length + 1}` }]);
  };

  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const addRequisition = async (requisition) => {
    const db = getFirestore(app);
    try {
      const docRef = await addDoc(collection(db, 'requisitions'), { ...requisition, status: 'pending' });
      setRequisitions(prevRequisitions => [...prevRequisitions, { id: docRef.id, ...requisition, status: 'pending' }]);
      console.log("Requisition added with ID: ", docRef.id);
      return true; // Indicate success
    } catch (e) {
      console.error("Error adding requisition: ", e);
      alert("Failed to add requisition. Please try again.");
      return false; // Indicate failure
    }
  };

  const updateRequisitionStatus = async (id, newStatus) => {
    const db = getFirestore(app);
    try {
      const requisitionRef = doc(db, "requisitions", id);
      await updateDoc(requisitionRef, { status: newStatus });
      setRequisitions(prevRequisitions =>
        prevRequisitions.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        )
      );
      console.log("Requisition status updated in Firestore for ID: ", id);
    } catch (e) {
      console.error("Error updating requisition status: ", e);
      alert("Failed to update requisition status. Please try again.");
    }
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
          <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard projects={projects} currentUserData={currentUserData} requisitions={requisitions} addRequisition={addRequisition} /></ProtectedRoute>} />
          <Route path="/foreman-dashboard" element={<ProtectedRoute><ForemanDashboard currentUserData={currentUserData} /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;