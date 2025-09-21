import React, { useState, useEffect } from 'react';
import { 
  FaBox, 
  FaPlus, 
  FaSave, 
  FaTimes, 
  FaDollarSign, 
  FaCalendarAlt, 
  FaProjectDiagram,
  FaReceipt,
  FaStore,
  FaWeightHanging,
  FaFileInvoiceDollar
} from 'react-icons/fa';
import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import './StockManagement.css';

const StockManagement = ({ userRole, currentUserData, projects = [], onStockUpdate }) => {
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [filteredStockItems, setFilteredStockItems] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newStockItem, setNewStockItem] = useState({
    itemName: '',
    description: '',
    quantity: '',
    unit: 'pieces',
    unitPrice: '',
    totalCost: '',
    supplier: '',
    projectName: '',
    category: 'Materials',
    receiptNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categories = [
    'Materials',
    'Tools',
    'Equipment',
    'Safety Gear',
    'Electrical',
    'Plumbing',
    'Hardware',
    'Paint & Finishes',
    'Concrete & Cement',
    'Other'
  ];

  const units = [
    'pieces', 'kg', 'g', 'tons', 'meters', 'feet', 'inches', 
    'liters', 'gallons', 'boxes', 'bags', 'rolls', 'sheets',
    'square meters', 'cubic meters', 'hours', 'days'
  ];

  useEffect(() => {
    fetchStockItems();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setFilteredStockItems(stockItems.filter(item => 
        item.projectName === selectedProject
      ));
    } else {
      setFilteredStockItems(stockItems);
    }
  }, [stockItems, selectedProject]);

  const fetchStockItems = async () => {
    try {
      const stockQuery = query(
        collection(db, 'stockItems'),
        orderBy('createdAt', 'desc')
      );
      const stockSnapshot = await getDocs(stockQuery);
      const stockData = stockSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        purchaseDate: doc.data().purchaseDate || new Date().toISOString().split('T')[0]
      }));
      setStockItems(stockData);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStockItem(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate total cost when quantity or unit price changes
      if (name === 'quantity' || name === 'unitPrice') {
        const quantity = parseFloat(name === 'quantity' ? value : updated.quantity) || 0;
        const unitPrice = parseFloat(name === 'unitPrice' ? value : updated.unitPrice) || 0;
        updated.totalCost = (quantity * unitPrice).toFixed(2);
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const stockData = {
        ...newStockItem,
        quantity: parseFloat(newStockItem.quantity),
        unitPrice: parseFloat(newStockItem.unitPrice),
        totalCost: parseFloat(newStockItem.totalCost),
        addedBy: currentUserData?.email || 'Unknown',
        addedByRole: userRole,
        addedByName: currentUserData?.firstName && currentUserData?.lastName 
          ? `${currentUserData.firstName} ${currentUserData.lastName}`
          : currentUserData?.email || 'Unknown User',
        createdAt: serverTimestamp(),
        status: 'In Stock'
      };

      await addDoc(collection(db, 'stockItems'), stockData);
      
      // Reset form
      setNewStockItem({
        itemName: '',
        description: '',
        quantity: '',
        unit: 'pieces',
        unitPrice: '',
        totalCost: '',
        supplier: '',
        projectName: '',
        category: 'Materials',
        receiptNumber: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: ''
      });

      setShowAddStockModal(false);
      fetchStockItems();
      
      // Notify parent component to refresh its data
      if (onStockUpdate) {
        onStockUpdate();
      }
      
    } catch (error) {
      console.error('Error adding stock item:', error);
      alert('Error adding stock item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProjectTotal = (projectName) => {
    return filteredStockItems
      .filter(item => item.projectName === projectName)
      .reduce((total, item) => total + (item.totalCost || 0), 0)
      .toFixed(2);
  };

  const getProjectStockSummary = () => {
    const summary = {};
    stockItems.forEach(item => {
      if (!summary[item.projectName]) {
        summary[item.projectName] = {
          totalCost: 0,
          itemCount: 0,
          categories: new Set()
        };
      }
      summary[item.projectName].totalCost += item.totalCost || 0;
      summary[item.projectName].itemCount += 1;
      summary[item.projectName].categories.add(item.category);
    });
    return summary;
  };

  return (
    <div className="stock-management">
      {/* Header */}
      <div className="stock-header">
        <div className="stock-title">
          <FaBox className="section-icon" />
          <h2>Stock Management</h2>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddStockModal(true)}
        >
          <FaPlus /> Add Stock Item
        </button>
      </div>

      {/* Project Filter */}
      <div className="stock-filters">
        <div className="filter-group">
          <label>Filter by Project:</label>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="form-select"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="stock-table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Cost</th>
              <th>Project</th>
              <th>Supplier</th>
              <th>Purchase Date</th>
              <th>Added By</th>
            </tr>
          </thead>
          <tbody>
            {filteredStockItems.map(item => (
              <tr key={item.id}>
                <td>
                  <div className="item-info">
                    <strong>{item.itemName}</strong>
                    {item.description && <small>{item.description}</small>}
                  </div>
                </td>
                <td>
                  <span className={`category-badge category-${item.category.toLowerCase().replace(/\s+/g, '-')}`}>
                    {item.category}
                  </span>
                </td>
                <td>{item.quantity} {item.unit}</td>
                <td>${item.unitPrice?.toFixed(2)}</td>
                <td>
                  <strong className="total-cost">${item.totalCost?.toFixed(2)}</strong>
                </td>
                <td>{item.projectName}</td>
                <td>{item.supplier}</td>
                <td>{new Date(item.purchaseDate).toLocaleDateString()}</td>
                <td>
                  <div className="added-by">
                    <small>{item.addedByName}</small>
                    <br />
                    <span className={`role-badge ${item.addedByRole?.toLowerCase()}`}>
                      {item.addedByRole}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStockItems.length === 0 && (
          <div className="empty-state">
            <FaBox className="empty-icon" />
            <p>No stock items found</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddStockModal(true)}
            >
              Add First Stock Item
            </button>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <div className="modal-overlay">
          <div className="modal-content stock-modal">
            <div className="modal-header">
              <h3><FaPlus /> Add Stock Item</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddStockModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="stock-form">
              <div className="form-row">
                <div className="form-group">
                  <label><FaBox /> Item Name *</label>
                  <input
                    type="text"
                    name="itemName"
                    value={newStockItem.itemName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter item name"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={newStockItem.category}
                    onChange={handleInputChange}
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newStockItem.description}
                  onChange={handleInputChange}
                  placeholder="Item description or specifications"
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaWeightHanging /> Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={newStockItem.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    name="unit"
                    value={newStockItem.unit}
                    onChange={handleInputChange}
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaDollarSign /> Unit Price *</label>
                  <input
                    type="number"
                    name="unitPrice"
                    value={newStockItem.unitPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label><FaFileInvoiceDollar /> Total Cost</label>
                  <input
                    type="number"
                    name="totalCost"
                    value={newStockItem.totalCost}
                    readOnly
                    className="calculated-field"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaProjectDiagram /> Project *</label>
                  <select
                    name="projectName"
                    value={newStockItem.projectName}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label><FaStore /> Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={newStockItem.supplier}
                    onChange={handleInputChange}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaReceipt /> Receipt Number</label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={newStockItem.receiptNumber}
                    onChange={handleInputChange}
                    placeholder="Receipt/Invoice number"
                  />
                </div>
                <div className="form-group">
                  <label><FaCalendarAlt /> Purchase Date *</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={newStockItem.purchaseDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={newStockItem.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes or comments"
                  rows="2"
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddStockModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : <><FaSave /> Add Item</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;