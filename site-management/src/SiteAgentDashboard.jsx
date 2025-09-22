import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaClipboardList, 
  FaUsers, 
  FaBox, 
  FaFileAlt, 
  FaPlus, 
  FaEdit, 
  FaEye, 
  FaTruck, 
  FaFilter, 
  FaDollarSign, 
  FaDownload, 
  FaBars, 
  FaTimes,
  FaSignOutAlt, 
  FaCalendarAlt, 
  FaCheck,
  FaSearch,
  FaCamera,
  FaVideo,
  FaUpload,
  FaTrash,
  FaFileImage,
  FaClock,
  FaTools,
  FaSave
} from 'react-icons/fa';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import SearchBar from './SearchBar';
import StockManagement from './StockManagement';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';
import './SiteAgentStyles.css';

const SiteAgentDashboard = ({ currentUserData }) => {
  const navigate = useNavigate();
  const auth = getAuth();
  
  // State management
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states
  const [requisitions, setRequisitions] = useState([]);
  const [personnelRequests, setPersonnelRequests] = useState([]); // Requests from personnel below
  const [myRequests, setMyRequests] = useState([]); // Site Agent's own requests
  const [stocks, setStocks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [laborCosts, setLaborCosts] = useState([]);
  const [attendanceReports, setAttendanceReports] = useState([]);
  const [workReports, setWorkReports] = useState([]);
  
  // Filtered data
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [filteredPersonnelRequests, setFilteredPersonnelRequests] = useState([]);
  const [filteredMyRequests, setFilteredMyRequests] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filteredWorkReports, setFilteredWorkReports] = useState([]);
  
  // Modal states
  const [showAddRequisitionModal, setShowAddRequisitionModal] = useState(false);
  const [showPersonnelRequestsModal, setShowPersonnelRequestsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalComments, setApprovalComments] = useState('');
  const [showLaborPaymentModal, setShowLaborPaymentModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Form states
  const [newRequisition, setNewRequisition] = useState({
    item: '',
    description: '',
    quantity: '',
    unit: 'pieces',
    unitPrice: '',
    supplier: '',
    projectName: '',
    category: '',
    subCategory: '',
    reasonForRequest: '',
    urgency: 'normal',
    expectedDeliveryDate: '',
    specifications: '',
    brand: '',
    model: '',
    location: '',
    requestedBy: '',
    departmentHead: ''
  });

  // Work Report Form state
  const [newWorkReport, setNewWorkReport] = useState({
    reportType: 'daily', // daily or weekly
    reportDate: new Date().toISOString().split('T')[0],
    weekStartDate: '',
    weekEndDate: '',
    projectName: '',
    workDescription: '',
    tasksCompleted: '',
    tasksInProgress: '',
    tasksPlanned: '',
    materialsUsed: [{ item: '', quantity: '', unit: 'pieces', cost: '' }],
    equipmentUsed: '',
    laborDetails: '',
    workersPresent: '',
    workHours: '',
    weatherConditions: '',
    challenges: '',
    recommendations: '',
    nextDayPlan: '',
    photos: [],
    videos: [],
    notes: ''
  });

  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all requisitions
      const requisitionsCollection = collection(db, 'requisitions');
      const requisitionSnapshot = await getDocs(requisitionsCollection);
      const requisitionList = requisitionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Separate requisitions based on requester role and status
      const myReqs = requisitionList.filter(req => 
        req.requesterRole === 'Site Agent' && req.requesterName === (currentUserData?.name || 'Site Agent')
      );
      
      const personnelReqs = requisitionList.filter(req => 
        req.requesterRole !== 'Site Agent' && 
        req.requesterRole !== 'Admin' && 
        (req.status === 'pending' || req.status === 'site-agent-approved')
      );
      
      setRequisitions(requisitionList);
      setMyRequests(myReqs);
      setPersonnelRequests(personnelReqs);

      // Fetch stocks
      const stockCollection = collection(db, 'stockItems');
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);

      // Fetch projects
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);

      // Fetch labor costs
      const laborCostsCollection = collection(db, 'laborCosts');
      const laborSnapshot = await getDocs(laborCostsCollection);
      const laborList = laborSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLaborCosts(laborList);

      // Fetch attendance reports
      const attendanceCollection = collection(db, 'attendanceReports');
      const attendanceSnapshot = await getDocs(attendanceCollection);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceReports(attendanceList);

      // Fetch work reports
      const workReportsCollection = collection(db, 'workReports');
      const workReportsSnapshot = await getDocs(workReportsCollection);
      const workReportsList = workReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkReports(workReportsList);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Filter data based on search query
  useEffect(() => {
    const search = searchQuery.toLowerCase();

    const filteredReqs = requisitions.filter(req => {
      const item = req.item ? req.item.toLowerCase() : '';
      const project = req.projectName ? req.projectName.toLowerCase() : '';
      const status = req.status ? req.status.toLowerCase() : '';
      return item.includes(search) || project.includes(search) || status.includes(search);
    });
    setFilteredRequisitions(filteredReqs);

    const filteredMyReqs = myRequests.filter(req => {
      const item = req.item ? req.item.toLowerCase() : '';
      const project = req.projectName ? req.projectName.toLowerCase() : '';
      const status = req.status ? req.status.toLowerCase() : '';
      return item.includes(search) || project.includes(search) || status.includes(search);
    });
    setFilteredMyRequests(filteredMyReqs);

    const filteredPersonnelReqs = personnelRequests.filter(req => {
      const item = req.item ? req.item.toLowerCase() : '';
      const project = req.projectName ? req.projectName.toLowerCase() : '';
      const requester = req.requesterName ? req.requesterName.toLowerCase() : '';
      const status = req.status ? req.status.toLowerCase() : '';
      return item.includes(search) || project.includes(search) || requester.includes(search) || status.includes(search);
    });
    setFilteredPersonnelRequests(filteredPersonnelReqs);

    const filteredStks = stocks.filter(stock => {
      const name = stock.name ? stock.name.toLowerCase() : '';
      const supplier = stock.supplier ? stock.supplier.toLowerCase() : '';
      return name.includes(search) || supplier.includes(search);
    });
    setFilteredStocks(filteredStks);

    const filteredProjs = projects.filter(project => {
      const name = project.name ? project.name.toLowerCase() : '';
      const status = project.status ? project.status.toLowerCase() : '';
      return name.includes(search) || status.includes(search);
    });
    setFilteredProjects(filteredProjs);

    const filteredReports = workReports.filter(report => {
      const project = report.projectName ? report.projectName.toLowerCase() : '';
      const type = report.reportType ? report.reportType.toLowerCase() : '';
      const description = report.workDescription ? report.workDescription.toLowerCase() : '';
      return project.includes(search) || type.includes(search) || description.includes(search);
    });
    setFilteredWorkReports(filteredReports);

  }, [searchQuery, requisitions, myRequests, personnelRequests, stocks, projects, workReports]);

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

  // Navigation handler function - follows AdminDashboard pattern
  const handleNavigation = (section) => {
    setActiveSection(section);
    // Close mobile sidebar after navigation
    if (window.innerWidth <= 768) {
      setTimeout(() => setIsSidebarOpen(false), 100);
    }
  };

  // Close mobile sidebar when clicking outside or changing sections
  useEffect(() => {
    const handleClickOutside = () => {
      if (window.innerWidth <= 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSidebarOpen]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Requisition handlers
  const handleAddRequisition = async (e) => {
    e.preventDefault();
    try {
      const requisitionData = {
        ...newRequisition,
        requesterName: currentUserData?.name || 'Site Agent',
        requesterRole: 'Site Agent',
        status: 'pending',
        requestDate: new Date().toISOString().split('T')[0],
        submittedAt: serverTimestamp(),
        totalCost: parseFloat(newRequisition.quantity) * parseFloat(newRequisition.unitPrice || 0)
      };

      await addDoc(collection(db, 'requisitions'), requisitionData);
      
      // Refresh requisitions
      fetchAllData();
      
      // Reset form
      setNewRequisition({
        item: '',
        description: '',
        quantity: '',
        unit: 'pieces',
        unitPrice: '',
        supplier: '',
        projectName: '',
        category: '',
        subCategory: '',
        reasonForRequest: '',
        urgency: 'normal',
        expectedDeliveryDate: '',
        specifications: '',
        brand: '',
        model: '',
        location: '',
        requestedBy: '',
        departmentHead: ''
      });
      setShowAddRequisitionModal(false);
      alert('Requisition submitted successfully!');
    } catch (error) {
      console.error('Error adding requisition:', error);
      alert('Failed to submit requisition.');
    }
  };

  const handleRequisitionChange = (e) => {
    setNewRequisition({
      ...newRequisition,
      [e.target.name]: e.target.value
    });
  };

  // Approval functions
  const handleApproveRequest = async (requestId, action) => {
    try {
      const requestRef = doc(db, 'requisitions', requestId);
      
      let newStatus;
      let approvalData = {
        siteAgentApprovalDate: new Date().toISOString(),
        siteAgentApprovalBy: currentUserData?.name || 'Site Agent',
        siteAgentComments: approvalComments
      };

      if (action === 'approve') {
        newStatus = 'site-agent-approved'; // Will be visible to Admin for final approval
        approvalData.status = newStatus;
      } else if (action === 'reject') {
        newStatus = 'site-agent-rejected';
        approvalData.status = newStatus;
        approvalData.rejectionReason = approvalComments;
      }

      await updateDoc(requestRef, approvalData);
      
      // Refresh data
      fetchAllData();
      
      // Close modal and reset
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setApprovalComments('');
      
      alert(`Request ${action}d successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      alert(`Failed to ${action} request.`);
    }
  };

  const openApprovalModal = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  // Work Report handlers
  const handleReportChange = (e) => {
    const { name, value } = e.target;
    setNewWorkReport({
      ...newWorkReport,
      [name]: value
    });
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...newWorkReport.materialsUsed];
    updatedMaterials[index][field] = value;
    setNewWorkReport({
      ...newWorkReport,
      materialsUsed: updatedMaterials
    });
  };

  const addMaterialRow = () => {
    setNewWorkReport({
      ...newWorkReport,
      materialsUsed: [...newWorkReport.materialsUsed, { item: '', quantity: '', unit: 'pieces', cost: '' }]
    });
  };

  const removeMaterialRow = (index) => {
    const updatedMaterials = newWorkReport.materialsUsed.filter((_, i) => i !== index);
    setNewWorkReport({
      ...newWorkReport,
      materialsUsed: updatedMaterials
    });
  };

  const handleMediaUpload = async (e, mediaType) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingMedia(true);
    
    try {
      // For now, we'll store file names. In production, you'd upload to Firebase Storage
      const mediaUrls = files.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for preview
        type: file.type,
        size: file.size
      }));

      if (mediaType === 'photos') {
        setNewWorkReport({
          ...newWorkReport,
          photos: [...newWorkReport.photos, ...mediaUrls]
        });
      } else if (mediaType === 'videos') {
        setNewWorkReport({
          ...newWorkReport,
          videos: [...newWorkReport.videos, ...mediaUrls]
        });
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload media files.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index, mediaType) => {
    if (mediaType === 'photos') {
      const updatedPhotos = newWorkReport.photos.filter((_, i) => i !== index);
      setNewWorkReport({
        ...newWorkReport,
        photos: updatedPhotos
      });
    } else if (mediaType === 'videos') {
      const updatedVideos = newWorkReport.videos.filter((_, i) => i !== index);
      setNewWorkReport({
        ...newWorkReport,
        videos: updatedVideos
      });
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const reportData = {
        ...newWorkReport,
        submittedBy: currentUserData?.name || 'Site Agent',
        submittedRole: 'Site Agent',
        submittedAt: serverTimestamp(),
        status: 'submitted'
      };

      await addDoc(collection(db, 'workReports'), reportData);
      
      // Refresh reports
      fetchAllData();
      
      // Reset form
      setNewWorkReport({
        reportType: 'daily',
        reportDate: new Date().toISOString().split('T')[0],
        weekStartDate: '',
        weekEndDate: '',
        projectName: '',
        workDescription: '',
        tasksCompleted: '',
        tasksInProgress: '',
        tasksPlanned: '',
        materialsUsed: [{ item: '', quantity: '', unit: 'pieces', cost: '' }],
        equipmentUsed: '',
        laborDetails: '',
        workersPresent: '',
        workHours: '',
        weatherConditions: '',
        challenges: '',
        recommendations: '',
        nextDayPlan: '',
        photos: [],
        videos: [],
        notes: ''
      });
      
      setShowReportModal(false);
      alert('Work report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit work report.');
    }
  };

  // Render functions for different sections
  const renderDashboard = () => {
    console.log('Rendering dashboard, activeSection:', activeSection);
    console.log('Requisitions:', requisitions);
    console.log('Stocks:', stocks);
    console.log('Labor costs:', laborCosts);
    console.log('Attendance reports:', attendanceReports);
    
    return (
      <div className="section-content">
        <div className="summary-cards">
        <div className="summary-card">
          <div className="card-header">
            <h3>My Requests</h3>
            <FaClipboardList className="card-icon" />
          </div>
          <div className="card-metric">
            <span className="metric-number">{myRequests.length}</span>
            <span className="metric-label">Requests I've made</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-header">
            <h3>Personnel Requests</h3>
            <FaUsers className="card-icon" />
          </div>
          <div className="card-metric">
            <span className="metric-number">{personnelRequests.filter(req => req.status === 'pending').length}</span>
            <span className="metric-label">Awaiting my approval</span>
          </div>
        </div>        <div className="summary-card">
          <div className="card-header">
            <h3>Work Reports</h3>
            <FaFileAlt className="card-icon" />
          </div>
          <div className="card-metric">
            <span className="metric-number">{workReports.length}</span>
            <span className="metric-label">Reports submitted</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-header">
            <h3>Total Labor Costs</h3>
            <FaDollarSign className="card-icon" />
          </div>
          <div className="card-metric">
            <span className="metric-number">Ksh{laborCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0).toLocaleString()}</span>
            <span className="metric-label">Payments processed</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Personnel Requests Awaiting Approval</h3>
          <button 
            className="btn btn-info" 
            onClick={() => setShowPersonnelRequestsModal(true)}
          >
            <FaEye /> View All
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Project</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {personnelRequests.filter(req => req.status === 'pending').slice(0, 5).map(req => (
                <tr key={req.id}>
                  <td>{req.item}</td>
                  <td>{req.requesterName}</td>
                  <td>{req.requesterRole}</td>
                  <td>{req.projectName}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>{req.requestDate}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => openApprovalModal(req)}
                      title="Review Request"
                    >
                      <FaCheck /> Review
                    </button>
                  </td>
                </tr>
              ))}
              {personnelRequests.filter(req => req.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No pending requests from personnel
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const renderRequisitions = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>My Requisitions</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddRequisitionModal(true)}
          >
            <FaPlus /> Create New Request
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Cost</th>
                <th>Project</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMyRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.item}</td>
                  <td>{req.description}</td>
                  <td>{req.quantity} {req.unit}</td>
                  <td>Ksh{(req.unitPrice || 0).toLocaleString()}</td>
                  <td>
                    <strong>Ksh{((req.quantity * req.unitPrice) || 0).toLocaleString()}</strong>
                  </td>
                  <td>{req.projectName}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status === 'site-agent-approved' ? 'Pending Admin' : req.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-info" title="View Details">
                        <FaEye />
                      </button>
                      {req.status === 'pending' && (
                        <button className="btn btn-sm btn-warning" title="Edit">
                          <FaEdit />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMyRequests.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No requisitions found. Create your first request!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Personnel Requests Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3>Personnel Requests to Review</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="status-badge status-pending">
              {personnelRequests.filter(req => req.status === 'pending').length} Pending Review
            </span>
            <span className="status-badge status-approved">
              {personnelRequests.filter(req => req.status === 'site-agent-approved').length} Approved by Me
            </span>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Requested By</th>
                <th>Role</th>
                <th>Quantity</th>
                <th>Total Cost</th>
                <th>Project</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonnelRequests.map(req => (
                <tr key={req.id}>
                  <td>{req.item}</td>
                  <td>{req.requesterName}</td>
                  <td>
                    <span className="role-badge">{req.requesterRole}</span>
                  </td>
                  <td>{req.quantity} {req.unit}</td>
                  <td>
                    <strong>Ksh{((req.quantity * req.unitPrice) || 0).toLocaleString()}</strong>
                  </td>
                  <td>{req.projectName}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status === 'site-agent-approved' ? 'Forwarded to Admin' : req.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-info" title="View Details">
                        <FaEye />
                      </button>
                      {req.status === 'pending' && (
                        <button 
                          className="btn btn-sm btn-success" 
                          onClick={() => openApprovalModal(req)}
                          title="Review & Approve"
                        >
                          <FaCheck /> Review
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPersonnelRequests.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No personnel requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>Work Reports</h3>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowReportModal(true)}
          >
            <FaPlus /> Create New Report
          </button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Project</th>
                <th>Work Description</th>
                <th>Photos</th>
                <th>Videos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkReports.map(report => (
                <tr key={report.id}>
                  <td>
                    {report.reportType === 'weekly' 
                      ? `${report.weekStartDate} - ${report.weekEndDate}`
                      : report.reportDate
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${report.reportType === 'daily' ? 'status-pending' : 'status-approved'}`}>
                      {report.reportType}
                    </span>
                  </td>
                  <td>{report.projectName}</td>
                  <td>{report.workDescription?.substring(0, 50)}...</td>
                  <td>
                    <span className="media-count">
                      <FaCamera /> {report.photos?.length || 0}
                    </span>
                  </td>
                  <td>
                    <span className="media-count">
                      <FaVideo /> {report.videos?.length || 0}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge status-delivered">
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-info" title="View Report">
                        <FaEye />
                      </button>
                      <button className="btn btn-sm btn-warning" title="Edit">
                        <FaEdit />
                      </button>
                      <button className="btn btn-sm btn-success" title="Download">
                        <FaDownload />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorkReports.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No work reports found. Create your first report!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStock = () => (
    <StockManagement 
      userRole="Site Agent"
      currentUserData={currentUserData}
      projects={projects}
    />
  );

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
            {isSidebarOpen && <h1>Site Agent</h1>}
          </div>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a 
                href="#" 
                className={activeSection === 'dashboard' ? 'active' : ''} 
                onClick={() => handleNavigation('dashboard')}
              >
                <FaHome className="nav-icon" />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeSection === 'requisitions' ? 'active' : ''} 
                onClick={() => handleNavigation('requisitions')}
              >
                <FaClipboardList className="nav-icon" />
                <span>Requisitions</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeSection === 'labor' ? 'active' : ''} 
                onClick={() => handleNavigation('labor')}
              >
                <FaUsers className="nav-icon" />
                <span>Labor Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeSection === 'stock' ? 'active' : ''} 
                onClick={() => handleNavigation('stock')}
              >
                <FaBox className="nav-icon" />
                <span>Stock Management</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeSection === 'reports' ? 'active' : ''} 
                onClick={() => handleNavigation('reports')}
              >
                <FaFileAlt className="nav-icon" />
                <span>Reports</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleSignOut}>
            <FaSignOutAlt className="nav-icon" />
            {isSidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'show' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
          <div className="header-actions">
            <button 
              className="mobile-menu-button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <SearchBar 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              placeholder="Search requisitions, stock, projects..."
            />
            <div className="user-profile">
              <img src={logo} alt="User" />
              <span>{currentUserData?.name || 'Site Agent'}</span>
            </div>
          </div>
        </header>
        <div className="content-wrapper">
          {console.log('In content wrapper, activeSection:', activeSection)}
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'requisitions' && renderRequisitions()}
          {activeSection === 'stock' && renderStock()}
          {activeSection === 'reports' && renderReports()}
          {/* Other sections will be added here */}
        </div>
      </main>

      {/* Add Requisition Modal */}
      {showAddRequisitionModal && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Requisition</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setShowAddRequisitionModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddRequisition} className="enhanced-form">
              <div className="form-section">
                <h4>Item Information</h4>
                <div className="form-row">
                  <input
                    type="text"
                    name="item"
                    placeholder="Item Name *"
                    value={newRequisition.item}
                    onChange={handleRequisitionChange}
                    required
                  />
                  <input
                    type="text"
                    name="brand"
                    placeholder="Brand"
                    value={newRequisition.brand}
                    onChange={handleRequisitionChange}
                  />
                </div>
                <textarea
                  name="description"
                  placeholder="Item Description *"
                  value={newRequisition.description}
                  onChange={handleRequisitionChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-section">
                <h4>Quantity & Pricing</h4>
                <div className="form-row">
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity *"
                    value={newRequisition.quantity}
                    onChange={handleRequisitionChange}
                    required
                    min="1"
                  />
                  <input
                    type="number"
                    name="unitPrice"
                    placeholder="Unit Price (Ksh) *"
                    step="0.01"
                    value={newRequisition.unitPrice}
                    onChange={handleRequisitionChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Project Information</h4>
                <div className="form-row">
                  <select
                    name="projectName"
                    value={newRequisition.projectName}
                    onChange={handleRequisitionChange}
                    required
                  >
                    <option value="">Select Project *</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="urgency"
                    value={newRequisition.urgency}
                    onChange={handleRequisitionChange}
                  >
                    <option value="normal">Normal (7-14 days)</option>
                    <option value="urgent">Urgent (2-3 days)</option>
                    <option value="emergency">Emergency (Same day)</option>
                  </select>
                </div>
                <textarea
                  name="reasonForRequest"
                  placeholder="Reason for Request *"
                  value={newRequisition.reasonForRequest}
                  onChange={handleRequisitionChange}
                  required
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  <FaPlus /> Submit Requisition
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddRequisitionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="modal-form">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Review Request from {selectedRequest.requesterName}</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setApprovalComments('');
                }}
              >
                ✕
              </button>
            </div>
            <div className="enhanced-form">
              <div className="form-section">
                <h4>Request Details</h4>
                <div className="request-details">
                  <div className="detail-row">
                    <strong>Item:</strong> {selectedRequest.item}
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong> {selectedRequest.description}
                  </div>
                  <div className="detail-row">
                    <strong>Quantity:</strong> {selectedRequest.quantity} {selectedRequest.unit}
                  </div>
                  <div className="detail-row">
                    <strong>Unit Price:</strong> Ksh{(selectedRequest.unitPrice || 0).toLocaleString()}
                  </div>
                  <div className="detail-row">
                    <strong>Total Cost:</strong> Ksh{((selectedRequest.quantity * selectedRequest.unitPrice) || 0).toLocaleString()}
                  </div>
                  <div className="detail-row">
                    <strong>Project:</strong> {selectedRequest.projectName}
                  </div>
                  <div className="detail-row">
                    <strong>Reason:</strong> {selectedRequest.reasonForRequest}
                  </div>
                  <div className="detail-row">
                    <strong>Requested By:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterRole})
                  </div>
                  <div className="detail-row">
                    <strong>Request Date:</strong> {selectedRequest.requestDate}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Site Agent Review</h4>
                <textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Add your comments about this request..."
                  rows="4"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => handleApproveRequest(selectedRequest.id, 'approve')}
                  disabled={!approvalComments.trim()}
                >
                  <FaCheck /> Approve & Forward to Admin
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => handleApproveRequest(selectedRequest.id, 'reject')}
                  disabled={!approvalComments.trim()}
                >
                  ✕ Reject Request
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedRequest(null);
                    setApprovalComments('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Work Report Modal */}
      {showReportModal && (
        <div className="modal-form">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>Create Work Report</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className="enhanced-form">
              {/* Report Type and Date */}
              <div className="form-section">
                <h4>Report Information</h4>
                <div className="form-row">
                  <select
                    name="reportType"
                    value={newWorkReport.reportType}
                    onChange={handleReportChange}
                    required
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                  </select>
                  <select
                    name="projectName"
                    value={newWorkReport.projectName}
                    onChange={handleReportChange}
                    required
                  >
                    <option value="">Select Project *</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  {newWorkReport.reportType === 'daily' ? (
                    <input
                      type="date"
                      name="reportDate"
                      value={newWorkReport.reportDate}
                      onChange={handleReportChange}
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="date"
                        name="weekStartDate"
                        placeholder="Week Start Date"
                        value={newWorkReport.weekStartDate}
                        onChange={handleReportChange}
                        required
                      />
                      <input
                        type="date"
                        name="weekEndDate"
                        placeholder="Week End Date"
                        value={newWorkReport.weekEndDate}
                        onChange={handleReportChange}
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Work Description */}
              <div className="form-section">
                <h4>Work Description</h4>
                <textarea
                  name="workDescription"
                  placeholder="Describe the work done during this period..."
                  value={newWorkReport.workDescription}
                  onChange={handleReportChange}
                  required
                  rows="4"
                />
                <div className="form-row">
                  <textarea
                    name="tasksCompleted"
                    placeholder="Tasks Completed"
                    value={newWorkReport.tasksCompleted}
                    onChange={handleReportChange}
                    rows="3"
                  />
                  <textarea
                    name="tasksInProgress"
                    placeholder="Tasks In Progress"
                    value={newWorkReport.tasksInProgress}
                    onChange={handleReportChange}
                    rows="3"
                  />
                </div>
                <textarea
                  name="tasksPlanned"
                  placeholder="Tasks Planned for Next Period"
                  value={newWorkReport.tasksPlanned}
                  onChange={handleReportChange}
                  rows="3"
                />
              </div>

              {/* Materials Used */}
              <div className="form-section">
                <h4>Materials Used</h4>
                {newWorkReport.materialsUsed.map((material, index) => (
                  <div key={index} className="material-row">
                    <div className="form-row">
                      <input
                        type="text"
                        placeholder="Material/Item"
                        value={material.item}
                        onChange={(e) => handleMaterialChange(index, 'item', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={material.quantity}
                        onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                      />
                      <select
                        value={material.unit}
                        onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                      >
                        <option value="pieces">Pieces</option>
                        <option value="kg">Kg</option>
                        <option value="bags">Bags</option>
                        <option value="meters">Meters</option>
                        <option value="liters">Liters</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Cost (Ksh)"
                        value={material.cost}
                        onChange={(e) => handleMaterialChange(index, 'cost', e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeMaterialRow(index)}
                        disabled={newWorkReport.materialsUsed.length === 1}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={addMaterialRow}
                >
                  <FaPlus /> Add Material
                </button>
              </div>

              {/* Labor and Equipment */}
              <div className="form-section">
                <h4>Labor and Equipment</h4>
                <div className="form-row">
                  <input
                    type="number"
                    name="workersPresent"
                    placeholder="Number of Workers Present"
                    value={newWorkReport.workersPresent}
                    onChange={handleReportChange}
                  />
                  <input
                    type="number"
                    name="workHours"
                    placeholder="Total Work Hours"
                    value={newWorkReport.workHours}
                    onChange={handleReportChange}
                  />
                </div>
                <textarea
                  name="laborDetails"
                  placeholder="Labor Details (worker roles, tasks assigned, etc.)"
                  value={newWorkReport.laborDetails}
                  onChange={handleReportChange}
                  rows="3"
                />
                <textarea
                  name="equipmentUsed"
                  placeholder="Equipment Used"
                  value={newWorkReport.equipmentUsed}
                  onChange={handleReportChange}
                  rows="3"
                />
              </div>

              {/* Conditions and Challenges */}
              <div className="form-section">
                <h4>Conditions and Challenges</h4>
                <div className="form-row">
                  <input
                    type="text"
                    name="weatherConditions"
                    placeholder="Weather Conditions"
                    value={newWorkReport.weatherConditions}
                    onChange={handleReportChange}
                  />
                </div>
                <textarea
                  name="challenges"
                  placeholder="Challenges Faced"
                  value={newWorkReport.challenges}
                  onChange={handleReportChange}
                  rows="3"
                />
                <textarea
                  name="recommendations"
                  placeholder="Recommendations"
                  value={newWorkReport.recommendations}
                  onChange={handleReportChange}
                  rows="3"
                />
              </div>

              {/* Media Upload */}
              <div className="form-section">
                <h4>Photos and Videos</h4>
                <div className="media-upload-section">
                  <div className="upload-area">
                    <label className="upload-label">
                      <FaCamera /> Upload Photos
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleMediaUpload(e, 'photos')}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <label className="upload-label">
                      <FaVideo /> Upload Videos
                      <input
                        type="file"
                        multiple
                        accept="video/*"
                        onChange={(e) => handleMediaUpload(e, 'videos')}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  
                  {/* Photo Previews */}
                  {newWorkReport.photos.length > 0 && (
                    <div className="media-previews">
                      <h5>Photos ({newWorkReport.photos.length})</h5>
                      <div className="photo-grid">
                        {newWorkReport.photos.map((photo, index) => (
                          <div key={index} className="media-preview">
                            <img src={photo.url} alt={photo.name} />
                            <button
                              type="button"
                              className="remove-media"
                              onClick={() => removeMedia(index, 'photos')}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Previews */}
                  {newWorkReport.videos.length > 0 && (
                    <div className="media-previews">
                      <h5>Videos ({newWorkReport.videos.length})</h5>
                      <div className="video-grid">
                        {newWorkReport.videos.map((video, index) => (
                          <div key={index} className="media-preview">
                            <video controls>
                              <source src={video.url} type={video.type} />
                            </video>
                            <button
                              type="button"
                              className="remove-media"
                              onClick={() => removeMedia(index, 'videos')}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="form-section">
                <h4>Additional Notes</h4>
                <textarea
                  name="notes"
                  placeholder="Any additional notes or observations..."
                  value={newWorkReport.notes}
                  onChange={handleReportChange}
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={uploadingMedia}>
                  <FaSave /> {uploadingMedia ? 'Uploading...' : 'Submit Report'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteAgentDashboard;
