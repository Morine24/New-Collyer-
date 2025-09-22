import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaSignOutAlt, FaBars, FaSearch, FaTimes, FaUsers, FaPlus, FaHistory, FaFileAlt, FaDownload } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';
import './GateOfficerStyles.css';

const mockWorkers = [
  { id: 'worker1', name: 'John Doe', status: 'out', history: [] },
  { id: 'worker2', name: 'Jane Smith', status: 'out', history: [] },
  { id: 'worker3', name: 'Peter Jones', status: 'out', history: [] },
  { id: 'worker4', name: 'Mary Williams', status: 'out', history: [] },
];

const mockVisitors = [
  {
    id: 'visitor1',
    name: 'Robert Johnson',
    company: 'ABC Engineering',
    host: 'Mike Chen',
    reason: 'Site inspection meeting',
    idNumber: 'ID123456789',
    phone: '+1-555-0123',
    checkInTime: new Date('2025-09-21T08:30:00')
  },
  {
    id: 'visitor2',
    name: 'Sarah Williams',
    company: 'Quality Assurance Ltd',
    host: 'Lisa Park',
    reason: 'Quality control audit',
    idNumber: 'QA987654321',
    phone: '+1-555-0456',
    checkInTime: new Date('2025-09-21T09:15:00')
  },
  {
    id: 'visitor3',
    name: 'David Brown',
    company: 'Materials Supply Co.',
    host: 'Tom Wilson',
    reason: 'Material delivery coordination',
    idNumber: 'MS456789123',
    phone: '+1-555-0789',
    checkInTime: new Date('2025-09-21T10:00:00')
  }
];

export default function GateOfficerDashboard({ currentUserData }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Open by default on tablet/desktop (>=768px), closed on smaller
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
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

  // New state for visitors
  const [visitors, setVisitors] = useState([]);
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorReason, setNewVisitorReason] = useState('');
  const [newVisitorCompany, setNewVisitorCompany] = useState('');
  const [newVisitorHost, setNewVisitorHost] = useState('');
  const [newVisitorPhone, setNewVisitorPhone] = useState('');
  const [newVisitorIdNumber, setNewVisitorIdNumber] = useState('');
  const [newVisitorCheckInTime, setNewVisitorCheckInTime] = useState('');
  const [visitorSearchQuery, setVisitorSearchQuery] = useState('');
  const [filteredVisitors, setFilteredVisitors] = useState([]);

  // Fetch visitors from Firebase
  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const visitorsCollection = collection(db, 'visitors');
        const visitorSnapshot = await getDocs(visitorsCollection);
        const visitorList = visitorSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          checkInTime: doc.data().checkInTime?.toDate ? doc.data().checkInTime.toDate() : new Date(doc.data().checkInTime),
          checkOutTime: doc.data().checkOutTime?.toDate ? doc.data().checkOutTime.toDate() : (doc.data().checkOutTime ? new Date(doc.data().checkOutTime) : null)
        }));
        setVisitors(visitorList);
      } catch (error) {
        console.error('Error fetching visitors:', error);
        // Fallback to mock data if Firebase fails
        setVisitors(mockVisitors);
      }
    };

    fetchVisitors();
  }, []);

  // Handle responsive sidebar - follows AdminDashboard pattern
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // Desktop: Keep sidebar open
        setIsSidebarOpen(true);
      } else {
        // Mobile: Keep sidebar closed by default
        setIsSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const search = searchQuery.toLowerCase();
    const filtered = workers.filter(worker => 
      worker.name.toLowerCase().includes(search)
    );
    setFilteredWorkers(filtered);
  }, [searchQuery, workers]);

  useEffect(() => {
    const search = visitorSearchQuery.toLowerCase();
    const filtered = visitors.filter(visitor =>
      visitor.name.toLowerCase().includes(search)
    );
    setFilteredVisitors(filtered);
  }, [visitorSearchQuery, visitors]);

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

  const handleAddNewVisitor = async (e) => {
    e.preventDefault();
    if (newVisitorName.trim() === '' || newVisitorReason.trim() === '') return;
    
    const checkInTime = newVisitorCheckInTime ? new Date(newVisitorCheckInTime) : new Date();
    
    const newVisitor = {
      name: newVisitorName,
      reason: newVisitorReason,
      company: newVisitorCompany,
      host: newVisitorHost,
      phone: newVisitorPhone,
      idNumber: newVisitorIdNumber,
      checkInTime: checkInTime,
      checkOutTime: null,
      status: 'On-site',
      createdAt: serverTimestamp()
    };

    try {
      // Save to Firebase
      const docRef = await addDoc(collection(db, 'visitors'), newVisitor);
      
      // Update local state with Firebase-generated ID
      const visitorWithId = { ...newVisitor, id: docRef.id };
      setVisitors([...visitors, visitorWithId]);
      
      console.log('Visitor added successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error adding visitor:', error);
    }

    setNewVisitorName('');
    setNewVisitorReason('');
    setNewVisitorCompany('');
    setNewVisitorHost('');
    setNewVisitorPhone('');
    setNewVisitorIdNumber('');
    setNewVisitorCheckInTime('');
    setShowAddVisitorModal(false);
  };

  const handleCheckOutVisitor = async (visitorId) => {
    try {
      // Update Firebase document with checkout time and status
      const visitorRef = doc(db, 'visitors', visitorId);
      await updateDoc(visitorRef, {
        checkOutTime: new Date(),
        status: 'Checked out'
      });
      
      // Update local state
      setVisitors(visitors.map(v => 
        v.id === visitorId 
          ? { ...v, checkOutTime: new Date(), status: 'Checked out' }
          : v
      ));
      
      console.log('Visitor checked out successfully');
    } catch (error) {
      console.error('Error checking out visitor:', error);
    }
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
    
    try {
      console.log('Starting file upload to Firestore...', selectedFile.name);
      
      // Read file content as text
      const fileContent = await selectedFile.text();
      
      // Create a unique filename to avoid conflicts
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${selectedFile.name}`;
      
      // Save file content and metadata directly to Firestore
      const docRef = await addDoc(collection(db, 'attendanceReports'), {
        name: selectedFile.name,
        originalName: selectedFile.name,
        fileName: fileName,
        type: reportType,
        content: fileContent, // Store file content directly in Firestore
        size: selectedFile.size,
        mimeType: selectedFile.type,
        uploadedAt: serverTimestamp(),
        uploadedBy: 'gate-officer',
        storageMethod: 'firestore' // Flag to indicate storage method
      });
      
      console.log('File content saved to Firestore:', docRef.id);

      alert(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report uploaded successfully!`);
      setSelectedFile(null); 
      document.getElementById('file-input').value = null;
      
      // Update report data for preview
      setReportData({
        name: selectedFile.name,
        content: fileContent.substring(0, 500) + (fileContent.length > 500 ? '...' : '')
      });
      
    } catch (error) {
      console.error("Detailed error uploading file:", error);
      
      if (error.message.includes('quota')) {
        alert("Upload failed: Storage quota exceeded. Please contact administrator.");
      } else if (error.message.includes('permission')) {
        alert("Upload failed: Permission denied. Please contact administrator.");
      } else {
        alert(`File upload failed: ${error.message}`);
      }
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

  const renderVisitorManagement = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
            <h3>Visitor Management</h3>
            <button className="btn btn-primary" onClick={() => setShowAddVisitorModal(true)}>
                <FaPlus /> Add Visitor
            </button>
        </div>
        <div className="search-bar" style={{ marginBottom: '20px' }}>
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={visitorSearchQuery}
              onChange={(e) => setVisitorSearchQuery(e.target.value)}
            />
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Host</th>
                <th>Reason for Visit</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th>Check-in Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map(visitor => (
                <tr key={visitor.id}>
                  <td>{visitor.name}</td>
                  <td>{visitor.company}</td>
                  <td>{visitor.host}</td>
                  <td>{visitor.reason}</td>
                  <td>{visitor.idNumber}</td>
                  <td>{visitor.phone}</td>
                  <td>{visitor.checkInTime.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${visitor.status === 'On-site' ? 'approved' : 'completed'}`}>
                      {visitor.status}
                    </span>
                  </td>
                  <td>
                    {visitor.status === 'On-site' && (
                        <button className="btn btn-danger" onClick={() => handleCheckOutVisitor(visitor.id)}>
                        Check Out
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
            {isUploading ? 'Uploading...' : 'Add'}
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
        <div className="summary-card workers-in">
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <h4>Workers Checked In</h4>
            <p className="summary-value">{workers.filter(w => w.status === 'in').length}</p>
          </div>
        </div>
        <div className="summary-card workers-out">
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <h4>Workers Checked Out</h4>
            <p className="summary-value">{workers.filter(w => w.status === 'out').length}</p>
          </div>
        </div>
        <div className="summary-card visitors-today">
          <div className="summary-icon"><FaUsers /></div>
          <div className="summary-content">
            <h4>Visitors On-site</h4>
            <p className="summary-value">{visitors.filter(v => v.status === 'On-site').length}</p>
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
      case 'visitors':
        return renderVisitorManagement();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
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
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'worker-log' ? 'active' : ''} onClick={() => handleNavClick('worker-log')}>
                <FaUsers className="nav-icon" />
                <span>Worker Log</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'visitors' ? 'active' : ''} onClick={() => handleNavClick('visitors')}>
                <FaUsers className="nav-icon" />
                <span>Visitor Management</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'reports' ? 'active' : ''} onClick={() => handleNavClick('reports')}>
                <FaFileAlt className="nav-icon" />
                <span>Reports</span>
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

      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <main className="main-content">
        <header className="main-header">
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}</h1>
          <div className="header-actions">
            <div className="user-profile">
                <img src={logo} alt="User" />
                <span>{currentUserData?.name}</span>
            </div>
          </div>
        </header>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </div>
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

      {showAddVisitorModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowAddVisitorModal(false)}><FaTimes /></span>
            <h3>Add New Visitor</h3>
            <form onSubmit={handleAddNewVisitor}>
              <div className="form-group">
                <label>Visitor Name</label>
                <input
                  type="text"
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={newVisitorCompany}
                  onChange={(e) => setNewVisitorCompany(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Host (Person to Visit)</label>
                <input
                  type="text"
                  value={newVisitorHost}
                  onChange={(e) => setNewVisitorHost(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ID Number</label>
                <input
                  type="text"
                  value={newVisitorIdNumber}
                  onChange={(e) => setNewVisitorIdNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={newVisitorPhone}
                  onChange={(e) => setNewVisitorPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Check In Time</label>
                <input
                  type="datetime-local"
                  value={newVisitorCheckInTime}
                  onChange={(e) => setNewVisitorCheckInTime(e.target.value)}
                  placeholder="Leave empty for current time"
                />
              </div>
              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea
                  value={newVisitorReason}
                  onChange={(e) => setNewVisitorReason(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Add Visitor</button>
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
