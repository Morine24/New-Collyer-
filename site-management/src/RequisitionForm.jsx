
import React, { useState } from 'react';
import './RequisitionForm.css';

const RequisitionForm = ({ onClose, onSubmit, projects }) => {
  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    category: '',
    items: '',
    quantity: '',
    unitOfMeasure: '',
    reasonForRequest: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const mockCategories = {
    'Site Equipment': ['Excavator', 'Bulldozer', 'Crane', 'Loader', 'Forklift', 'Generator', 'Welding Machine'],
    'Power Tools': ['Drill', 'Saw', 'Grinder', 'Sander', 'Nail Gun', 'Heat Gun'],
    'Hand Tools': ['Hammer', 'Screwdriver', 'Wrench', 'Pliers', 'Tape Measure', 'Level'],
    'Safety Gear': ['Hard Hat', 'Safety Glasses', 'Gloves', 'Boots', 'Harness', 'Respirator'],
    'Building Materials': ['Cement', 'Sand', 'Gravel', 'Bricks', 'Steel Bars', 'Lumber', 'Plywood'],
    'Plumbing': ['Pipes', 'Fittings', 'Valves', 'Toilets', 'Sinks', 'Faucets'],
    'Electrical': ['Wires', 'Cables', 'Switches', 'Outlets', 'Circuit Breakers', 'Light Fixtures'],
    'Office Supplies': ['Pens', 'Paper', 'Stapler', 'Printer', 'Ink Cartridges', 'Folders'],
  };

  const [selectedCategory, setSelectedCategory] = useState('');
  const [items, setItems] = useState([]);

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setItems(mockCategories[category] || []);
    setFormData({ ...formData, category, items: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="requisition-form-container">
      <h2>Create New Requisition</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="projectName">Project Name</label>
          <select
            id="projectName"
            name="projectName"
            value={formData.projectName}
            onChange={handleChange}
            required
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.name}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={selectedCategory}
            onChange={handleCategoryChange}
            required
          >
            <option value="">Select a category</option>
            {Object.keys(mockCategories).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="items">Items</label>
          <select
            id="items"
            name="items"
            value={formData.items}
            onChange={handleChange}
            required
            disabled={!selectedCategory}
          >
            <option value="">Select an item</option>
            {items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="unitOfMeasure">Unit of Measure</label>
          <select
            id="unitOfMeasure"
            name="unitOfMeasure"
            value={formData.unitOfMeasure}
            onChange={handleChange}
            required
          >
            <option value="">Select a unit</option>
            <option value="pcs">Pieces</option>
            <option value="kg">Kilograms</option>
            <option value="liters">Liters</option>
            <option value="meters">Meters</option>
            <option value="bags">Bags</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="reasonForRequest">Reason for Request</label>
          <textarea
            id="reasonForRequest"
            name="reasonForRequest"
            value={formData.reasonForRequest}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            readOnly
          />
        </div>
        <button type="submit">Submit</button>
        <button type="button" className="btn-danger" onClick={onClose}>Close</button>
      </form>
    </div>
  );
};

export default RequisitionForm;
