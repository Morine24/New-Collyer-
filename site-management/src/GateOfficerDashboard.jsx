import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt, FaBars, FaSearch, FaTimes, FaUsers, FaPlus, FaHistory, FaFileAlt, FaDownload } from 'react-icons/fa';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from './firebase';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';

const mockWorkers = [
  { id: 'worker1', name: 'John Doe', status: 'out', history: [] },
  { id: 'worker2', name: 'Jane Smith', status: 'out', history: [] },
  { id: 'worker3', name: 'Peter Jones', status: 'out', history: [] },
  { id: 'worker4', name: 'Mary Williams', status: 'out', history: [] },
];

export default function GateOfficerDashboard({ currentUserData }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [workers, setWorkers] = useState(mockWorkers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredWorkers, setFilteredWorkers] = useState(mockWorkers);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWorkerHistory, setSelectedWorkerHistory] = useState(null);
  const [reportData] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const search = searchQuery.toLowerCase();
    const filtered = workers.filter(worker => 
      worker.name.toLowerCase().includes(search)
    );
    setFilteredWorkers(filtered);
  }, [searchQuery, workers]);

  const handleNavClick = (section) => {
    setActiveSection(section);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleCheckIn = (workerId) => {
    setWorkers(workers.map(w => 
      w.id === workerId 
        ? { ...w, status: 'in', history: [...w.history, { type: 'in', timestamp: new Date() }] } 
        : w
    ));
  };

  const handleCheckOut = (workerId) => {
    setWorkers(workers.map(w => 
      w.id === workerId 
        ? { ...w, status: 'out', history: [...w.history, { type: 'out', timestamp: new Date() }] } 
        : w
    ));
  };

  const handleAddNewWorker = (e) => {
    e.preventDefault();
    if (newWorkerName.trim() === '') return;
    const newWorker = {
      id: `worker${workers.length + 1}`,
      name: newWorkerName,
      status: 'out',
      history: [],
    };
    setWorkers([...workers, newWorker]);
    setNewWorkerName('');
    setShowAddWorkerModal(false);
  };

  const handleViewHistory = (worker) => {
    setSelectedWorkerHistory(worker);
    setShowHistoryModal(true);
  };

  const getLatestCheckIn = (history) => {
    const checkIns = history.filter(h => h.type === 'in');
    return checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp.toLocaleString() : 'N/A';
  };

  const getLatestCheckOut = (history) => {
    const checkOuts = history.filter(h => h.type === 'out');
    return checkOuts.length > 0 ? checkOuts[checkOuts.length - 1].timestamp.toLocaleString() : 'N/A';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }

    setIsUploading(true);
    const fileRef = ref(storage, `attendance-reports/${reportType}/${selectedFile.name}`);
    
    try {
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'attendanceReports'), {
        name: selectedFile.name,
        type: reportType,
        url: downloadURL,
        uploadedAt: serverTimestamp(),
      });

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report uploaded successfully!`);
      setSelectedFile(null); 
      document.getElementById('file-input').value = null;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadRegister = () => {
    if (workers.length === 0) {
      alert('No worker data to download.');
      return;
    }

    const headers = ['Name', 'Status', 'Last Check-In', 'Last Check-Out'];
    const csvData = workers.map(worker => [
      `"${worker.name}"`,
      `"${worker.status === 'in' ? 'Checked In' : 'Checked Out'}"`,
      `"${getLatestCheckIn(worker.history)}"`,
      `"${getLatestCheckOut(worker.history)}"`
    ].join(','));

    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'worker_register.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReports = () => (
    <div className="section-content">
      <div className="card">
        <h3>Attendance Reports</h3>
        <div className="reports-controls">
          <div className="control-group">
            <label>Report Type:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div className="control-group">
            <label>Upload {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report (CSV):</label>
            <input type="file" id="file-input" accept=".csv" onChange={handleFileSelect} />
          </div>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? 'Uploading...' : 'Done'}
          </button>
        </div>

        {reportData && (
          <div className="report-preview" style={{ marginTop: '20px' }}>
            <h4>Report Preview: {reportData.name}</h4>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
              {reportData.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="section-content">
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <h4>Workers Checked In</h4>
            <p className="summary-value">{workers.filter(w => w.status === 'in').length}</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <h4>Workers Checked Out</h4>
            <p className="summary-value">{workers.filter(w => w.status === 'out').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkerLog = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>Worker Log</h3>
          <div>
            <button className="btn btn-primary" onClick={() => setShowAddWorkerModal(true)} style={{ marginRight: '10px' }}>
              <FaPlus /> Add Worker
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadRegister}>
              <FaDownload /> Download Register
            </button>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Last Check-In</th>
                <th>Last Check-Out</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkers.map(worker => (
                <tr key={worker.id}>
                  <td>{worker.name}</td>
                  <td>
                    <span className={`status-badge status-${worker.status === 'in' ? 'approved' : 'declined'}`}>
                      {worker.status === 'in' ? 'Checked In' : 'Checked Out'}
                    </span>
                  </td>
                  <td>{getLatestCheckIn(worker.history)}</td>
                  <td>{getLatestCheckOut(worker.history)}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleCheckIn(worker.id)}
                      disabled={worker.status === 'in'}
                    >
                      Check In
                    </button>
                    <button 
                      className="btn btn-danger btn-sm" 
                      style={{ marginLeft: '8px' }}
                      onClick={() => handleCheckOut(worker.id)}
                      disabled={worker.status === 'out'}
                    >
                      Check Out
                    </button>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      style={{ marginLeft: '8px' }}
                      onClick={() => handleViewHistory(worker)}
                    >
                      <FaHistory /> History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'worker-log':
        return renderWorkerLog();
      case 'reports':
        return renderReports();
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
            {isSidebarOpen && <h1>{currentUserData ? currentUserData.name : 'Gate Officer'}</h1>}
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
              <a href="#" className={activeSection === 'worker-log' ? 'active' : ''} onClick={() => handleNavClick('worker-log')}>
                <FaUsers className="nav-icon" />
                {isSidebarOpen && <span>Worker Log</span>}
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

      <main className={`main-content ${isSidebarOpen ? '' : 'shifted'}`}>
        <header className="main-header">
          <button className="mobile-menu-button" onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </button>
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}</h1>
          <div className="header-actions">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search Worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>
        {renderContent()}
      </main>

      {showAddWorkerModal && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="card-header">
              <h3>Add New Worker</h3>
              <button className="btn btn-danger" onClick={() => setShowAddWorkerModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleAddNewWorker} className="form-grid">
              <div>
                <label>Worker Name:</label>
                <input 
                  type="text" 
                  value={newWorkerName} 
                  onChange={(e) => setNewWorkerName(e.target.value)} 
                  placeholder="Enter full name"
                  required 
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Worker</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddWorkerModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && selectedWorkerHistory && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="card-header">
              <h3>History for {selectedWorkerHistory.name}</h3>
              <button className="btn btn-danger" onClick={() => setShowHistoryModal(false)}><FaTimes /></button>
            </div>
            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWorkerHistory.history.length > 0 ? (
                    [...selectedWorkerHistory.history].reverse().map((log, index) => (
                      <tr key={index}>
                        <td>
                          <span className={`status-badge status-${log.type === 'in' ? 'approved' : 'declined'}`}>
                            {log.type === 'in' ? 'Checked In' : 'Checked Out'}
                          </span>
                        </td>
                        <td>{log.timestamp.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2">No history available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
