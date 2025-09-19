import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaClipboardList, FaHome, FaSignOutAlt, FaBars, FaSearch, FaTimes, FaBell, FaFileAlt, FaPlus, FaExchangeAlt } from 'react-icons/fa';
import logo from './assets/logo.jpeg';

const mockStocks = [
  { id: 'stock1', name: 'Cement', category: 'Construction', quantity: 100, unitCost: 50, supplier: 'BuildCorp' },
  { id: 'stock2', name: 'Steel Rods', category: 'Construction', quantity: 10, unitCost: 120, supplier: 'MetalWorks' },
  { id: 'stock3', name: 'Bricks', category: 'Construction', quantity: 1000, unitCost: 2, supplier: 'BrickMasters' },
  { id: 'stock4', name: 'Paint', category: 'Finishing', quantity: 5, unitCost: 25, supplier: 'ColorPlus' },
  { id: 'stock5', name: 'Tiles', category: 'Finishing', quantity: 200, unitCost: 15, supplier: 'TilePro' },
  { id: 'stock6', name: 'Electrical Wire', category: 'Electrical', quantity: 500, unitCost: 10, supplier: 'ElectroSupply' },
  { id: 'stock7', name: 'Plumbing Pipes', category: 'Plumbing', quantity: 300, unitCost: 8, supplier: 'AquaFlow' }
];

import RequisitionForm from './RequisitionForm';
import './AdminDashboard.css';

export default function UserDashboard({ projects, currentUserData, requisitions, addRequisition }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stocks] = useState(mockStocks);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState(mockStocks);
  const [filteredRequisitions, setFilteredRequisitions] = useState(requisitions);
  
  
  const [selectedCard, setSelectedCard] = useState(null);
  
  
  
  
  
  
  
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestingItem, setRequestingItem] = useState(null);
  const [newRequisitionQuantity, setNewRequisitionQuantity] = useState(0);
  const [newRequisitionProject, setNewRequisitionProject] = useState('');
  

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

  useEffect(() => {
    const search = searchQuery.toLowerCase();

    const filteredStks = stocks.filter(stock => {
      const name = stock.name ? stock.name.toLowerCase() : '';
      const category = stock.category ? stock.category.toLowerCase() : '';
      const supplier = stock.supplier ? stock.supplier.toLowerCase() : '';
      return name.includes(search) || category.includes(search) || supplier.includes(search);
    });
    setFilteredStocks(filteredStks);

    const filteredReqs = requisitions.filter(req => {
      const items = req.items ? req.items.toLowerCase() : '';
      const projectName = req.projectName ? req.projectName.toLowerCase() : '';
      const category = req.category ? req.category.toLowerCase() : '';
      return items.includes(search) || projectName.includes(search) || category.includes(search);
    });
    setFilteredRequisitions(filteredReqs);

  }, [searchQuery, stocks, requisitions]);

  const handleRequestItem = (item) => {
    setRequestingItem(item);
setShowRequestModal(true);
  };

  const handleAddRequisitionSubmit = (e) => {
    e.preventDefault();
    const newRequisition = {
      name: currentUserData.name,
      items: requestingItem.name,
      quantity: newRequisitionQuantity,
      status: 'pending',
      projectName: newRequisitionProject,
      category: requestingItem.category,
      reasonForRequest: 'User request',
      date: new Date().toISOString().slice(0, 10),
      unitCost: requestingItem.unitCost,
    };
    addRequisition(newRequisition);
    setShowRequestModal(false);
    setNewRequisitionQuantity(0);
    setNewRequisitionProject('');
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('User logged out successfully');
      navigate('/'); // Redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  
  const [showRequisitionForm, setShowRequisitionForm] = useState(false);







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
          
          <div className="summary-card clickable" onClick={() => setSelectedCard('pending-requisitions')}>
            <div className="summary-icon"><FaClipboardList /></div>
            <div className="summary-content">
              <h4>Pending Requisitions</h4>
              <p className="summary-value">{requisitions.filter(req => req.status === 'pending').length}</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedCard('approved-requisitions')}>
            <div className="summary-icon"><FaClipboardList /></div>
            <div className="summary-content">
              <h4>Approved Requisitions</h4>
              <p className="summary-value">{requisitions.filter(req => req.status === 'approved').length}</p>
            </div>
          </div>
          <div className="summary-card clickable" onClick={() => setSelectedCard('declined-requisitions')}>
            <div className="summary-icon"><FaClipboardList /></div>
            <div className="summary-content">
              <h4>Declined Requisitions</h4>
              <p className="summary-value">{requisitions.filter(req => req.status === 'rejected').length}</p>
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
      case 'approved-requisitions':
        title = 'Approved Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'items', 'Quantity': 'quantity', 'Project': 'projectName', 'Date': 'date' };
        data = requisitions.filter(req => req.status === 'approved');
        console.log("Approved Requisitions Data:", data); // Log approved data


        break;
      case 'declined-requisitions':
        title = 'Declined Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'items', 'Quantity': 'quantity', 'Project': 'projectName', 'Date': 'date' };
        data = requisitions.filter(req => req.status === 'rejected'); // Changed to 'rejected'
        console.log("Declined Requisitions Data (filtered by 'rejected'):", data); // Log declined data
        break;
      case 'pending-requisitions':
        title = 'Pending Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'items', 'Quantity': 'quantity', 'Project': 'projectName', 'Date': 'date' };
        data = requisitions.filter(req => req.status === 'pending');
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
      {showRequisitionForm ? (
        <RequisitionForm onClose={() => setShowRequisitionForm(false)} onSubmit={addRequisition} projects={projects} />
      ) : (
        <div className="card">
          <h3>All Requisitions</h3>
          <button className="btn btn-primary" onClick={() => setShowRequisitionForm(true)} style={{ marginBottom: '20px' }}>Create New Requisition</button>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Project Name</th>
                  <th>Category</th>
                  <th>Reason for Request</th>
                  <th>Date</th>
                  <th>Status</th>
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
                    <td>{req.reasonForRequest}</td>
                    <td>{req.date}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status ? (req.status.charAt(0).toUpperCase() + req.status.slice(1)) : ''}
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
  );

  const renderStockManagement = () => {
    

    

    

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
                  <th>Request</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map(stock => (
                  <tr key={stock.id}>
                    <td>{stock.name}</td>
                    <td>{stock.quantity}</td>
                    <td>${stock.unitCost.toFixed(2)}</td>
                    <td>{stock.supplier}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleRequestItem(stock)}>Request</button>
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
      
      default:
        return renderDashboard();
    }
  };

  

  return (
    <div className="admin-dashboard">
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Collyer logo" />
            {isSidebarOpen && <h1>{currentUserData ? currentUserData.name : 'User'}</h1>}
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
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`main-content ${isSidebarOpen ? '' : 'shifted'}`}>
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
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>
        {renderContent()}
      </main>

      {/* Modals */}
      {showRequestModal && requestingItem && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="card-header">
              <h3>Request: {requestingItem.name}</h3>
              <button className="btn btn-danger" onClick={() => setShowRequestModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddRequisitionSubmit} className="form-grid">
              <div>
                <label>Quantity:</label>
                <input type="number" value={newRequisitionQuantity} onChange={(e) => setNewRequisitionQuantity(parseInt(e.target.value))} required />
              </div>
              <div>
                <label>Project:</label>
                <select value={newRequisitionProject} onChange={(e) => setNewRequisitionProject(e.target.value)} required>
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.name}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Submit Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
