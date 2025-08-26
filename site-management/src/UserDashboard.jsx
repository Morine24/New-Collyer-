import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaClipboardList, FaHome, FaSignOutAlt, FaBars, FaSearch, FaTimes, FaBell, FaFileAlt, FaPlus, FaExchangeAlt } from 'react-icons/fa';

const mockStocks = [
  { id: 'stock1', name: 'Cement', category: 'Construction', quantity: 100, unitCost: 50, supplier: 'BuildCorp' },
  { id: 'stock2', name: 'Steel Rods', category: 'Construction', quantity: 10, unitCost: 120, supplier: 'MetalWorks' },
  { id: 'stock3', name: 'Bricks', category: 'Construction', quantity: 1000, unitCost: 2, supplier: 'BrickMasters' },
  { id: 'stock4', name: 'Paint', category: 'Finishing', quantity: 5, unitCost: 25, supplier: 'ColorPlus' },
  { id: 'stock5', name: 'Tiles', category: 'Finishing', quantity: 200, unitCost: 15, supplier: 'TilePro' },
  { id: 'stock6', name: 'Electrical Wire', category: 'Electrical', quantity: 500, unitCost: 10, supplier: 'ElectroSupply' },
  { id: 'stock7', name: 'Plumbing Pipes', category: 'Plumbing', quantity: 300, unitCost: 8, supplier: 'AquaFlow' }
];

const mockCategories = [
  'Construction',
  'Finishing',
  'Electrical',
  'Plumbing'
];





const mockDeliveries = [
    { id: 'del1', item: 'Cement', quantity: 50, date: '2025-08-19'},
    { id: 'del2', item: 'Steel Rods', quantity: 20, date: '2025-08-18'},
    { id: 'del3', item: 'Bricks', quantity: 500, date: '2025-08-17'},
];

import RequisitionForm from './RequisitionForm';

export default function UserDashboard({ projects, currentUserData, requisitions, addRequisition }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stocks, setStocks] = useState(mockStocks);
  
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState(mockStocks);
  const [filteredRequisitions, setFilteredRequisitions] = useState(requisitions);
  const [issuedStock, setIssuedStock] = useState([]); // New state for issued stock
  const [damagedReturnedStock, setDamagedReturnedStock] = useState([]); // New state for damaged/returned stock
  const [selectedCard, setSelectedCard] = useState(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [showIssueStockModal, setShowIssueStockModal] = useState(false);
  const [issuingStockItem, setIssuingStockItem] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [newStock, setNewStock] = useState({ id: '', name: '', quantity: 0, unitCost: 0, supplier: '' });
  const [issueDetails, setIssueDetails] = useState({ quantity: 0, issuedTo: '' });
  const [newDelivery, setNewDelivery] = useState({ item: '', quantity: 0, supplier: '' });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestingItem, setRequestingItem] = useState(null);
  const [newRequisitionQuantity, setNewRequisitionQuantity] = useState(0);
  const [newRequisitionProject, setNewRequisitionProject] = useState('');

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

  const handleAddStockSubmit = (e) => {
    e.preventDefault();
    const id = `stock${stocks.length + 1}`;
    setStocks([...stocks, { ...newStock, id }]);
    setNewStock({ id: '', name: '', quantity: 0, unitCost: 0, supplier: '' });
    setShowAddStockModal(false);
  };

  const handleEditStockSubmit = (e) => {
    e.preventDefault();
    setStocks(stocks.map(stock =>
      stock.id === editingStockItem.id ? editingStockItem : stock
    ));
    setEditingStockItem(null);
    setShowEditStockModal(false);
  };

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

  
  const [showRequisitionForm, setShowRequisitionForm] = useState(false);

  

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
              <p className="summary-value">{requisitions.filter(req => req.status === 'declined').length}</p>
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
        columnMapping = { 'Item': 'item', 'Quantity': 'quantity', 'Project': 'project', 'Date': 'requestDate' };
        data = requisitions.filter(req => req.status === 'approved');
        break;
      case 'declined-requisitions':
        title = 'Declined Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'item', 'Quantity': 'quantity', 'Project': 'project', 'Date': 'requestDate' };
        data = requisitions.filter(req => req.status === 'declined');
        break;
      case 'pending-requisitions':
        title = 'Pending Requisitions';
        columns = ['Item', 'Quantity', 'Project', 'Date'];
        columnMapping = { 'Item': 'item', 'Quantity': 'quantity', 'Project': 'project', 'Date': 'requestDate' };
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
    const handleAddStock = () => {
      setShowAddStockModal(true);
    };

    const handleEditStock = (item) => {
      setEditingStockItem(item);
      setShowEditStockModal(true);
    };

    const handleDeleteStock = (id) => {
      console.log("Delete Stock clicked for id:", id);
      // Implement delete stock logic (e.g., confirmation dialog, update state)
      if (window.confirm("Are you sure you want to delete this stock item?")) {
        setStocks(stocks.filter(stock => stock.id !== id));
      }
    };

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
      case 'history':
        columns = ['Item', 'Quantity', 'Type', 'Date', 'Details'];
        const stockMovementHistory = [
          ...mockRequisitions.map(req => ({ item: req.item, quantity: req.quantity, type: 'out', date: req.requestDate, details: `Project: ${req.project}` })),
          ...mockDeliveries.map(del => ({ item: del.item, quantity: del.quantity, type: 'in', date: del.date, details: '' })),
          ...issuedStock.map(issue => ({ item: issue.item, quantity: issue.quantity, type: 'issued', date: issue.date, details: `To: ${issue.issuedTo}` })),
          ...damagedReturnedStock.map(dr => ({ item: dr.item, quantity: dr.quantity, type: dr.reason, date: dr.date, details: '' })),
        ];
        // Sort by date, newest first
        data = stockMovementHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
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
    <div className={`dashboard-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
       <style>{`
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
          height: 100vh; /* Use height instead of min-height for explicit sizing */

        }

        /* Sidebar */
        .sidebar {
          width: 250px;
          background-color: #141b5fff; /* Deep blue */
          color: #fff;
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: fixed;
          height: 73%;
          z-index: 400;
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
          height: 100%; /* Ensure main content takes full height of its parent */
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
          width: 100%;
          height: 100%; /* Occupy full height of its parent */
          /* Removed overflow-y: auto to prevent scrollbar */
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

        /* Status Badges */
        .status-badge {
          padding: 5px 12px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: capitalize;
        }

        .status-warning {
          background-color: #fff3e0;
          color: #ff9800;
        }

        .status-normal {
          background-color: #e8f5e9;
          color: #4caf50;
        }

        .report-options {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .report-content {
          margin-top: 20px;
        }

        .quick-action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          width: 90%;
          max-width: 500px;
          position: relative;
        }

        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #1a237e;
          font-size: 1.8rem;
        }

        .form-grid {
          display: grid;
          gap: 15px;
        }

        .form-grid label {
          font-weight: 600;
          color: #555;
        }

        .form-grid input[type="text"],
        .form-grid input[type="number"],
        .form-grid select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .form-grid input[type="text"]:focus,
        .form-grid input[type="number"]:focus,
        .form-grid select:focus {
          border-color: #1a237e;
          outline: none;
          box-shadow: 0 0 0 2px rgba(26, 35, 126, 0.2);
        }

        .modal-actions {
          margin-top: 25px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn-sm {
          padding: 8px 15px;
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .btn-info {
          background-color: #2196f3;
          color: white;
          border: none;
        }

        .btn-warning {
          background-color: #ff9800;
          color: white;
          border: none;
        }

        .btn-danger {
          background-color: #f44336;
          color: white;
          border: none;
        }

        .btn-primary {
          background-color: #1a237e;
          color: white;
          border: none;
        }

        .btn-info:hover { background-color: #1976d2; }
        .btn-warning:hover { background-color: #e68900; }
        .btn-danger:hover { background-color: #d32f2f; }
        .btn-primary:hover { background-color: #1565c0; }

        .clickable {
          cursor: pointer;
        }

        .form-grid-select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        @media (max-width: 600px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }

          .main-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .search-bar {
            width: 100%;
            max-width: none;
          }

          .report-options {
            flex-direction: column;
          }

          .quick-action-buttons {
            flex-direction: column;
          }

          .modal-content {
            padding: 20px;
          }
        }
      `}</style>
      <aside className="sidebar">
        <div className="sidebar-header">
                    {isSidebarOpen && (
            <>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#FFD600', // Example color
                marginRight: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1a237e', // Text color for inside the circle
                fontWeight: 'bold',
                fontSize: '0.8em'
              }}>
                {currentUserData ? currentUserData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2>{currentUserData ? currentUserData.name : 'User'}</h2>
            </>
          )}
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
              <FaBox /> {isSidebarOpen && <span>Stock</span>}
            </li>
            <li className={activeSection === 'requisitions' ? 'active' : ''} onClick={() => setActiveSection('requisitions')}>
              <FaClipboardList /> {isSidebarOpen && <span>Requisitions</span>}
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>
        {renderContent()}
      </main>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Stock</h3>
            <form onSubmit={handleAddStockSubmit} className="form-grid">
              <label>Item Name:</label>
              <input type="text" value={newStock.name} onChange={(e) => setNewStock({ ...newStock, name: e.target.value })} required />

              <label>Quantity:</label>
              <input type="number" value={newStock.quantity} onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })} required />

              <label>Unit Cost:</label>
              <input type="number" step="0.01" value={newStock.unitCost} onChange={(e) => setNewStock({ ...newStock, unitCost: parseFloat(e.target.value) })} required />

              <label>Supplier:</label>
              <input type="text" value={newStock.supplier} onChange={(e) => setNewStock({ ...newStock, supplier: e.target.value })} required />

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Add Stock</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowAddStockModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditStockModal && editingStockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Stock</h3>
            <form onSubmit={handleEditStockSubmit} className="form-grid">
              <label>Item Name:</label>
              <input type="text" value={editingStockItem.name} onChange={(e) => setEditingStockItem({ ...editingStockItem, name: e.target.value })} required />

              <label>Quantity:</label>
              <input type="number" value={editingStockItem.quantity} onChange={(e) => setEditingStockItem({ ...editingStockItem, quantity: parseInt(e.target.value) })} required />

              <label>Unit Cost:</label>
              <input type="number" step="0.01" value={editingStockItem.unitCost} onChange={(e) => setEditingStockItem({ ...editingStockItem, unitCost: parseFloat(e.target.value) })} required />

              <label>Supplier:</label>
              <input type="text" value={editingStockItem.supplier} onChange={(e) => setEditingStockItem({ ...editingStockItem, supplier: e.target.value })} required />

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowEditStockModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Stock Modal */}
      {showIssueStockModal && issuingStockItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Issue Stock: {issuingStockItem.name}</h3>
            <form onSubmit={handleIssueStockSubmit} className="form-grid">
              <label>Quantity to Issue:</label>
              <input type="number" value={issueDetails.quantity} onChange={(e) => setIssueDetails({ ...issueDetails, quantity: parseInt(e.target.value) })} max={issuingStockItem.quantity} required />

              <label>Issued To:</label>
              <input type="text" value={issueDetails.issuedTo} onChange={(e) => setIssueDetails({ ...issueDetails, issuedTo: e.target.value })} required />

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Issue Stock</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowIssueStockModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Item Modal */}
      {showRequestModal && requestingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request: {requestingItem.name}</h3>
            <form onSubmit={handleAddRequisitionSubmit} className="form-grid">
              <label>Quantity:</label>
              <input type="number" value={newRequisitionQuantity} onChange={(e) => setNewRequisitionQuantity(parseInt(e.target.value))} required />

              <label>Project:</label>
              <select value={newRequisitionProject} onChange={(e) => setNewRequisitionProject(e.target.value)} required>
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Submit Request</button>
                <button type="button" className="btn btn-danger" onClick={() => setShowRequestModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      

    </div>
  );
}
