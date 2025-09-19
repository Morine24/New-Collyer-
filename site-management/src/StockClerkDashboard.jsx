import React, { useState, useEffect } from 'react';
import { FaBox, FaClipboardList, FaHome, FaSignOutAlt, FaBars, FaSearch, FaTimes, FaBell, FaFileAlt, FaPlus, FaExchangeAlt } from 'react-icons/fa';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';





const mockDeliveries = [
    { id: 'del1', item: 'Cement', quantity: 50, date: '2025-08-19'},
    { id: 'del2', item: 'Steel Rods', quantity: 20, date: '2025-08-18'},
    { id: 'del3', item: 'Bricks', quantity: 500, date: '2025-08-17'},
];

export default function StockClerkDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stocks, setStocks] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [issuedStock, setIssuedStock] = useState([]); // New state for issued stock
  const [damagedReturnedStock, setDamagedReturnedStock] = useState([]); // New state for damaged/returned stock
  const [selectedCard, setSelectedCard] = useState(null);
  const [showIssueStockModal, setShowIssueStockModal] = useState(false);
  const [issuingStockItem, setIssuingStockItem] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [issueDetails, setIssueDetails] = useState({ quantity: 0, issuedTo: '' });
  const [newDelivery, setNewDelivery] = useState({ item: '', quantity: 0, supplier: '' });
  const [damagedStockDetails, setDamagedStockDetails] = useState({ item: '', quantity: 0, reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  // const [sortOrder, setSortOrder] = useState('asc');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Run on initial load

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleUpdateRequisitionStatus = (id, status) => {
    // TODO: Implement the actual logic to update the requisition status in Firestore
    console.log(`Updating requisition ${id} to ${status}`);
  };

  const handleLogout = () => {
    console.log('Stock Clerk logged out');
    // Add logout logic here
  };

  useEffect(() => {
    const fetchStock = async () => {
      const stockCollection = collection(db, 'stockItems');
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);
      setFilteredStocks(stockList);
    };

    fetchStock();
  }, []);

  useEffect(() => {
    const fetchRequisitions = async () => {
      const requisitionsCollection = collection(db, 'requisitions');
      const requisitionsSnapshot = await getDocs(requisitionsCollection);
      const requisitionsList = requisitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequisitions(requisitionsList);
    };

    fetchRequisitions();
  }, []);

  useEffect(() => {
    let result = stocks.filter(item => 
      (item.project && item.project.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (selectedProject) {
      result = result.filter(item => item.project === selectedProject);
    }

    setFilteredStocks(result);
  }, [searchTerm, selectedProject, stocks]);

  const handleIssueStockSubmit = (e) => {
    e.preventDefault();
    if (issueDetails.quantity > issuingStockItem.quantity) {
      alert("Quantity to issue cannot exceed current stock.");
      return;
    }

    // Decrease stock quantity
    setStocks(stocks.map(stock =>
      stock.id === issuingStockItem.id ? { ...stock, quantity: stock.quantity - issueDetails.quantity } : stock
    ));

    // Record issued stock
    setIssuedStock([...issuedStock, {
      id: `issued${issuedStock.length + 1}`,
      item: issuingStockItem.name,
      quantity: issueDetails.quantity,
      issuedTo: issueDetails.issuedTo,
      date: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    }]);

    setIssuingStockItem(null);
    setIssueDetails({ quantity: 0, issuedTo: '' });
    setShowIssueStockModal(false);
  };

  const handleAddDeliverySubmit = (e) => {
    e.preventDefault();
    const id = `del${deliveries.length + 1}`;
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    setDeliveries([...deliveries, { ...newDelivery, id, date }]);
    setNewDelivery({ item: '', quantity: 0, supplier: '' }); // Clear form
    setActiveAction(null); // Go back to quick actions menu
  };

  const handleUpdateDamagedReturnedStockSubmit = (e) => {
    e.preventDefault();
    const { item, quantity, reason } = damagedStockDetails;

    const stockItem = stocks.find(s => s.name === item);
    if (!stockItem) {
      alert("Item not found in stock.");
      return;
    }

    if (quantity > stockItem.quantity) {
      alert("Quantity to update cannot exceed current stock.");
      return;
    }

    // Decrease stock quantity
    setStocks(stocks.map(s =>
      s.name === item ? { ...s, quantity: s.quantity - quantity } : s
    ));

    // Record damaged/returned stock
    setDamagedReturnedStock([...damagedReturnedStock, {
      id: `dr${damagedReturnedStock.length + 1}`,
      item,
      quantity,
      reason,
      date: new Date().toISOString().slice(0, 10)
    }]);

    setDamagedStockDetails({ item: '', quantity: 0, reason: '' }); // Clear form
    setActiveAction(null); // Go back to quick actions menu
  };

  const projectNames = [...new Set(stocks.map(stock => stock.project))];

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to download.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderDashboard = () => {
    if (selectedCard) {
      return renderCardDetails(selectedCard);
    }

    return (
      <div className="section-content">
        <div className="summary-cards">
          <div className="summary-card clickable" onClick={() => setSelectedCard('stock-overview')}>
            <div className="summary-icon"><FaBox /></div>
            <div className="summary-content">
              <h4>Stock Overview</h4>
              <p className="summary-value">{stocks.length} Items</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedCard('low-stock-alerts')}>
            <div className="summary-icon"><FaBell /></div>
            <div className="summary-content">
              <h4>Low Stock Alerts</h4>
              <p className="summary-value">{stocks.filter(stock => stock.quantity < 20).length}</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedCard('recent-deliveries')}>
            <div className="summary-icon"><FaClipboardList /></div>
            <div className="summary-content">
              <h4>Recently Received Deliveries</h4>
              <p className="summary-value">{deliveries.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCardDetails = (cardType) => {
    let title = '';
    let data = [];
    let columns = [];
    let columnMapping = {};

    switch (cardType) {
      case 'stock-overview':
        title = 'Stock Overview';
        columns = ['Item', 'Quantity', 'Status'];
        columnMapping = { 'Item': 'name', 'Quantity': 'quantity', 'Status': 'status' };
        data = stocks.map(s => ({...s, status: s.quantity < 20 ? 'Low Stock' : 'Normal'}));
        break;
      case 'low-stock-alerts':
        title = 'Low Stock Alerts';
        columns = ['Item', 'Quantity'];
        columnMapping = { 'Item': 'name', 'Quantity': 'quantity' };
        data = stocks.filter(stock => stock.quantity < 20);
        break;
      case 'recent-deliveries':
        title = 'Recently Received Deliveries';
        columns = ['Item', 'Quantity', 'Date'];
        columnMapping = { 'Item': 'item', 'Quantity': 'quantity', 'Date': 'date' };
        data = deliveries;
        break;
      default:
        break;
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
          <button className="btn btn-danger" onClick={() => setSelectedCard(null)}>Close</button>
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
                  {columns.map(col => {
                    if (col === 'Status') {
                      return (
                        <td key={col}>
                          {item.quantity < 20 ? 
                            <span className="status-badge status-warning">Low Stock</span> : 
                            <span className="status-badge status-normal">Normal</span>}
                        </td>
                      )
                    }
                    return <td key={col}>{item[columnMapping[col]]}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                <th>Date</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map(req => (
                <tr key={req.id}>
                  <td>{req.items}</td>
                  <td>{req.quantity}</td>
                  <td>{req.projectName}</td>
                  <td>{req.date}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <select
                      value={req.status}
                      onChange={(e) => handleUpdateRequisitionStatus(req.id, e.target.value)}
                      className="form-grid-select"
                    >
                      <option value="fulfilled">Fulfilled</option>
                      <option value="not-fulfilled">Not Fulfilled</option>
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

  const renderStockManagement = () => {
    const handleIssueStock = (item) => {
      setIssuingStockItem(item);
      setShowIssueStockModal(true);
    };

    return (
      <div className="section-content">
        <div className="card">
          <h3>Stock Management</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Supplier</th>
                  <th>Project</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map(stock => (
                  <tr key={stock.id}>
                    <td>{stock.name}</td>
                    <td>{stock.quantity}</td>
                    <td>${stock.unitCost.toFixed(2)}</td>
                    <td>{stock.supplier}</td>
                    <td>{stock.project}</td>
                    <td>
                      <button className="btn btn-sm btn-warning" onClick={() => handleIssueStock(stock)} style={{ marginLeft: '5px' }}>Issue</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'stock':
        return renderStockManagement();
      case 'requisitions':
        return renderRequisitions();
      case 'reports':
        return renderReports();
      case 'quick-actions':
        return renderQuickActions();
      default:
        return renderDashboard();
    }
  };

  const renderQuickActions = () => {
    switch (activeAction) {
      case 'add-delivery':
        return (
          <div className="section-content">
            <div className="card">
              <h3>Add New Delivery</h3>
              {/* Form for adding new delivery */}
              <form className="form-grid" onSubmit={handleAddDeliverySubmit}>
                <label>Item:</label>
                <input type="text" placeholder="Item Name" value={newDelivery.item} onChange={(e) => setNewDelivery({ ...newDelivery, item: e.target.value })} required />
                <label>Quantity:</label>
                <input type="number" placeholder="Quantity" value={newDelivery.quantity} onChange={(e) => setNewDelivery({ ...newDelivery, quantity: parseInt(e.target.value) })} required />
                <label>Supplier:</label>
                <input type="text" placeholder="Supplier Name" value={newDelivery.supplier} onChange={(e) => setNewDelivery({ ...newDelivery, supplier: e.target.value })} required />
                <button type="submit" className="btn btn-primary">Add Delivery</button>
              </form>
            </div>
          </div>
        );
      case 'update-stock':
        return (
          <div className="section-content">
            <div className="card">
              <h3>Update Damaged/Returned Stock</h3>
              {/* Form for updating damaged/returned stock */}
              <form className="form-grid" onSubmit={handleUpdateDamagedReturnedStockSubmit}>
                <label>Item:</label>
                <input type="text" placeholder="Item Name" value={damagedStockDetails.item} onChange={(e) => setDamagedStockDetails({ ...damagedStockDetails, item: e.target.value })} required />
                <label>Quantity:</label>
                <input type="number" placeholder="Quantity" value={damagedStockDetails.quantity} onChange={(e) => setDamagedStockDetails({ ...damagedStockDetails, quantity: parseInt(e.target.value) })} required />
                <label>Reason:</label>
                <select value={damagedStockDetails.reason} onChange={(e) => setDamagedStockDetails({ ...damagedStockDetails, reason: e.target.value })} required>
                  <option value="">Select Reason</option>
                  <option value="damaged">Damaged</option>
                  <option value="returned">Returned</option>
                </select>
                <button type="submit" className="btn btn-primary">Update Stock</button>
              </form>
            </div>
          </div>
        );
      default:
        return (
          <div className="section-content">
            <div className="card">
              <h3>Quick Actions</h3>
              <div className="quick-action-buttons">
                <button className="btn btn-primary" onClick={() => setActiveAction('add-delivery')}>Add New Delivery</button>
                <button className="btn btn-primary" onClick={() => setActiveAction('update-stock')}>Update Damaged/Returned Stock</button>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderReportContent = (reportType) => {
    const { data, columns } = getReportDataAndColumns(reportType);

    if (!data || data.length === 0) {
      return <p>No data available for this report.</p>;
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map(col => <td key={col}>{row[col.toLowerCase().replace(/ /g, '')]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getReportDataAndColumns = (reportType) => {
    let data = [];
    let columns = [];

    switch (reportType) {
      case 'daily':
        columns = ['Item', 'Quantity', 'Type', 'Time'];
        data = [
          { item: 'Cement', quantity: 10, type: 'out', time: '10:00 AM' },
          { item: 'Bricks', quantity: 100, type: 'out', time: '11:30 AM' },
          { item: 'Cement', quantity: 20, type: 'in', time: '02:15 PM' },
        ];
        break;
      case 'weekly':
        columns = ['Item', 'Total In', 'Total Out', 'Net Change'];
        data = [
          { item: 'Cement', totalIn: 50, totalOut: 20, netChange: 30 },
          { item: 'Steel Rods', totalIn: 20, totalOut: 10, netChange: 10 },
          { item: 'Bricks', totalIn: 500, totalOut: 200, netChange: 300 },
        ];
        break;
      case 'history': {
        columns = ['Item', 'Quantity', 'Type', 'Date', 'Details'];
        const stockMovementHistory = [
          ...requisitions.map(req => ({ item: req.items, quantity: req.quantity, type: 'out', date: req.date, details: `Project: ${req.projectName}` })),
          ...deliveries.map(del => ({ item: del.item, quantity: del.quantity, type: 'in', date: del.date, details: '' })),
          ...issuedStock.map(issue => ({ item: issue.item, quantity: issue.quantity, type: 'issued', date: issue.date, details: `To: ${issue.issuedTo}` })),
          ...damagedReturnedStock.map(dr => ({ item: dr.item, quantity: dr.quantity, type: dr.reason, date: dr.date, details: '' })),
        ];
        // Sort by date, newest first
        data = stockMovementHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      }
      default:
        break;
    }
    return { data, columns };
  };

  const renderReports = () => (
    <div className="section-content">
      <div className="card">
        <h3>Reports</h3>
        <div className="report-options">
          <button className="btn btn-primary" onClick={() => setActiveReport('daily')}>Daily Report</button>
          <button className="btn btn-primary" onClick={() => setActiveReport('weekly')}>Weekly Report</button>
          <button className="btn btn-primary" onClick={() => setActiveReport('history')}>Stock Movement History</button>
        </div>
        {activeReport && (
          <div className="card">
            <div className="card-header">
              <h3>{activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report</h3>
              <div>
                <button className="btn btn-primary" onClick={() => {
                  const { data } = getReportDataAndColumns(activeReport);
                  downloadCSV(data, `${activeReport}_report.csv`);
                }}>Download CSV</button>
                <button className="btn btn-danger" onClick={() => setActiveReport(null)}>Close</button>
              </div>
            </div>
            <div className="report-content">
              {renderReportContent(activeReport)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Collyer logo" />
            {isSidebarOpen && <h1>Stock Clerk</h1>}
          </div>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#" className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => handleNavClick('dashboard')}>
                <FaHome className="nav-icon" />
                {isSidebarOpen && <span>Dashboard</span>}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'stock' ? 'active' : ''} onClick={() => handleNavClick('stock')}>
                <FaBox className="nav-icon" />
                {isSidebarOpen && <span>Stock</span>}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'requisitions' ? 'active' : ''} onClick={() => handleNavClick('requisitions')}>
                <FaClipboardList className="nav-icon" />
                {isSidebarOpen && <span>Requisitions</span>}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'quick-actions' ? 'active' : ''} onClick={() => {handleNavClick('quick-actions'); setActiveAction(null);}}>
                <FaExchangeAlt className="nav-icon" />
                {isSidebarOpen && <span>Quick Actions</span>}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'reports' ? 'active' : ''} onClick={() => handleNavClick('reports')}>
                <FaFileAlt className="nav-icon" />
                {isSidebarOpen && <span>Reports</span>}
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen && window.innerWidth >= 768 ? '' : 'shifted'}`}>
        <header className="main-header">
          <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </button>
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
          <div className="header-actions">
            <div className="search-bar">
                <FaSearch />
                <input
                type="text"
                placeholder="Filter by project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select onChange={(e) => setSelectedProject(e.target.value)} value={selectedProject} className="control-group">
                <option value="">All Projects</option>
                {projectNames.map(project => (
                <option key={project} value={project}>{project}</option>
                ))}
            </select>
          </div>
        </header>
        {renderContent()}
      </main>

      {/* Issue Stock Modal */}
      {showIssueStockModal && issuingStockItem && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="card-header">
                <h3>Issue Stock: {issuingStockItem.name}</h3>
                <button className="btn btn-danger" onClick={() => setShowIssueStockModal(false)}><FaTimes/></button>
            </div>
            <form onSubmit={handleIssueStockSubmit} className="form-grid">
              <div>
                <label>Quantity to Issue:</label>
                <input type="number" value={issueDetails.quantity} onChange={(e) => setIssueDetails({ ...issueDetails, quantity: parseInt(e.target.value) })} max={issuingStockItem.quantity} required />
              </div>
              <div>
                <label>Issued To:</label>
                <input type="text" value={issueDetails.issuedTo} onChange={(e) => setIssueDetails({ ...issueDetails, issuedTo: e.target.value })} required />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Issue Stock</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowIssueStockModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

