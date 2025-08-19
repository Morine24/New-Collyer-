import React, { useEffect, useState } from 'react';

// Mock Firebase functions for demo
const mockDb = {
  collection: () => ({
    addDoc: async (data) => ({ id: Date.now().toString(), ...data }),
    getDocs: async () => ({
      empty: false,
      docs: []
    })
  })
};

// Enhanced mock data with costs and projects
const mockStocks = [
  { id: 'stock1', name: 'Cement', quantity: 100, unitCost: 50, supplier: 'BuildCorp' },
  { id: 'stock2', name: 'Steel Rods', quantity: 50, unitCost: 120, supplier: 'MetalWorks' },
  { id: 'stock3', name: 'Bricks', quantity: 1000, unitCost: 2, supplier: 'BrickMasters' },
  { id: 'stock4', name: 'Paint', quantity: 30, unitCost: 25, supplier: 'ColorPlus' },
  { id: 'stock5', name: 'Tiles', quantity: 200, unitCost: 15, supplier: 'TilePro' }
];

const mockRequisitions = [
  { id: 'req1', item: 'Cement', quantity: 20, status: 'pending', project: 'Building A', requestDate: '2025-08-15', unitCost: 50 },
  { id: 'req2', item: 'Bricks', quantity: 200, status: 'approved', project: 'Building B', requestDate: '2025-08-14', unitCost: 2 },
  { id: 'req3', item: 'Steel Rods', quantity: 10, status: 'fulfilled', project: 'Building A', requestDate: '2025-08-13', unitCost: 120 },
  { id: 'req4', item: 'Paint', quantity: 5, status: 'pending', project: 'Building C', requestDate: '2025-08-16', unitCost: 25 },
  { id: 'req5', item: 'Tiles', quantity: 50, status: 'fulfilled', project: 'Building B', requestDate: '2025-08-12', unitCost: 15 }
];

const mockProjects = [
  { id: 'proj1', name: 'Building A', budget: 50000, startDate: '2025-08-01', status: 'active' },
  { id: 'proj2', name: 'Building B', budget: 75000, startDate: '2025-08-05', status: 'active' },
  { id: 'proj3', name: 'Building C', budget: 30000, startDate: '2025-08-10', status: 'planning' }
];

const mockUsers = [
  { id: 'user1', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
  { id: 'user2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Manager' },
  { id: 'user3', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Staff' },
];

export default function EnhancedAdminDashboard() {
  const [stocks, setStocks] = useState(mockStocks);
  const [requisitions, setRequisitions] = useState(mockRequisitions);
  const [projects, setProjects] = useState(mockProjects);
  const [users, setUsers] = useState(mockUsers);
  const [filteredRequisitions, setFilteredRequisitions] = useState(mockRequisitions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [reportType, setReportType] = useState('stock');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [selectedProject, setSelectedProject] = useState('all');

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
      .filter(req => req.project === projectName && req.status === 'fulfilled')
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

  const renderDashboard = () => (
    <div className="dashboard-grid">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <FaBox />
          </div>
          <div className="summary-content">
            <h4>Total Stock Value</h4>
            <p className="summary-value">${calculateTotalStockValue().toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">
            <FaClipboardList />
          </div>
          <div className="summary-content">
            <h4>Pending Requisitions</h4>
            <p className="summary-value">{requisitions.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">
            <FaDollarSign />
          </div>
          <div className="summary-content">
            <h4>Active Projects</h4>
            <p className="summary-value">{projects.filter(p => p.status === 'active').length}</p>
          </div>
        </div>
      </div>

      {/* Project Costs */}
      <div className="card project-costs-card">
        <h3>Project Cost Overview</h3>
        <div className="project-selector">
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="project-select"
          >
            <option value="all">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>{project.name}</option>
            ))}
          </select>
        </div>
        
        <div className="projects-overview">
          {(selectedProject === 'all' ? projects : projects.filter(p => p.name === selectedProject)).map(project => {
            const spent = calculateProjectCost(project.name);
            const progress = getProjectProgress(project.name);
            
            return (
              <div key={project.id} className="project-item">
                <div className="project-header">
                  <h4>{project.name}</h4>
                  <span className={`project-status status-${project.status}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
                <div className="project-metrics">
                  <div className="metric">
                    <span className="metric-label">Budget:</span>
                    <span className="metric-value">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Spent:</span>
                    <span className="metric-value">${spent.toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Remaining:</span>
                    <span className="metric-value">${(project.budget - spent).toLocaleString()}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
                <span className="progress-text">{progress.toFixed(1)}% of budget used</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stock Management */}
      <div className="card stock-card">
        <h3>Stock Management</h3>
        <div className="stock-grid">
          {stocks.map(stock => (
            <div key={stock.id} className="stock-item">
              <div className="stock-header">
                <span className="stock-name">{stock.name}</span>
                <span className={`stock-quantity ${stock.quantity < 20 ? 'low-stock' : ''}`}>
                  {stock.quantity}
                </span>
              </div>
              <div className="stock-details">
                <div className="stock-detail">
                  <span>Unit Cost: ${stock.unitCost}</span>
                </div>
                <div className="stock-detail">
                  <span>Total Value: ${(stock.quantity * stock.unitCost).toLocaleString()}</span>
                </div>
                <div className="stock-detail">
                  <span>Supplier: {stock.supplier}</span>
                </div>
              </div>
              {stock.quantity < 20 && (
                <div className="low-stock-warning">⚠️ Low Stock Alert</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requisitions */}
      <div className="card requisition-card">
        <h3>Recent Requisitions</h3>
        <div className="table-container">
          <table className="requisition-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Project</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.slice(0, 5).map(req => (
                <tr key={req.id}>
                  <td>{req.item}</td>
                  <td>{req.quantity}</td>
                  <td>{req.project}</td>
                  <td>${(req.quantity * req.unitCost).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {req.status === 'pending' && (
                      <>
                        <button 
                          className="action-button approve" 
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-button reject" 
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button 
                        className="action-button fulfill" 
                        onClick={() => handleFulfillRequisition(req)}
                      >
                        Fulfill
                      </button>
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

  const renderReports = () => {
    const reportData = generateReportData();
    
    return (
      <div className="reports-section">
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
          
          <button className="download-button" onClick={downloadReport}>
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
              
              <div className="report-table-container">
                <table className="report-table">
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
              
              <div className="report-table-container">
                <table className="report-table">
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
                  <span className="stat-label">Total Budget:</span>
                  <span className="stat-value">${reportData.data.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Spent:</span>
                  <span className="stat-value">${reportData.data.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="report-table-container">
                <table className="report-table">
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
                          <div className="mini-progress-bar">
                            <div className="mini-progress-fill" style={{ width: `${Math.min(project.progress, 100)}%` }}></div>
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
    <div className="requisitions-section">
      <div className="card">
        <h3>All Requisitions</h3>
        <div className="table-container">
          <table className="requisition-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Project</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
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
                  <td className="actions-cell">
                    {req.status === 'pending' && (
                      <>
                        <button 
                          className="action-button approve" 
                          onClick={() => handleUpdateStatus(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="action-button reject" 
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === 'approved' && (
                      <button 
                        className="action-button fulfill" 
                        onClick={() => handleFulfillRequisition(req)}
                      >
                        Fulfill
                      </button>
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

  const renderStock = () => (
    <div className="stock-section">
      <div className="card">
        <h3>Stock Inventory</h3>
        <div className="table-container">
          <table className="requisition-table">
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
    </div>
  );

  const renderAddStock = () => (
    <div className="add-stock-section">
        <div className="card">
        <h3>Add New Item</h3>
        <form onSubmit={handleAddNewItem}>
          <div className="add-item-form">
            <input type="text" name="name" placeholder="Item Name" required />
            <input type="number" name="quantity" placeholder="Quantity" required />
            <input type="number" name="unitCost" placeholder="Unit Cost" step="0.01" required />
            <input type="text" name="supplier" placeholder="Supplier" required />
            <button type="submit" className="action-button approve">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );

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
  };

  const renderAddUser = () => (
    <div className="add-user-section">
      <div className="card">
        <h3>Add New User</h3>
        <form onSubmit={handleAddNewUser}>
          <div className="add-item-form">
            <input type="text" name="name" placeholder="Full Name" required />
            <input type="email" name="email" placeholder="Email Address" required />
            <select name="role" required>
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
            </select>
            <button type="submit" className="action-button approve">Add User</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap');
        
        :root {
          --background-dark: #0f172a;
          --card-dark: #1e293b;
          --card-hover: #334155;
          --primary-color: #3b82f6;
          --primary-hover: #2563eb;
          --secondary-color: #8b5cf6;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --danger-color: #ef4444;
          --text-light: #f8fafc;
          --text-medium: #cbd5e1;
          --text-dark: #64748b;
          --border-color: #334155;
          --shadow-light: 0 4px 15px rgba(0, 0, 0, 0.3);
          --shadow-hover: 0 8px 25px rgba(0, 0, 0, 0.4);
          --border-radius: 16px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * {
          box-sizing:content-box;
        }

        body {
          margin: 0;
          font-family: 'Quicksand', sans-serif;
          background: linear-gradient(135deg, var(--background-dark) 0%, #1e293b 100%);
          color: var(--text-light);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
          width: 100%;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
          position: relative;
          margin: 0;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, var(--card-dark) 0%, #0f172a 100%);
          backdrop-filter: blur(10px);
          border-right: 1px solid var(--border-color);
          transition: var(--transition);
          flex-shrink: 0;
          position: fixed;
          height: 100vh;
          padding: 2rem;
          overflow-y: auto;
        }

        .sidebar.open {
          transform: translateX(0);
          box-shadow: var(--shadow-hover);
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .sidebar-header h2 {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .close-menu {
          color: var(--text-medium);
          cursor: pointer;
          font-size: 1.5rem;
          transition: var(--transition);
          padding: 0.5rem;
          border-radius: 8px;
        }

        .close-menu:hover {
          color: var(--text-light);
          background-color: var(--border-color);
        }

        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-menu li a {
          display: flex;
          align-items: center;
          padding: 1.2rem 1.5rem;
          color: var(--text-medium);
          text-decoration: none;
          border-radius: var(--border-radius);
          transition: var(--transition);
          font-weight: 500;
          margin-bottom: 0.75rem;
          border: 1px solid transparent;
        }

        .sidebar-menu li a:hover {
          background: linear-gradient(135deg, var(--card-hover) 0%, var(--border-color) 100%);
          color: var(--text-light);
          transform: translateX(8px);
          border-color: var(--border-color);
        }

        .sidebar-menu li a.active {
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .sidebar-menu li a svg {
          margin-right: 1rem;
          font-size: 1.25rem;
        }

        /* Main Content */
        .main-content {
          flex-grow: 1;
          padding: 1rem;
          transition: var(--transition);
          min-height: 100vh;
        }

        

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          background: linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%);
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-light);
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
        }

        .menu-toggle {
          font-size: 1.5rem;
          color: var(--text-medium);
          cursor: pointer;
          transition: var(--transition);
          padding: 0.75rem;
          border-radius: 8px;
        }

        .menu-toggle:hover {
          color: var(--text-light);
          background-color: var(--border-color);
        }

        .header-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .search-bar {
          position: relative;
          width: 320px;
        }

        .search-bar input {
          width: 100%;
          padding: 0.875rem 1.25rem 0.875rem 3rem;
          border: 1px solid var(--border-color);
          border-radius: 50px;
          font-size: 1rem;
          background-color: var(--background-dark);
          color: var(--text-light);
          transition: var(--transition);
          outline: none;
          font-family: 'Quicksand', sans-serif;
        }

        .search-bar input::placeholder {
          color: var(--text-dark);
        }

        .search-bar input:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background-color: var(--card-dark);
        }

        .search-bar .search-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dark);
          transition: var(--transition);
        }

        .search-bar input:focus + .search-icon {
          color: var(--primary-color);
        }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          gap: 2rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%);
          padding: 2rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .summary-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
          border-color: var(--primary-color);
        }

        .summary-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
        }

        .summary-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-medium);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-light);
          margin: 0;
        }

        /* Cards */
        .card {
          background: linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%);
          padding: 2.5rem;
          border-radius: var(--border-radius);
          box-shadow: var(--shadow-light);
          border: 1px solid var(--border-color);
          transition: var(--transition);
          margin-bottom: 2rem;
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-hover);
        }

        .card h3 {
          margin-top: 0;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--primary-color);
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
        }

        /* Project Costs */
        .project-costs-card {
          grid-column: 1 / -1;
        }

        .project-selector {
          margin-bottom: 2rem;
        }

        .project-select {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--background-dark);
          color: var(--text-light);
          font-family: 'Quicksand', sans-serif;
          font-size: 1rem;
          transition: var(--transition);
        }

        .project-select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .projects-overview {
          display: grid;
          gap: 1.5rem;
        }

        .project-item {
          background-color: var(--background-dark);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: var(--transition);
        }

        .project-item:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .project-header h4 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-light);
        }

        .project-status {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .project-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          font-size: 0.85rem;
          color: var(--text-medium);
          font-weight: 500;
        }

        .metric-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-light);
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background-color: var(--border-color);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--success-color), var(--primary-color));
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 0.85rem;
          color: var(--text-medium);
        }

        /* Stock Styles */
        .stock-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .stock-item {
          background-color: var(--background-dark);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: var(--transition);
        }

        .stock-item:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }

        .stock-item-detailed {
          background-color: var(--background-dark);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          transition: var(--transition);
        }

        .stock-item-detailed:hover {
          border-color: var(--primary-color);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
        }

        .stock-header, .stock-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .stock-name {
          font-weight: 600;
          color: var(--text-light);
          font-size: 1.1rem;
        }

        .stock-item-header h4 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-light);
        }

        .stock-quantity {
          font-weight: 700;
          color: var(--success-color);
          font-size: 1.1rem;
        }

        .stock-quantity.low-stock {
          color: var(--warning-color);
        }

        .stock-details, .stock-item-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stock-detail, .stock-metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .stock-metric {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .stock-metric:last-child {
          border-bottom: none;
        }

        .low-stock-warning {
          background: linear-gradient(135deg, var(--warning-color), #f97316);
          color: white;
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-top: 1rem;
          font-size: 0.9rem;
        }

        /* Tables */
        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .requisition-table, .report-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background-color: var(--background-dark);
        }

        .requisition-table thead tr th, .report-table thead tr th {
          background-color: var(--card-dark);
          text-align: left;
          padding: 1.25rem;
          color: var(--text-medium);
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--border-color);
        }

        .requisition-table tbody tr, .report-table tbody tr {
          transition: var(--transition);
          border-bottom: 1px solid var(--border-color);
        }

        .requisition-table tbody tr:hover, .report-table tbody tr:hover {
          background-color: var(--card-dark);
        }

        .requisition-table tbody tr td, .report-table tbody tr td {
          padding: 1.25rem;
          vertical-align: middle;
          color: var(--text-light);
        }

        /* Status Badges */
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }

        .status-pending { background: linear-gradient(135deg, var(--warning-color), #f97316); color: white; }
        .status-approved { background: linear-gradient(135deg, var(--success-color), #059669); color: white; }
        .status-rejected { background: linear-gradient(135deg, var(--danger-color), #dc2626); color: white; }
        .status-fulfilled { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; }
        .status-active { background: linear-gradient(135deg, var(--success-color), #059669); color: white; }
        .status-planning { background: linear-gradient(135deg, var(--secondary-color), #7c3aed); color: white; }
        .status-normal { background: linear-gradient(135deg, var(--success-color), #059669); color: white; }
        .status-warning { background: linear-gradient(135deg, var(--warning-color), #f97316); color: white; }

        /* Action Buttons */
        .action-button {
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-right: 0.5rem;
          font-weight: 600;
          font-family: 'Quicksand', sans-serif;
          transition: var(--transition);
          color: white;
          font-size: 0.85rem;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-light);
        }

        .approve { 
          background: linear-gradient(135deg, var(--success-color), #059669);
        }

        .reject { 
          background: linear-gradient(135deg, var(--danger-color), #dc2626);
        }

        .fulfill { 
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        }

        .actions-cell {
          white-space: nowrap;
        }

        /* Reports Section */
        .reports-section {
          padding: 1rem 0;
        }

        .reports-controls {
          display: flex;
          gap: 2rem;
          align-items: center;
          padding: 2rem;
          background: linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%);
          border-radius: var(--border-radius);
          margin-bottom: 2rem;
          border: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .control-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-medium);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .control-group select {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--background-dark);
          color: var(--text-light);
          font-family: 'Quicksand', sans-serif;
          font-size: 1rem;
          transition: var(--transition);
          min-width: 150px;
        }

        .control-group select:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .download-button {
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, var(--success-color), #059669);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-family: 'Quicksand', sans-serif;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .download-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-light);
        }

        .report-card {
          margin-top: 0;
        }

        .report-content {
          padding: 1rem 0;
        }

        .report-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 2rem;
          background-color: var(--background-dark);
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: center;
        }

        .stat-label {
          font-size: 0.9rem;
          color: var(--text-medium);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .report-table-container {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .mini-progress-bar {
          width: 60px;
          height: 6px;
          background-color: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
          display: inline-block;
          margin-right: 0.5rem;
        }

        .mini-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--success-color), var(--primary-color));
          transition: width 0.5s ease;
        }

        /* Loading and Error States */
        .loading-container, .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .loading-container {
          color: var(--primary-color);
        }

        .error-container {
          color: var(--danger-color);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          
          .summary-cards {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }
          
          .main-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }
          
          .header-title {
            font-size: 1.5rem;
            text-align: center;
          }

          .search-bar {
            width: 100%;
          }

          .reports-controls {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .stock-grid {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            grid-template-columns: 1fr;
          }

          .project-metrics {
            grid-template-columns: 1fr;
          }

          .table-container {
            overflow-x: auto;
          }

          .requisition-table, .report-table {
            min-width: 600px;
          }
        }

                * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'Quicksand', sans-serif;
          background: linear-gradient(135deg, var(--background-dark) 0%, #1e293b 100%);
          color: var(--text-light);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
        }

        .dashboard-container {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, var(--card-dark) 0%, #0f172a 100%);
          backdrop-filter: blur(10px);
          border-right: 1px solid var(--border-color);
          transition: var(--transition);
          flex-shrink: 0;
          position: fixed;
          height: 100vh;
          padding: 2rem;
          overflow-y: auto;
          transform: translateX(-100%);
        }

        .sidebar.open {
          transform: translateX(0);
          box-shadow: var(--shadow-hover);
        }

        .main-content {
          flex-grow: 1;
          padding: 2rem;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 100vh;
          margin-left: 0;
          width: 100%;
        }

        .dashboard-container.sidebar-open .main-content {
            margin-left: 280px;
        }

        .add-item-form {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .add-item-form input, .add-item-form select {
            padding: 0.75rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--background-dark);
            color: var(--text-light);
            font-family: 'Quicksand', sans-serif;
            font-size: 1rem;
            transition: var(--transition);
            flex-grow: 1;
        }

        .add-item-form input:focus, .add-item-form select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        @media (max-width: 1024px) {
          .dashboard-container.sidebar-open .main-content {
            margin-left: 0;
          }
        }
      `}</style>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <div className="close-menu" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes />
          </div>
        </div>
        <ul className="sidebar-menu">
          <li>
            <a 
              href="#" 
              className={activeSection === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveSection('dashboard')}
            >
              <FaHome /> Dashboard
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeSection === 'stock' ? 'active' : ''}
              onClick={() => setActiveSection('stock')}
            >
              <FaBox /> Stock Management
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeSection === 'requisitions' ? 'active' : ''}
              onClick={() => setActiveSection('requisitions')}
            >
              <FaClipboardList /> Requisitions
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeSection === 'reports' ? 'active' : ''}
              onClick={() => setActiveSection('reports')}
            >
              <FaFileAlt /> Reports
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={activeSection === 'projects' ? 'active' : ''}
              onClick={() => setActiveSection('projects')}
            >
              <FaChartLine /> Project Costs
            </a>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <header className="main-header">
          <div className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </div>
          <h1 className="header-title">
            {activeSection === 'dashboard' && 'Admin Dashboard'}
            {activeSection === 'stock' && 'Stock Management'}
            {activeSection === 'requisitions' && 'Requisitions Management'}
            {activeSection === 'reports' && 'Reports & Analytics'}
            {activeSection === 'projects' && 'Project Cost Management'}
          </h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FaSearch className="search-icon" />
          </div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'stock' && renderStock()}
          {activeSection === 'requisitions' && renderRequisitions()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'projects' && renderDashboard()}
        </div>
      </div>
    </div>
  );
}