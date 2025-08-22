import React, { useEffect, useState } from 'react';
import { FaTimes, FaBell, FaBox, FaClipboardList, FaDollarSign, FaDownload, FaHome, FaChartLine, FaBars, FaSearch, FaUsers, FaProjectDiagram, FaSignOutAlt } from 'react-icons/fa';

// Enhanced mock data with costs and projects
const mockStocks = [
  { id: 'stock1', name: 'Cement', quantity: 100, unitCost: 50, supplier: 'BuildCorp' },
  { id: 'stock2', name: 'Steel Rods', quantity: 50, unitCost: 120, supplier: 'MetalWorks' },
  { id: 'stock3', name: 'Bricks', quantity: 1000, unitCost: 2, supplier: 'BrickMasters' },
  { id: 'stock4', name: 'Paint', quantity: 30, unitCost: 25, supplier: 'ColorPlus' },
  { id: 'stock5', name: 'Tiles', quantity: 200, unitCost: 15, supplier: 'TilePro' }
];

const mockRequisitions = [
  { id: 'req1', item: 'Cement', quantity: 20, status: 'fulfilled', project: 'Building A', requestDate: '2025-08-15', unitCost: 50 },
  { id: 'req2', item: 'Bricks', quantity: 200, status: 'approved', project: 'Building B', requestDate: '2025-08-14', unitCost: 2 },
  { id: 'req3', item: 'Steel Rods', quantity: 10, status: 'fulfilled', project: 'Building A', requestDate: '2025-08-13', unitCost: 120 },
  { id: 'req4', item: 'Paint', quantity: 5, status: 'pending', project: 'Building C', requestDate: '2025-08-16', unitCost: 25 },
  { id: 'req5', item: 'Tiles', quantity: 50, status: 'fulfilled', project: 'Building B', requestDate: '2025-08-12', unitCost: 15 }
];

const mockProjects = [
  { id: 'proj1', name: 'Building A', budget: 50000, startDate: '2025-08-01', expectedCompletionDate: '2026-02-01', status: 'active' },
  { id: 'proj2', name: 'Building B', budget: 75000, startDate: '2025-08-05', expectedCompletionDate: '2026-08-05', status: 'active' },
  { id: 'proj3', name: 'Building C', budget: 30000, startDate: '2025-08-10', expectedCompletionDate: '2025-12-10', status: 'pending' }
];

const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john.doe@example.com', role: 'Manager' },
  { id: 'user2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Stock Clerk' },
  { id: 'user3', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Foreman' },
  { id: 'user4', name: 'Mary Poppins', email: 'mary.poppins@example.com', role: 'Regular Staff' },
];

export default function CleanAdminDashboard({ projects, addProject, deleteProject }) {
  const [stocks, setStocks] = useState(mockStocks);
  const [requisitions, setRequisitions] = useState(mockRequisitions);
  
  const [users, setUsers] = useState(mockUsers);
  const [filteredRequisitions, setFilteredRequisitions] = useState(mockRequisitions);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
  const [selectedProjectForAnalysis, setSelectedProjectForAnalysis] = useState(null);
  const [showProjectDetailsFor, setShowProjectDetailsFor] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  

  // Filter requisitions based on search query
  useEffect(() => {
    const filtered = requisitions.filter(req =>
      req.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.project.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRequisitions(filtered);
  }, [searchQuery, requisitions]);

  // Calculate project costs
  const calculateProjectCost = (projectName) => {
    return requisitions
      .filter(req => req.project === projectName)
      .reduce((total, req) => total + (req.quantity * req.unitCost), 0);
  };

  const calculateTotalStockValue = () => {
    return stocks.reduce((total, stock) => total + (stock.quantity * stock.unitCost), 0);
  };

  const getProjectProgress = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    const spent = calculateProjectCost(projectName);
    return project ? (spent / project.budget) * 100 : 0;
  };

  // Handler for updating requisition status
  const handleUpdateStatus = async (id, newStatus) => {
    const updatedReqs = requisitions.map(req =>
      req.id === id ? { ...req, status: newStatus } : req
    );
    setRequisitions(updatedReqs);
  };

  // Handler for fulfilling a requisition and updating stock
  const handleFulfillRequisition = async (req) => {
    const stockItem = stocks.find(s => s.name === req.item);
    if (!stockItem) {
      alert("Stock not found for item: " + req.item);
      return;
    }

    const newQuantity = stockItem.quantity - req.quantity;
    if (newQuantity < 0) {
      alert("Not enough stock to fulfill this requisition.");
      return;
    }

    const updatedStocks = stocks.map(stock =>
      stock.name === req.item ? { ...stock, quantity: newQuantity } : stock
    );
    
    const updatedReqs = requisitions.map(r =>
      r.id === req.id ? { ...r, status: 'fulfilled' } : r
    );

    setStocks(updatedStocks);
    setRequisitions(updatedReqs);
  };

  const handleNewProjectChange = (e) => {
    setNewProjectData({
      ...newProjectData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewProject = (e) => {
    e.preventDefault();
    addProject(newProjectData);
    setNewProjectData({ name: '', budget: '', startDate: '', expectedCompletionDate: '' });
    setIsAddProjectFormVisible(false);
  };

  const handleDeleteProject = (projectId) => {
    deleteProject(projectId);
  };

  const handleUpdateProject = (e) => {
    e.preventDefault();
    const updatedProjects = projects.map(project =>
      project.id === editingProject.id ? { ...editingProject } : project
    );
    setProjects(updatedProjects);
    setEditingProject(null);
  };

  const handleAddNewUser = (e) => {
    e.preventDefault();
    const newUser = {
      id: `user${users.length + 1}`,
      name: e.target.name.value,
      email: e.target.email.value,
      role: e.target.role.value,
    };
    setUsers([...users, newUser]);
    e.target.reset();
    setIsAddUserFormVisible(false);
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    const updatedUsers = users.map(user =>
      user.id === editingUser.id ? { ...editingUser } : user
    );
    setUsers(updatedUsers);
    setEditingUser(null);
  };

  const handleLogout = () => {
    console.log('User logged out');
    // Here you would typically clear user session, tokens, and redirect to login page
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
                <div className="pie-chart" style={{ background: `conic-gradient(#4caf50 ${(calculateProjectCost(project.name) / project.budget) * 100}%, #f44336 0)` }}></div>
                <div className="legend">
                  <div><span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span> Spent</div>
                  <div><span className="legend-color" style={{ backgroundColor: '#f44336' }}></span> Remaining</div>
                </div>
              </div>
              {showProjectDetailsFor === project.id && (
                <div className="project-metrics">
                  <div className="metric">
                    <span className="metric-label">Budget:</span>
                    <span className="metric-value">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Spent:</span>
                    <span className="metric-value">${calculateProjectCost(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Remaining:</span>
                    <span className="metric-value">${(project.budget - calculateProjectCost(project.name)).toLocaleString()}</span>
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
              {projects.map(project => (
                <tr key={project.id}>
                  <td onClick={() => setSelectedProjectForAnalysis(project)} className="clickable">{project.name}</td>
                  <td>${project.budget.toLocaleString()}</td>
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

      {selectedProjectForAnalysis && renderCostAnalysis(selectedProjectForAnalysis)}

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
              {users.map(user => (
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
                  <span className="stat-value">${reportData.data.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}</span>
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
                        <td>${item.unitCost}</td>
                        <td>${item.totalValue.toLocaleString()}</td>
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
                  <span className="stat-value">${reportData.summary.totalCost.toLocaleString()}</span>
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
                        <td>${(req.quantity * req.unitCost).toLocaleString()}</td>
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
                  <span className="stat-value">${reportData.data.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Spent:</span>
                  <span className="stat-value">${reportData.data.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}</span>
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
                        <td>${project.budget.toLocaleString()}</td>
                        <td>${project.spent.toLocaleString()}</td>
                        <td>${project.remaining.toLocaleString()}</td>
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
                <th>Item</th>
                <th>Quantity</th>
                <th>Project</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map(req => (
                <tr key={req.id}>
                  <td>{req.item}</td>
                  <td>{req.quantity}</td>
                  <td>{req.project}</td>
                  <td>${(req.quantity * req.unitCost).toLocaleString()}</td>
                  <td>{req.requestDate}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                      className="form-grid-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleAddNewItem = (e) => {
    e.preventDefault();
    const newItem = {
      id: `stock${stocks.length + 1}`,
      name: e.target.name.value,
      quantity: parseInt(e.target.quantity.value, 10),
      unitCost: parseFloat(e.target.unitCost.value),
      supplier: e.target.supplier.value,
    };
    setStocks([...stocks, newItem]);
    e.target.reset();
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
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => (
                <tr key={stock.id}>
                  <td>{stock.name}</td>
                  <td>{stock.quantity}</td>
                  <td>${stock.unitCost}</td>
                  <td>${(stock.quantity * stock.unitCost).toLocaleString()}</td>
                  <td>{stock.supplier}</td>
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
        /* General Body and Layout */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
          margin: 0;
          padding: 0;
          background-color: #f0f2f5;
          color: #333;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
        }

        /* Sidebar */
        .sidebar {
          width: 250px;
          background-color: #1a237e; /* Deep blue */
          color: #fff;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: fixed;
          height: 100%;
          overflow-y: auto;
          z-index: 1000;
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
        }

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
        }

        .menu-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #555;
          display: none;
        }

        @media (max-width: 768px) {
          .sidebar {
            left: -250px;
            transition: left 0.3s ease;
          }

          .sidebar-collapsed {
            left: 0;
            width: 250px;
          }

          .main-content {
            margin-left: 0;
          }

          .menu-btn {
            display: block;
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
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }

        .data-table th {
          background-color: #fafafa;
          font-weight: 600;
          color: #555;
        }

        .data-table tbody tr:hover {
          background-color: #f5f5f5;
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

        .legend-color {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 10px;
          vertical-align: middle;
        }
      `}</style>

      <aside className="sidebar">
        <div className="sidebar-header">
          {isSidebarOpen && <h2>Admin Dashboard</h2>}
          <button className="toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaTimes />
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
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search requisitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
}