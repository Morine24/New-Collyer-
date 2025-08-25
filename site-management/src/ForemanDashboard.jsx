import React, { useState, useEffect } from 'react';
import './ForemanDashboard.css';

const ForemanDashboard = ({ currentUserData }) => {
  const [requests, setRequests] = useState([
    { id: 1, item: 'Cement', quantity: 10, status: 'Pending' },
    { id: 2, item: 'Sand', quantity: 5, status: 'Approved' },
    { id: 3, item: 'Gravel', quantity: 8, status: 'Cancelled' },
    { id: 4, item: 'Bricks', quantity: 100, status: 'Approved' },
  ]);
  const [newItem, setNewItem] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const [stock, setStock] = useState([
    { id: 1, item: 'Cement', quantity: 100 },
    { id: 2, item: 'Sand', quantity: 50 },
    { id: 3, item: 'Bricks', quantity: 500 },
  ]);

  const [notifications, setNotifications] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);

  useEffect(() => {
    const filteredNotifications = requests.filter(
      (request) => request.status === 'Approved' || request.status === 'Cancelled'
    );
    setNotifications(filteredNotifications);

    const filteredUsageHistory = requests.filter(
      (request) => request.status === 'Approved'
    );
    setUsageHistory(filteredUsageHistory);
  }, [requests]);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (newItem && newQuantity) {
      const newRequest = {
        id: requests.length + 1,
        item: newItem,
        quantity: parseInt(newQuantity),
        status: 'Pending',
      };
      setRequests([...requests, newRequest]);
      setNewItem('');
      setNewQuantity('');
    }
  };

  const handleRequestFromStock = (item) => {
    setNewItem(item.item);
  };

  return (
    <div className="foreman-dashboard">
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#FFD600', // Example color
        marginRight: '3px',
        display: 'inline-flex', // Use inline-flex to keep it on the same line as h1
        alignItems: 'center',
        justifyContent: 'center',
        color: '#1a237e', // Text color for inside the circle
        fontWeight: 'bold',
        fontSize: '0.8em'
      }}>
        {currentUserData ? currentUserData.name.charAt(0).toUpperCase() : 'F'}
      </div>
      <h1>{currentUserData ? currentUserData.name : 'Foreman'} Dashboard</h1>

      {/* My Requests Section */}
      <section>
        <h2>My Requests</h2>
        <form onSubmit={handleRequestSubmit}>
          <input
            type="text"
            placeholder="Item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
          />
          <button type="submit">Add Request</button>
        </form>
        <ul>
          {requests.map((request) => (
            <li key={request.id}>
              <span>
                {request.item} - {request.quantity}
              </span>
              <span className={`status-${request.status.toLowerCase()}`}>
                {request.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Stock Section */}
      <section>
        <h2>Stock</h2>
        <ul>
          {stock.map((item) => (
            <li key={item.id}>
              <span>
                {item.item} - {item.quantity}
              </span>
              <button onClick={() => handleRequestFromStock(item)}>Request</button>
            </li>
          ))}
        </ul>
      </section>

      {/* Notifications Section */}
      <section>
        <h2>Notifications</h2>
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id}>
              Request for {notification.item} has been {notification.status}.
            </li>
          ))}
        </ul>
      </section>

      {/* Reports Section */}
      <section>
        <h2>Reports</h2>
        <ul>
          {usageHistory.map((item) => (
            <li key={item.id}>
              {item.item} - {item.quantity}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ForemanDashboard;
