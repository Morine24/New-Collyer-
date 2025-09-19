import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaBell, FaBox, FaClipboardList, FaDollarSign, FaDownload, FaHome, FaChartLine, FaBars, FaSearch, FaUsers, FaProjectDiagram, FaSignOutAlt } from 'react-icons/fa';
import SearchBar from './SearchBar';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';

export default function CleanAdminDashboard({ currentUserData, requisitions, updateRequisitionStatus }) {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [laborCosts, setLaborCosts] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Open by default on tablet/desktop (>=768px), closed on smaller
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [reportType, setReportType] = useState('stock');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    budget: '',
    startDate: '',
    expectedCompletionDate: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isAddUserFormVisible, setIsAddUserFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isAddProjectFormVisible, setIsAddProjectFormVisible] = useState(false);
  const [newLaborData, setNewLaborData] = useState({
    projectName: '',
    description: '',
    amount: '',
    dateIncurred: '',
  });
  const [isAddLaborFormVisible, setIsAddLaborFormVisible] = useState(false);
  // Removed selectedProjectForAnalysis state (unused after removing cost analysis block)
  const [showProjectDetailsFor, setShowProjectDetailsFor] = useState(null);
  const [attendanceReports, setAttendanceReports] = useState([]);
  

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  // New useEffect to fetch stocks from Firestore
  useEffect(() => {
    const fetchStocks = async () => {
      const stockCollection = collection(db, 'stockItems'); // New collection for stocks
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);
    };

    fetchStocks();
  }, []);

  // New useEffect to fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
    };

    fetchProjects();
  }, []);

  // New useEffect to fetch labor costs from Firestore
  useEffect(() => {
    const fetchLaborCosts = async () => {
      const laborCostsCollection = collection(db, 'laborCosts');
      const laborSnapshot = await getDocs(laborCostsCollection);
      const laborList = laborSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLaborCosts(laborList);
    };

    fetchLaborCosts();
  }, []);

  useEffect(() => {
    const fetchAttendanceReports = async () => {
      const reportsCollection = collection(db, 'attendanceReports');
      const reportSnapshot = await getDocs(reportsCollection);
      const reportList = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceReports(reportList);
    };

    fetchAttendanceReports();
  }, []);

  

  // Filter requisitions based on search query
  useEffect(() => {
    const search = searchQuery.toLowerCase();

    const filteredReqs = requisitions.filter(req => {
      const item = req.item ? req.item.toLowerCase() : '';
      const status = req.status ? req.status.toLowerCase() : '';
      const project = req.project ? req.project.toLowerCase() : '';
      return item.includes(search) || status.includes(search) || project.includes(search);
    });
    setFilteredRequisitions(filteredReqs);

    const filteredUsrs = users.filter(user => {
      const name = user.name ? user.name.toLowerCase() : '';
      const email = user.email ? user.email.toLowerCase() : '';
      const role = user.role ? user.role.toLowerCase() : '';
      return name.includes(search) || email.includes(search) || role.includes(search);
    });
    setFilteredUsers(filteredUsrs);

    const filteredStks = stocks.filter(stock => {
      const name = stock.name ? stock.name.toLowerCase() : '';
      const supplier = stock.supplier ? stock.supplier.toLowerCase() : '';
      const project = stock.project ? stock.project.toLowerCase() : '';
      return name.includes(search) || supplier.includes(search) || project.includes(search);
    });
    setFilteredStocks(filteredStks);

    const filteredProjs = projects.filter(project => {
      const name = project.name ? project.name.toLowerCase() : '';
      const status = project.status ? project.status.toLowerCase() : '';
      return name.includes(search) || status.includes(search);
    });
    setFilteredProjects(filteredProjs);

  }, [searchQuery, requisitions, users, stocks, projects]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 768;
      if (!isSmall && !isSidebarOpen) {
        setIsSidebarOpen(true); // ensure open again when returning to wider layout
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Calculate requisition costs for a project
  // Calculate stock costs for a project (from stockItems added directly)
  const calculateStockCosts = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    return project ? (project.stockCostsSpent || 0) : 0;
  };

  // Calculate labor costs for a project
  const calculateLaborCosts = (projectName) => {
    return laborCosts
      .filter(lc => lc.projectName === projectName)
      .reduce((total, lc) => total + lc.amount, 0);
  };

  // Calculate total project cost (stock costs + labor costs)
  const calculateProjectCost = (projectName) => {
    return calculateStockCosts(projectName) + calculateLaborCosts(projectName);
  };

  // Removed unused calculateTotalStockValue to satisfy linter

  const getProjectProgress = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    const spent = calculateProjectCost(projectName);
    return project ? (spent / project.budget) * 100 : 0;
  };

  // Handler for updating requisition status
  const handleUpdateStatus = async (id, newStatus) => {
    updateRequisitionStatus(id, newStatus);
  };

  // Handler for fulfilling a requisition and updating stock
  // Removed unused handleFulfillRequisition (not referenced in UI)

  const handleNewProjectChange = (e) => {
    setNewProjectData({
      ...newProjectData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewProject = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), { ...newProjectData, status: 'pending', stockCostsSpent: 0 }); // Initialize stockCostsSpent
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
      setNewProjectData({ name: '', budget: '', startDate: '', expectedCompletionDate: '' });
      setIsAddProjectFormVisible(false);
    } catch (error) {
      console.error("Error adding new project:", error);
      alert("Failed to add new project.");
    }
  };

  const handleNewLaborChange = (e) => {
    setNewLaborData({
      ...newLaborData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewLabor = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'laborCosts'), { ...newLaborData, amount: parseFloat(newLaborData.amount) });
      // Re-fetch labor costs to update the UI
      const laborCostsCollection = collection(db, 'laborCosts');
      const laborSnapshot = await getDocs(laborCostsCollection);
      const laborList = laborSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLaborCosts(laborList);
      setNewLaborData({ projectName: '', description: '', amount: '', dateIncurred: '' });
      setIsAddLaborFormVisible(false);
    } catch (error) {
      console.error("Error adding new labor cost:", error);
      alert("Failed to add new labor cost.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project.");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "projects", editingProject.id), {
        name: editingProject.name,
        budget: editingProject.budget,
        startDate: editingProject.startDate,
        expectedCompletionDate: editingProject.expectedCompletionDate,
        status: editingProject.status,
      });
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
      setEditingProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  const handleAddNewUser = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const role = e.target.role.value;
    const password = 'password'; // Default password

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role,
        mustChangePassword: true, // Set mustChangePassword in Firestore
      });

      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      e.target.reset();
      setIsAddUserFormVisible(false);
    } catch (error) {
      console.error("Error creating new user:", error);
      alert("Failed to create new user. Please check the email and try again.");
    }
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleLogout = () => {
    console.log('User logged out');
    navigate('/');
  };

  // Generate report data
  const generateReportData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let dateFilter;
    if (reportPeriod === 'daily') {
      dateFilter = (date) => new Date(date) >= today;
    } else if (reportPeriod === 'weekly') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = (date) => new Date(date) >= weekAgo;
    } else { // monthly
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = (date) => new Date(date) >= monthAgo;
    }

    if (reportType === 'stock') {
      return {
        title: `Stock Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: stocks.map(stock => ({
          ...stock,
          totalValue: stock.quantity * stock.unitCost,
          lowStock: stock.quantity < 20
        }))
      };
    } else if (reportType === 'requisitions') {
      const filteredReqs = requisitions.filter(req => dateFilter(req.requestDate));
      return {
        title: `Requisitions Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: filteredReqs,
        summary: {
          total: filteredReqs.length,
          pending: filteredReqs.filter(r => r.status === 'pending').length,
          approved: filteredReqs.filter(r => r.status === 'approved').length,
          fulfilled: filteredReqs.filter(r => r.status === 'fulfilled').length,
          totalCost: filteredReqs.reduce((sum, r) => sum + (r.quantity * r.unitCost), 0)
        }
      };
    } else if (reportType === 'attendance') {
      return {
        title: `Attendance Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: attendanceReports
      };
    } else { // projects
      return {
        title: `Projects Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: projects.map(project => ({
          ...project,
          spent: calculateProjectCost(project.name),
          progress: getProjectProgress(project.name),
          remaining: project.budget - calculateProjectCost(project.name)
        }))
      };
    }
  };

  const downloadReport = () => {
    const reportData = generateReportData();
    const csvContent = "data:text/csv;charset=utf-8," +
      Object.keys(reportData.data[0] || {}).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDashboard = () => {
    return (
      <div className="dashboard-content">
        <div className="summary-cards">
          {projects.map(project => (
            <div className="summary-card clickable" key={project.id} onClick={() => setShowProjectDetailsFor(showProjectDetailsFor === project.id ? null : project.id)}>
              <div className="card-header">
                <h3>{project.name}</h3>
              </div>
              <div className="pie-chart-container">
                <div className="pie-chart" style={{ background: `conic-gradient(#4caf50 ${project.budget > 0 ? Math.min(100, (calculateProjectCost(project.name) / project.budget) * 100) : 0}%, #e0e0e0 0)` }}>
                  <span className="pie-chart-label">{getProjectProgress(project.name).toFixed(0)}%</span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
                  <span>Spent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#e0e0e0' }}></div>
                  <span>Remaining</span>
                </div>
              </div>
              <div className="project-metrics">
                <div className="metric">
                  <span className="metric-label">Budget:</span>
                  <span className="metric-value">Ksh{project.budget.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Spent:</span>
                  <span className="metric-value">Ksh{calculateProjectCost(project.name).toLocaleString()}</span>
                </div>
              </div>
              {showProjectDetailsFor === project.id && (
                <div className="project-details">
                  <div className="metric">
                    <span className="metric-label">Stock Cost:</span>
                    <span className="metric-value">Ksh{calculateStockCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Labor Cost:</span>
                    <span className="metric-value">Ksh{calculateLaborCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Remaining:</span>
                    <span className="metric-value">Ksh{(project.budget - calculateProjectCost(project.name)).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  

  const renderProjectManagement = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>Project Management</h3>
          <button className="btn btn-primary" onClick={() => setIsAddProjectFormVisible(true)}>Add Project</button>
          <button className="btn btn-primary" onClick={() => setIsAddLaborFormVisible(true)}>Add Labor Cost</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Budget</th>
                <th>Start Date</th>
                <th>Expected Date of Completion</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id}>
                  <td className="clickable">{project.name}</td>
                  <td>Ksh{project.budget.toLocaleString()}</td>
                  <td>{project.startDate}</td>
                  <td>{project.expectedCompletionDate}</td>
                  <td>
                    <span className={`status-badge status-${project.status}`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingProject(project)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

  {/* Removed renderCostAnalysis as it was referenced but not defined */}

      {isAddProjectFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New Project</h3>
            <form onSubmit={handleAddNewProject} className="form-grid">
              <input type="text" name="name" placeholder="Project Name" value={newProjectData.name} onChange={handleNewProjectChange} required />
              <input type="number" name="budget" placeholder="Budget" step="0.01" value={newProjectData.budget} onChange={handleNewProjectChange} required />
              <input type="date" name="startDate" placeholder="Start Date" value={newProjectData.startDate} onChange={handleNewProjectChange} required />
              <input type="date" name="expectedCompletionDate" placeholder="Expected Completion Date" value={newProjectData.expectedCompletionDate} onChange={handleNewProjectChange} required />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Project</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddProjectFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddLaborFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New Labor Cost</h3>
            <form onSubmit={handleAddNewLabor} className="form-grid">
              <select name="projectName" value={newLaborData.projectName} onChange={handleNewLaborChange} required>
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
              <input type="text" name="description" placeholder="Description" value={newLaborData.description} onChange={handleNewLaborChange} required />
              <input type="number" name="amount" placeholder="Amount" step="0.01" value={newLaborData.amount} onChange={handleNewLaborChange} required />
              <input type="date" name="dateIncurred" placeholder="Date Incurred" value={newLaborData.dateIncurred} onChange={handleNewLaborChange} required />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Labor Cost</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddLaborFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Edit Project</h3>
            <form onSubmit={handleUpdateProject} className="form-grid">
              <input type="text" name="name" placeholder="Project Name" value={editingProject.name} onChange={(e) => setEditingProject({...editingProject, name: e.target.value})} required />
              <input type="number" name="budget" placeholder="Budget" step="0.01" value={editingProject.budget} onChange={(e) => setEditingProject({...editingProject, budget: e.target.value})} required />
              <input type="date" name="startDate" placeholder="Start Date" value={editingProject.startDate} onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})} required />
              <input type="date" name="expectedCompletionDate" placeholder="Expected Completion Date" value={editingProject.expectedCompletionDate} onChange={(e) => setEditingProject({...editingProject, expectedCompletionDate: e.target.value})} required />
              <select name="status" value={editingProject.status} onChange={(e) => setEditingProject({...editingProject, status: e.target.value})} required>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update Project</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProject(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  

  const renderUsers = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>User Management</h3>
          <button className="btn btn-primary" onClick={() => setIsAddUserFormVisible(true)}>Add User</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddUserFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New User</h3>
            <form onSubmit={handleAddNewUser} className="form-grid">
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="email" name="email" placeholder="Email Address" required />
              <select name="role" required>
                <option value="">Select Role</option>
                <option value="Manager">Manager</option>
                <option value="Stock Clerk">Stock Clerk</option>
                <option value="Foreman">Foreman</option>
                <option value="Gate Officer">Gate Officer</option>
                <option value="Regular Staff">Regular Staff</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Edit User</h3>
            <form onSubmit={handleUpdateUser} className="form-grid">
              <input type="text" name="name" placeholder="Full Name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} required />
              <input type="email" name="email" placeholder="Email Address" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} required />
              <select name="role" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} required>
                <option value="Manager">Manager</option>
                <option value="Stock Clerk">Stock Clerk</option>
                <option value="Foreman">Foreman</option>
                <option value="Gate Officer">Gate Officer</option>
                <option value="Regular Staff">Regular Staff</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => {
    const reportData = generateReportData();
    
    return (
      <div className="section-content">
        <div className="reports-controls">
          <div className="control-group">
            <label>Report Type:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="stock">Stock Report</option>
              <option value="requisitions">Requisitions Report</option>
              <option value="projects">Projects Report</option>
              <option value="attendance">Attendance Report</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Period:</label>
            <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <button className="btn btn-primary" onClick={downloadReport}>
            <FaDownload /> <span>Download CSV</span>
          </button>
        </div>

        <div className="card report-card">
          <h3>{reportData.title}</h3>
          
          {reportType === 'stock' && (
            <div className="report-content">
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total Items:</span>
                  <span className="stat-value">{reportData.data.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Value:</span>
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Low Stock Items:</span>
                  <span className="stat-value">{reportData.data.filter(item => item.lowStock).length}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Cost</th>
                      <th>Total Value</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>Ksh{item.unitCost}</td>
                        <td>Ksh{item.totalValue.toLocaleString()}</td>
                        <td>{item.supplier}</td>
                        <td>
                          {item.lowStock ?
                            <span className="status-badge status-warning">Low Stock</span> :
                            <span className="status-badge status-normal">Normal</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'requisitions' && reportData.summary && (
            <div className="report-content">
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total Requisitions:</span>
                  <span className="stat-value">{reportData.summary.total}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Pending:</span>
                  <span className="stat-value">{reportData.summary.pending}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Fulfilled:</span>
                  <span className="stat-value">{reportData.summary.fulfilled}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Cost:</span>
                  <span className="stat-value">Ksh{reportData.summary.totalCost.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Project</th>
                      <th>Cost</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map(req => (
                      <tr key={req.id}>
                        <td>{req.item}</td>
                        <td>{req.quantity}</td>
                        <td>{req.project}</td>
                        <td>Ksh{(req.quantity * req.unitCost).toLocaleString()}</td>
                        <td>{req.requestDate}</td>
                        <td>
                          <span className={`status-badge status-${req.status}`}>
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {reportType === 'projects' && (
            <div className="report-content">
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total Projects:</span>
                  <span className="stat-value">{reportData.data.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Active Projects:</span>
                  <span className="stat-value">{reportData.data.filter(p => p.status === 'active').length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Budget:</span>
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Spent:</span>
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Spent</th>
                      <th>Remaining</th>
                      <th>Progress</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.data.map(project => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td>Ksh{project.budget.toLocaleString()}</td>
                        <td>Ksh{project.spent.toLocaleString()}</td>
                        <td>Ksh{project.remaining.toLocaleString()}</td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(project.progress, 100)}%` }}></div>
                          </div>
                          <span>{project.progress.toFixed(1)}%</span>
                        </td>
                        <td>
                          <span className={`status-badge status-${project.status}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'attendance' && (
            <div className="report-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Type</th>
                      <th>Uploaded At</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReports.map(report => (
                      <tr key={report.id}>
                        <td>{report.name}</td>
                        <td>{report.type}</td>
                        <td>{report.uploadedAt ? new Date(report.uploadedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                        <td>
                          <a href={report.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                            <FaDownload /> Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRequisitions = () => (
    <div className="section-content">
      <div className="card">
        <h3>All Requisitions</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester Name</th>
                <th>Items</th>
                <th>Quantity</th>
                <th>Project Name</th>
                <th>Category</th>
                <th>Item</th>
                <th>Reason for Request</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map(req => (
                <tr key={req.id}>
                  <td>{req.name}</td>
                  <td>{req.items}</td>
                  <td>{req.quantity}</td>
                  <td>{req.projectName}</td>
                  <td>{req.category}</td>
                  <td>{req.items}</td>
                  <td>{req.reasonForRequest}</td>
                  <td>{req.date}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' && (
                      <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                        className="form-grid-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    const newItem = {
      name: e.target.name.value,
      quantity: parseInt(e.target.quantity.value, 10),
      unitCost: parseFloat(e.target.unitCost.value),
      supplier: e.target.supplier.value,
      project: e.target.project.value,
    };

    try {
      // Add new stock item to Firestore
      await addDoc(collection(db, 'stockItems'), newItem);
      e.target.reset();

      // Calculate the cost of the new stock item
      const itemCost = newItem.quantity * newItem.unitCost;

      // Find the associated project
      const projectToUpdate = projects.find(p => p.name === newItem.project);

      if (projectToUpdate) {
        // Add the cost to the project's stockCostsSpent
        const newStockCostsSpent = (projectToUpdate.stockCostsSpent || 0) + itemCost;

        // Update the project's stockCostsSpent in Firestore
        const projectRef = doc(db, "projects", projectToUpdate.id);
        await updateDoc(projectRef, { stockCostsSpent: newStockCostsSpent });

        // Update the local projects state
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === projectToUpdate.id ? { ...p, stockCostsSpent: newStockCostsSpent } : p
          )
        );
        console.log(`Added ${itemCost} to stock costs for project ${projectToUpdate.name}. New stock costs spent: ${newStockCostsSpent}`);
      } else {
        console.warn(`Project "${newItem.project}" not found for stock cost tracking.`);
      }

      // Re-fetch stocks to update the UI
      const stockCollection = collection(db, 'stockItems');
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);

    } catch (error) {
      console.error("Error adding new stock item or updating project stock costs:", error);
      alert("Failed to add new stock item or update project stock costs.");
    }
  };

  const renderStockManagement = () => (
    <div className="section-content">
      <div className="card">
        <h3>Stock Inventory</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Remaining Units</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Project Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => (
                <tr key={stock.id}>
                  <td>{stock.name}</td>
                  <td>{stock.quantity}</td>
                  <td>Ksh{stock.unitCost}</td>
                  <td>Ksh{(stock.quantity * stock.unitCost).toLocaleString()}</td>
                  <td>{stock.supplier}</td>
                  <td>{stock.project}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Add New Item</h3>
        </div>
        <form onSubmit={handleAddNewItem} className="form-grid">
          <input type="text" name="name" placeholder="Item Name" required />
          <input type="number" name="quantity" placeholder="Quantity" required />
          <input type="number" name="unitCost" placeholder="Unit Cost" step="0.01" required />
          <input type="text" name="supplier" placeholder="Supplier" required />
          <select name="project" required>
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>{project.name}</option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
            {isSidebarOpen && <h1>Admin</h1>}
          </div>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars />
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#" className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
                <FaHome className="nav-icon" />
                {isSidebarOpen && 'Dashboard'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>
                <FaProjectDiagram className="nav-icon" />
                {isSidebarOpen && 'Projects'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'requisitions' ? 'active' : ''} onClick={() => setActiveSection('requisitions')}>
                <FaClipboardList className="nav-icon" />
                {isSidebarOpen && 'Requisitions'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'stock' ? 'active' : ''} onClick={() => setActiveSection('stock')}>
                <FaBox className="nav-icon" />
                {isSidebarOpen && 'Stock'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
                <FaUsers className="nav-icon" />
                {isSidebarOpen && 'Users'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'reports' ? 'active' : ''} onClick={() => setActiveSection('reports')}>
                <FaChartLine className="nav-icon" />
                {isSidebarOpen && 'Reports'}
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            {isSidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
          <div className="header-actions">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="user-profile">
              <img src={logo} alt="User" />
              <span>{currentUserData?.name}</span>
            </div>
          </div>
        </header>
        <div className="content-wrapper">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'projects' && renderProjectManagement()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'requisitions' && renderRequisitions()}
          {activeSection === 'stock' && renderStockManagement()}
        </div>
      </main>
    </div>
  );
}