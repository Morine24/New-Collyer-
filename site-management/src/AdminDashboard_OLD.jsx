
import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaBell, FaBox, FaClipboardList, FaDollarSign, FaDownload, FaHome, FaChartLine, FaBars, FaSearch, FaUsers, FaProjectDiagram, FaSignOutAlt } from 'react-icons/fa';
import SearchBar from './SearchBar';
import logo from './assets/logo.jpeg';







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
  const [selectedNotification, setSelectedNotification] = useState(null);

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
              <h3>{project.name}</h3>
              <div className="pie-chart-container">
                <div className="pie-chart" style={{ background: `conic-gradient(#4caf50 ${project.budget > 0 ? Math.min(100, (calculateProjectCost(project.name) / project.budget) * 100) : 0}%, #f44336 0)` }}></div>
                <div className="legend">
                  <div><span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span> Spent</div>
                  <div><span className="legend-color" style={{ backgroundColor: '#f44336' }}></span> Remaining</div>
                </div>
              </div>
              {showProjectDetailsFor === project.id && (
                <div className="project-metrics">
                  <div className="metric">
                    <span className="metric-label">Budget:</span>
                    <span className="metric-value">Ksh{project.budget.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Stock Cost:</span>
                    <span className="metric-value">Ksh{calculateStockCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Labor Cost:</span>
                    <span className="metric-value">Ksh{calculateLaborCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Total Spent:</span>
                    <span className="metric-value">Ksh{calculateProjectCost(project.name).toLocaleString()}</span>
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

      {isAddProjectFormVisible && !editingProject && (
        <div className="card">
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
      )}

      {isAddLaborFormVisible && (
        <div className="card">
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
      )}

      {editingProject && (
        <div className="card">
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

      {isAddUserFormVisible && !editingUser && (
        <div className="card">
          <h3>Add New User</h3>
          <form onSubmit={handleAddNewUser} className="form-grid">
            <input type="text" name="name" placeholder="Full Name" required />
            <input type="email" name="email" placeholder="Email Address" required />
            <select name="role" required>
              <option value="">Select Role</option>
              <option value="Manager">Manager</option>
              <option value="Stock Clerk">Stock Clerk</option>
              <option value="Foreman">Foreman</option>
              <option value="Regular Staff">Regular Staff</option>
            </select>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Add User</button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserFormVisible(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="card">
          <h3>Edit User</h3>
          <form onSubmit={handleUpdateUser} className="form-grid">
            <input type="text" name="name" placeholder="Full Name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} required />
            <input type="email" name="email" placeholder="Email Address" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} required />
            <select name="role" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} required>
              <option value="Manager">Manager</option>
              <option value="Stock Clerk">Stock Clerk</option>
              <option value="Foreman">Foreman</option>
              <option value="Regular Staff">Regular Staff</option>
            </select>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Update User</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </form>
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
            <FaDownload /> Download CSV
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
        <h3>Add New Item</h3>
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

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'stock':
        return renderStockManagement();
      case 'requisitions':
        return renderRequisitions();
      case 'projects':
        return renderProjectManagement();
      case 'users':
        return renderUsers();
      case 'reports':
        return renderReports();
      case 'notifications':
        return renderNotifications();
      default:
        return renderDashboard();
    }
  };

  const renderNotifications = () => {
    if (selectedNotification) {
      return renderNotificationDetails(selectedNotification);
    }

    return (
      <div className="section-content">
        <h3>Notifications</h3>
        <div className="summary-cards">
          <div className="summary-card clickable" onClick={() => setSelectedNotification('low-stock')}>
            <div className="summary-icon"><FaBox /></div>
            <div className="summary-content">
              <h4>Low Stock</h4>
              <p className="summary-value">{stocks.filter(stock => stock.quantity < 20).length}</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedNotification('pending-requisitions')}>
            <div className="summary-icon"><FaClipboardList /></div>
            <div className="summary-content">
              <h4>Pending Requisitions</h4>
              <p className="summary-value">{requisitions.filter(req => req.status === 'pending').length}</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedNotification('overdue-approvals')}>
            <div className="summary-icon"><FaBell /></div>
            <div className="summary-content">
              <h4>Overdue Approvals</h4>
              <p className="summary-value">1</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedNotification('urgent-requisitions')}>
            <div className="summary-icon"><FaBell /></div>
            <div className="summary-content">
              <h4>Urgent Requisitions</h4>
              <p className="summary-value">1</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedNotification('pending-tasks')}>
            <div className="summary-icon"><FaBell /></div>
            <div className="summary-content">
              <h4>Pending Tasks</h4>
              <p className="summary-value">1</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationDetails = (notificationType) => {
    let title = '';
    let data = [];
    let columns = [];
    let columnMapping = {};

    switch (notificationType) {
      case 'low-stock':
        title = 'Low Stock Items';
        columns = ['Item', 'Quantity', 'Supplier'];
        columnMapping = { 'Item': 'name', 'Quantity': 'quantity', 'Supplier': 'supplier' };
        data = stocks.filter(stock => stock.quantity < 20);
        break;
      case 'pending-requisitions':
        title = 'Pending Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'item', 'Quantity': 'quantity', 'Project': 'project', 'Date': 'requestDate' };
        data = requisitions.filter(req => req.status === 'pending');
        break;
      case 'overdue-approvals':
        title = 'Overdue Approvals';
        columns = ['Item', 'Project', 'Date'];
        columnMapping = { 'Item': 'item', 'Project': 'project', 'Date': 'date' };
        data = [{ item: 'Approval for XX', project: 'Project Y', date: '2025-08-10' }];
        break;
      case 'urgent-requisitions':
        title = 'Urgent Requisitions';
        columns = ['Item', 'Project', 'Date'];
        columnMapping = { 'Item': 'item', 'Project': 'project', 'Date': 'date' };
        data = [{ item: 'Urgent requisition for YY', project: 'Project Z', date: '2025-08-15' }];
        break;
      case 'pending-tasks':
        title = 'Pending Tasks';
        columns = ['Task', 'Due Date'];
        columnMapping = { 'Task': 'task', 'Due Date': 'dueDate' };
        data = [{ task: 'Pending task: ZZ', dueDate: '2025-08-20' }];
        break;
      default:
        break;
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
          <button className="btn btn-danger" onClick={() => setSelectedNotification(null)}>Close</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {columns.map(col => <td key={col}>{item[columnMapping[col]]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <style jsx>{`
        /* ===== MODERN DASHBOARD TEMPLATE ===== */
        
        /* Reset and Base Styles */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body, #root {
          height: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: #f8fafc;
        }

        /* Layout Container */
        .dashboard-container {
          display: flex;
          height: 100vh;
          width: 100%;
          background: #f8fafc;
          overflow: hidden;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: #f1f5f9;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          position: relative;
        }

        .sidebar.closed {
          transform: translateX(-100%);
        }

        /* Hide native scrollbar while retaining scroll functionality */
        .sidebar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
        }
        .sidebar::-webkit-scrollbar { /* WebKit */
          width: 0;
          height: 0;
        }

        .sidebar-collapsed {
          width: 60px;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background-color: #1a237e;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
        }

        .sidebar-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 1.2rem;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
        }

        .sidebar-nav li {
          padding: 15px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 1.1rem;
          transition: background-color 0.2s ease, color 0.2s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-nav li:hover,
        .sidebar-nav li.active {
          background-color: #2c387e;
          color: #ffeb3b; /* Yellow accent for active/hover */
        }

        .sidebar-nav li svg {
          font-size: 1.2rem;
          min-width: 24px;
        }

        .sidebar-collapsed .sidebar-header h2,
        .sidebar-collapsed .sidebar-nav span {
          display: none;
        }

        /* Main Content Area */
        .main-content {
          margin-left: 250px;
          flex-grow: 1;
          padding: 20px;
          transition: margin-left 0.3s ease;
          height: 100vh; /* fill viewport */
          overflow: auto; /* internal scroll only */
          -ms-overflow-style: none; /* IE / Edge */
          scrollbar-width: none; /* Firefox */
        }
        .main-content::-webkit-scrollbar { display: none; }

        .sidebar-collapsed + .main-content {
          margin-left: 60px;
        }

        /* Header */
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          margin-bottom: 20px;
          gap: 15px; /* Add spacing between elements */
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .menu-btn {
          background: #1a237e;
          color: #fff;
          border: none;
          padding: 12px 15px;
          font-size: 1.3rem;
          cursor: pointer;
          border-radius: 8px;
          display: flex; /* Always visible when controlled by React state */
          align-items: center;
          justify-content: center;
          min-width: 48px;
          min-height: 48px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(26, 35, 126, 0.3);
          position: relative;
          z-index: 1000;
        }

        /* Add visual emphasis when sidebar is closed */
        .sidebar.closed ~ .main-content .menu-btn {
          background: #1565c0;
          box-shadow: 0 3px 10px rgba(21, 101, 192, 0.4);
          border: 2px solid #e3f2fd;
        }

        .menu-btn:hover {
          background: #283593;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 35, 126, 0.4);
        }

        .menu-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(26, 35, 126, 0.3);
        }

        /* Responsive Breakpoints */
        /* Tablet and Small Desktop */
        @media (max-width: 1200px) {
          .main-content {
            padding: 15px;
          }
          
          .main-header {
            padding: 12px 15px;
          }
        }

        /* Mobile and Tablet Portrait */
        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
            box-shadow: 2px 0 10px rgba(0,0,0,0.3);
            z-index: 1001;
          }

          .sidebar:not(.closed) {
            transform: translateX(0);
          }

          .main-content {
            margin-left: 0 !important;
            padding: 10px;
          }

          .main-header {
            flex-direction: row;
            gap: 10px;
            padding: 10px 15px;
            margin-bottom: 15px;
          }
          
          .header-left {
            gap: 10px;
          }
          
          .menu-btn {
            min-width: 42px;
            min-height: 42px;
            padding: 10px 12px;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .main-content {
            padding: 8px;
          }

          .main-header {
            padding: 8px 12px;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .header-left {
            gap: 8px;
          }
          
          .menu-btn {
            min-width: 40px;
            min-height: 40px;
            padding: 8px 10px;
            font-size: 1.1rem;
          }

          .sidebar-header {
            padding: 15px;
          }

          .sidebar-header h2 {
            font-size: 1.2rem;
          }

          .sidebar-nav li {
            padding: 12px 15px;
            font-size: 1rem;
          }
        }

        /* Small Mobile */
        @media (max-width: 480px) {
          .main-content {
            padding: 5px;
          }

          .main-header {
            padding: 5px 8px;
            margin-bottom: 10px;
          }

          .sidebar {
            width: 100vw;
            max-width: 280px;
          }

          .sidebar-header {
            padding: 12px;
          }

          .sidebar-nav li {
            padding: 10px 12px;
            font-size: 0.9rem;
          }
        }

          .search-bar {
            max-width: none; /* Allow search bar to take full width on small screens */
          }
        }

        .search-bar {
          display: flex;
          align-items: center;
          background-color: #f7f7f7;
          border-radius: 50px;
          padding: 8px 15px;
          width: 100%;
          max-width: 400px;
        }

        .search-bar input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 1rem;
          outline: none;
          margin-left: 10px;
        }

        .search-icon {
          color: #aaa;
        }

        .search-icon {
          color: #aaa;
        }

        /* Dashboard Content */
        .dashboard-content {
          padding: 20px 0;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background-color: #fff;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* Mobile card responsive adjustments */
        @media (max-width: 768px) {
          .summary-cards {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .summary-card {
            padding: 20px;
            gap: 15px;
          }
        }

        @media (max-width: 480px) {
          .summary-cards {
            gap: 10px;
          }

          .summary-card {
            padding: 15px;
            gap: 10px;
          }
        }

        .summary-icon {
          background-color: #e3f2fd;
          color: #1a237e;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .summary-content h4 {
          margin: 0;
          color: #555;
          font-weight: 500;
        }

        .summary-value {
          margin: 5px 0 0;
          font-size: 2rem;
          font-weight: 600;
          color: #1a237e;
        }

        /* General Sections */
        .section-content {
          padding: 20px 0;
        }

        .card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          padding: 25px;
          margin-bottom: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #1a237e;
        }

        /* Buttons */
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          font-size: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background-color: #1a237e;
          color: #fff;
        }

        .btn-primary:hover {
          background-color: #2c387e;
        }

        .btn-secondary {
          background-color: #e0e0e0;
          color: #555;
        }

        .btn-secondary:hover {
          background-color: #d5d5d5;
        }

        .btn-danger {
          background-color: #e53935;
          color: #fff;
        }

        .btn-danger:hover {
          background-color: #d32f2f;
        }

        .btn-success {
          background-color: #43a047;
          color: #fff;
        }

        .btn-success:hover {
          background-color: #388e3c;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.875rem;
        }

        /* Tables */
        .table-container {
          overflow-x: auto;
          margin: 0 -5px; /* Compensate for mobile padding */
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px; /* Ensure table doesn't get too cramped */
        }

        .data-table th, .data-table td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
          white-space: nowrap;
        }

        .data-table th {
          background-color: #fafafa;
          font-weight: 600;
          color: #555;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table tbody tr:hover {
          background-color: #f5f5f5;
        }

        /* Mobile table adjustments */
        @media (max-width: 768px) {
          .data-table {
            min-width: 500px;
          }
          
          .data-table th, .data-table td {
            padding: 8px 6px;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .table-container {
            margin: 0 -8px;
          }
          
          .data-table {
            min-width: 400px;
          }
          
          .data-table th, .data-table td {
            padding: 6px 4px;
            font-size: 0.8rem;
          }
        }

        .clickable {
          cursor: pointer;
          color: #1a237e;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .clickable:hover {
          text-decoration: underline;
        }

        /* Status Badges */
        .status-badge {
          padding: 5px 12px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: capitalize;
        }

        .status-pending {
          background-color: #fff3e0;
          color: #ff9800;
        }

        .status-approved {
          background-color: #e8f5e9;
          color: #4caf50;
        }

        .status-fulfilled, .status-active {
          background-color: #e3f2fd;
          color: #2196f3;
        }

        .status-rejected {
          background-color: #ffebee;
          color: #e53935;
        }

        .status-pending {
          background-color: #fff3e0;
          color: #ff9800;
        }

        .status-warning {
          background-color: #fff3e0;
          color: #ff9800;
        }

        .status-normal {
          background-color: #e8f5e9;
          color: #4caf50;
        }

        /* Forms */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .form-grid input, .form-grid select {
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        /* Reports Section */
        .reports-controls {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .report-summary {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-weight: 500;
          color: #888;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a237e;
        }

        /* Project Cost Analysis */
        .project-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e0e0e0;
          width: 100%;
          justify-content: space-around;
        }

        .metric {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-weight: 500;
          color: #888;
        }

        .metric-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a237e;
        }

        .progress-bar {
          background-color: #e0e0e0;
          border-radius: 50px;
          height: 8px;
          width: 100px;
          overflow: hidden;
        }

        .progress-fill {
          background-color: #4caf50;
          height: 100%;
          transition: width 0.3s ease;
        }

        .chart-container {
          margin-top: 20px;
        }

        .chart-bar-container {
          display: flex;
          margin-bottom: 10px;
        }

        .chart-bar {
          height: 30px;
          line-height: 30px;
          color: white;
          padding-left: 10px;
          border-radius: 5px;
        }

        .chart-label {
          font-weight: bold;
        }

        .pie-chart-container {
          display: flex;
          align-items: center;
          margin-top: 20px;
        }

        .pie-chart {
          width: 150px;
          height: 150px;
          border-radius: 50%;
        }

        .legend {
          margin-left: 20px;
        }

        /* Mobile chart responsive adjustments */
        @media (max-width: 768px) {
          .pie-chart-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .legend {
            margin-left: 0;
            margin-top: 15px;
          }

          .chart-bar-container {
            flex-direction: column;
            gap: 5px;
          }

          .chart-bar {
            height: 25px;
            line-height: 25px;
            padding-left: 8px;
            font-size: 0.875rem;
          }
        }

        /* Mobile overlay when sidebar is open */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 999;
          display: none;
        }

        @media (max-width: 992px) {
          .sidebar-overlay.active {
            display: block;
          }
        }

        .legend-color {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 10px;
          vertical-align: middle;
        }
      `}</style>

      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          {isSidebarOpen && (
            <>
              <img src={logo} alt="Collyer International Logo" style={{width: '120px', height: 'auto', marginRight: '10px'}} />
              <h2>{currentUserData ? currentUserData.name : 'Admin'}</h2>
            </>
          )}
          <button
            aria-label="Close menu"
            className="toggle-btn"
            onClick={() => setIsSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
              <FaHome /> {isSidebarOpen && <span>Dashboard</span>}
            </li>
            <li className={activeSection === 'stock' ? 'active' : ''} onClick={() => setActiveSection('stock')}>
              <FaBox /> {isSidebarOpen && <span>Stock Management</span>}
            </li>
            <li className={activeSection === 'requisitions' ? 'active' : ''} onClick={() => setActiveSection('requisitions')}>
              <FaClipboardList /> {isSidebarOpen && <span>Requisitions</span>}
            </li>
            <li className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>
              <FaProjectDiagram /> {isSidebarOpen && <span>Project Management</span>}
            </li>
            <li className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
              <FaUsers /> {isSidebarOpen && <span>User Management</span>}
            </li>
            <li className={activeSection === 'reports' ? 'active' : ''} onClick={() => setActiveSection('reports')}>
              <FaChartLine /> {isSidebarOpen && <span>Reports</span>}
            </li>
            <li className={activeSection === 'notifications' ? 'active' : ''} onClick={() => setActiveSection('notifications')}>
              <FaBell /> {isSidebarOpen && <span>Notifications</span>}
            </li>
            <li onClick={handleLogout}>
              <FaSignOutAlt /> {isSidebarOpen && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <button 
              className="menu-btn" 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search across stocks, requisitions, projects, and users..."
          />
        </header>
        {renderContent()}
      </main>
    </div>
  );
}