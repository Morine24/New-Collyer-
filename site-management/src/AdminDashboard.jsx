import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaBell, FaBox, FaClipboardList, FaDollarSign, FaDownload, FaHome, FaChartLine, FaBars, FaSearch, FaUsers, FaProjectDiagram, FaSignOutAlt } from 'react-icons/fa';
import JSZip from 'jszip';
import SearchBar from './SearchBar';
import logo from './assets/logo.jpeg';
import './AdminDashboard.css';

export default function CleanAdminDashboard({ currentUserData, requisitions, updateRequisitionStatus }) {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [laborCosts, setLaborCosts] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Open by default on tablet/desktop (>=768px), closed on smaller
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [activeSection, setActiveSection] = useState('dashboard');
  const [reportType, setReportType] = useState('stock');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    budget: '',
    startDate: '',
    expectedCompletionDate: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isAddUserFormVisible, setIsAddUserFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isAddProjectFormVisible, setIsAddProjectFormVisible] = useState(false);
  const [newLaborData, setNewLaborData] = useState({
    projectName: '',
    description: '',
    amount: '',
    dateIncurred: '',
  });
  const [isAddLaborFormVisible, setIsAddLaborFormVisible] = useState(false);
  // Removed selectedProjectForAnalysis state (unused after removing cost analysis block)
  const [showProjectDetailsFor, setShowProjectDetailsFor] = useState(null);
  const [selectedProjectForCostBreakdown, setSelectedProjectForCostBreakdown] = useState(null);
  const [showCostBreakdownModal, setShowCostBreakdownModal] = useState(false);
  const [attendanceReports, setAttendanceReports] = useState([]);
  const [workReports, setWorkReports] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [selectedWorkReport, setSelectedWorkReport] = useState(null);
  const [showWorkReportModal, setShowWorkReportModal] = useState(false);
  

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  // New useEffect to fetch stocks from Firestore
  useEffect(() => {
    const fetchStocks = async () => {
      const stockCollection = collection(db, 'stockItems'); // New collection for stocks
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);
    };

    fetchStocks();
  }, []);

  // New useEffect to fetch projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
    };

    fetchProjects();
  }, []);

  // New useEffect to fetch labor costs from Firestore
  useEffect(() => {
    const fetchLaborCosts = async () => {
      const laborCostsCollection = collection(db, 'laborCosts');
      const laborSnapshot = await getDocs(laborCostsCollection);
      const laborList = laborSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLaborCosts(laborList);
    };

    fetchLaborCosts();
  }, []);

  // New useEffect to fetch visitors from Firestore
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
        console.log('Fetched visitors:', visitorList); // Debug log
        setVisitors(visitorList);
      } catch (error) {
        console.error('Error fetching visitors:', error);
      }
    };

    fetchVisitors();
  }, []);

  useEffect(() => {
    const fetchAttendanceReports = async () => {
      const reportsCollection = collection(db, 'attendanceReports');
      const reportSnapshot = await getDocs(reportsCollection);
      const reportList = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceReports(reportList);
    };

    fetchAttendanceReports();
  }, []);

  useEffect(() => {
    const fetchWorkReports = async () => {
      try {
        const workReportsCollection = collection(db, 'workReports');
        const workReportsSnapshot = await getDocs(workReportsCollection);
        const workReportsList = workReportsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate ? doc.data().submittedAt.toDate() : new Date(doc.data().submittedAt)
        }));
        console.log('Fetched work reports:', workReportsList);
        setWorkReports(workReportsList);
      } catch (error) {
        console.error('Error fetching work reports:', error);
      }
    };

    fetchWorkReports();
  }, []);

  

  // Filter requisitions based on search query
  useEffect(() => {
    const search = searchQuery.toLowerCase();

    const filteredReqs = requisitions.filter(req => {
      const item = req.item ? req.item.toLowerCase() : '';
      const status = req.status ? req.status.toLowerCase() : '';
      const project = req.project ? req.project.toLowerCase() : '';
      return item.includes(search) || status.includes(search) || project.includes(search);
    });
    setFilteredRequisitions(filteredReqs);

    const filteredUsrs = users.filter(user => {
      const name = user.name ? user.name.toLowerCase() : '';
      const email = user.email ? user.email.toLowerCase() : '';
      const role = user.role ? user.role.toLowerCase() : '';
      return name.includes(search) || email.includes(search) || role.includes(search);
    });
    setFilteredUsers(filteredUsrs);

    const filteredStks = stocks.filter(stock => {
      const name = stock.name ? stock.name.toLowerCase() : '';
      const supplier = stock.supplier ? stock.supplier.toLowerCase() : '';
      const project = stock.project ? stock.project.toLowerCase() : '';
      return name.includes(search) || supplier.includes(search) || project.includes(search);
    });
    setFilteredStocks(filteredStks);

    const filteredProjs = projects.filter(project => {
      const name = project.name ? project.name.toLowerCase() : '';
      const status = project.status ? project.status.toLowerCase() : '';
      return name.includes(search) || status.includes(search);
    });
    setFilteredProjects(filteredProjs);

    // Filter visitors
    const filteredVis = visitors.filter(visitor => {
      const name = visitor.name ? visitor.name.toLowerCase() : '';
      const company = visitor.company ? visitor.company.toLowerCase() : '';
      const host = visitor.host ? visitor.host.toLowerCase() : '';
      const reason = visitor.reason ? visitor.reason.toLowerCase() : '';
      const status = visitor.status ? visitor.status.toLowerCase() : '';
      return name.includes(search) || company.includes(search) || host.includes(search) || reason.includes(search) || status.includes(search);
    });
    console.log('All visitors:', visitors); // Debug log
    console.log('Filtered visitors:', filteredVis); // Debug log
    setFilteredVisitors(filteredVis);

  }, [searchQuery, requisitions, users, stocks, projects, visitors]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 768;
      if (!isSmall && !isSidebarOpen) {
        setIsSidebarOpen(true); // ensure open again when returning to wider layout
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Calculate requisition costs for a project
  const calculateRequisitionCosts = (projectName) => {
    return requisitions
      .filter(req => req.projectName === projectName && req.status === 'approved')
      .reduce((total, req) => {
        // If requisition has cost/price field, use it; otherwise use quantity * estimated unit cost
        const cost = req.cost || req.price || (req.quantity * (req.unitPrice || 100)); // Default unit price if not specified
        return total + (cost || 0);
      }, 0);
  };

  // Calculate stock costs for a project (from stockItems added directly)
  const calculateStockCosts = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    return project ? (project.stockCostsSpent || 0) : 0;
  };

  // Calculate labor costs for a project
  const calculateLaborCosts = (projectName) => {
    return laborCosts
      .filter(lc => lc.projectName === projectName)
      .reduce((total, lc) => total + lc.amount, 0);
  };

  // Calculate total project cost (requisition costs + stock costs + labor costs)
  const calculateProjectCost = (projectName) => {
    return calculateRequisitionCosts(projectName) + calculateStockCosts(projectName) + calculateLaborCosts(projectName);
  };

  // Removed unused calculateTotalStockValue to satisfy linter

  const getProjectProgress = (projectName) => {
    const project = projects.find(p => p.name === projectName);
    const spent = calculateProjectCost(projectName);
    return project ? (spent / project.budget) * 100 : 0;
  };

  // Handler for updating requisition status
  const handleUpdateStatus = async (id, newStatus) => {
    updateRequisitionStatus(id, newStatus);
  };

  // Handler for fulfilling a requisition and updating stock
  // Removed unused handleFulfillRequisition (not referenced in UI)

  const handleNewProjectChange = (e) => {
    setNewProjectData({
      ...newProjectData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewProject = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'projects'), { ...newProjectData, status: 'pending', stockCostsSpent: 0 }); // Initialize stockCostsSpent
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
      setNewProjectData({ name: '', budget: '', startDate: '', expectedCompletionDate: '' });
      setIsAddProjectFormVisible(false);
    } catch (error) {
      console.error("Error adding new project:", error);
      alert("Failed to add new project.");
    }
  };

  const handleNewLaborChange = (e) => {
    setNewLaborData({
      ...newLaborData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddNewLabor = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'laborCosts'), { ...newLaborData, amount: parseFloat(newLaborData.amount) });
      // Re-fetch labor costs to update the UI
      const laborCostsCollection = collection(db, 'laborCosts');
      const laborSnapshot = await getDocs(laborCostsCollection);
      const laborList = laborSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLaborCosts(laborList);
      setNewLaborData({ projectName: '', description: '', amount: '', dateIncurred: '' });
      setIsAddLaborFormVisible(false);
    } catch (error) {
      console.error("Error adding new labor cost:", error);
      alert("Failed to add new labor cost.");
    }
  };

  // Handler for viewing project cost breakdown
  const handleViewProjectCostBreakdown = (project) => {
    setSelectedProjectForCostBreakdown(project);
    setShowCostBreakdownModal(true);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteDoc(doc(db, "projects", projectId));
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project.");
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "projects", editingProject.id), {
        name: editingProject.name,
        budget: editingProject.budget,
        startDate: editingProject.startDate,
        expectedCompletionDate: editingProject.expectedCompletionDate,
        status: editingProject.status,
      });
      // Re-fetch projects to update the UI
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projectList);
      setEditingProject(null);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project.");
    }
  };

  const handleAddNewUser = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const email = e.target.email.value;
    const role = e.target.role.value;
    const password = 'password'; // Default password

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);
      
      // Save user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        role,
        mustChangePassword: true, // Set mustChangePassword in Firestore
      });

      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      e.target.reset();
      setIsAddUserFormVisible(false);
    } catch (error) {
      console.error("Error creating new user:", error);
      alert("Failed to create new user. Please check the email and try again.");
    }
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      const usersCollection = collection(db, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    }
  };

  const handleLogout = () => {
    console.log('User logged out');
    navigate('/');
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
    } else if (reportType === 'attendance') {
      return {
        title: `Attendance Report - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: attendanceReports
      };
    } else if (reportType === 'workReports') {
      const filteredReports = workReports.filter(report => {
        const reportDate = new Date(report.submittedAt);
        return dateFilter(reportDate);
      });
      return {
        title: `Work Reports - ${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}`,
        data: filteredReports,
        summary: {
          total: filteredReports.length,
          daily: filteredReports.filter(r => r.reportType === 'daily').length,
          weekly: filteredReports.filter(r => r.reportType === 'weekly').length,
          totalMaterialsCost: filteredReports.reduce((sum, report) => {
            const materialsCost = report.materialsUsed?.reduce((total, material) => 
              total + (parseFloat(material.cost) || 0), 0) || 0;
            return sum + materialsCost;
          }, 0)
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
    
    if (reportType === 'workReports') {
      // Work reports contain multimedia, so offer multiple download options
      downloadWorkReportsWithMedia(reportData);
    } else {
      // Standard reports can be downloaded as CSV
      downloadGenericReportCSV(reportData);
    }
  };

  const downloadWorkReportsWithMedia = (reportData) => {
    // Check if any reports contain multimedia
    const hasMultimedia = reportData.data.some(report => 
      (report.photos && report.photos.length > 0) || 
      (report.videos && report.videos.length > 0)
    );

    if (hasMultimedia) {
      // Show options for multimedia reports
      const choice = confirm(
        'Work reports contain photos and videos.\n\n' +
        'Click OK to download as ZIP archive (includes all media)\n' +
        'Click Cancel to download as CSV only (no media files)'
      );
      
      if (choice) {
        downloadAllWorkReports(); // ZIP with media
      } else {
        downloadWorkReportsCSV(reportData); // CSV only
      }
    } else {
      // No multimedia, just download CSV
      downloadWorkReportsCSV(reportData);
    }
  };

  const downloadGenericReportCSV = (reportData) => {
    if (!reportData.data || reportData.data.length === 0) {
      alert('No data available to download');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," +
      Object.keys(reportData.data[0]).join(",") + "\n" +
      reportData.data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadWorkReportsCSV = (reportData) => {
    if (!reportData.data || reportData.data.length === 0) {
      alert('No work reports available to download');
      return;
    }

    // Create comprehensive CSV headers for work reports
    const headers = [
      'Report ID',
      'Report Type',
      'Project Name',
      'Date/Period',
      'Submitted By',
      'Submitted At',
      'Status',
      'Work Description',
      'Tasks Completed',
      'Tasks In Progress', 
      'Tasks Planned',
      'Workers Present',
      'Work Hours',
      'Labor Details',
      'Equipment Used',
      'Weather Conditions',
      'Challenges',
      'Recommendations',
      'Materials Used (JSON)',
      'Total Materials Cost',
      'Photos Count',
      'Videos Count',
      'Additional Notes'
    ];

    // Transform work report data for CSV
    const csvData = reportData.data.map(report => {
      const materialsCost = report.materialsUsed?.reduce((total, material) => 
        total + (parseFloat(material.cost) || 0), 0) || 0;
      
      const materialsJson = report.materialsUsed ? JSON.stringify(report.materialsUsed) : '';
      
      return [
        report.id || '',
        report.reportType || '',
        report.projectName || '',
        report.reportType === 'daily' 
          ? report.reportDate || ''
          : `${report.weekStartDate || ''} to ${report.weekEndDate || ''}`,
        report.submittedBy || '',
        report.submittedAt ? new Date(report.submittedAt).toLocaleString() : '',
        report.status || '',
        `"${(report.workDescription || '').replace(/"/g, '""')}"`,
        `"${(report.tasksCompleted || '').replace(/"/g, '""')}"`,
        `"${(report.tasksInProgress || '').replace(/"/g, '""')}"`,
        `"${(report.tasksPlanned || '').replace(/"/g, '""')}"`,
        report.workersPresent || '',
        report.workHours || '',
        `"${(report.laborDetails || '').replace(/"/g, '""')}"`,
        `"${(report.equipmentUsed || '').replace(/"/g, '""')}"`,
        report.weatherConditions || '',
        `"${(report.challenges || '').replace(/"/g, '""')}"`,
        `"${(report.recommendations || '').replace(/"/g, '""')}"`,
        `"${materialsJson.replace(/"/g, '""')}"`,
        materialsCost,
        report.photos?.length || 0,
        report.videos?.length || 0,
        `"${(report.notes || '').replace(/"/g, '""')}"`
      ];
    });

    // Create CSV content
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      headers.join(",") + "\n" +
      csvData.map(row => row.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `work_reports_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to download file from Firestore content or Firebase Storage URL
  const downloadFileFromReport = (report) => {
    if (report.storageMethod === 'firestore' && report.content) {
      // Download from Firestore content
      const blob = new Blob([report.content], { type: report.mimeType || 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else if (report.url) {
      // Download from Firebase Storage URL
      window.open(report.url, '_blank');
    } else {
      alert('File not available for download');
    }
  };

  const renderDashboard = () => {
    return (
      <div className="dashboard-content">
        <div className="summary-cards">
          {projects.map(project => (
            <div className="summary-card clickable" key={project.id} onClick={() => setShowProjectDetailsFor(showProjectDetailsFor === project.id ? null : project.id)}>
              <div className="card-header">
                <h3>{project.name}</h3>
              </div>
              <div className="pie-chart-container">
                <div className="pie-chart" style={{ background: `conic-gradient(#4caf50 ${project.budget > 0 ? Math.min(100, (calculateProjectCost(project.name) / project.budget) * 100) : 0}%, #e0e0e0 0)` }}>
                  <span className="pie-chart-label">{getProjectProgress(project.name).toFixed(0)}%</span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#4caf50' }}></div>
                  <span>Spent</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#e0e0e0' }}></div>
                  <span>Remaining</span>
                </div>
              </div>
              <div className="project-metrics">
                <div className="metric">
                  <span className="metric-label">Budget:</span>
                  <span className="metric-value">Ksh{project.budget.toLocaleString()}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Spent:</span>
                  <span className="metric-value">Ksh{calculateProjectCost(project.name).toLocaleString()}</span>
                </div>
              </div>
              {showProjectDetailsFor === project.id && (
                <div className="project-details">
                  <div className="metric">
                    <span className="metric-label">Stock Cost:</span>
                    <span className="metric-value">Ksh{calculateStockCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Labor Cost:</span>
                    <span className="metric-value">Ksh{calculateLaborCosts(project.name).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Remaining:</span>
                    <span className="metric-value">Ksh{(project.budget - calculateProjectCost(project.name)).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  

  const renderProjectManagement = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>Project Management</h3>
          <button className="btn btn-primary" onClick={() => setIsAddProjectFormVisible(true)}>Add Project</button>
          <button className="btn btn-primary" onClick={() => setIsAddLaborFormVisible(true)}>Add Labor Cost</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Budget</th>
                <th>Total Spent</th>
                <th>Remaining Budget</th>
                <th>Start Date</th>
                <th>Expected Date of Completion</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => {
                const totalSpent = calculateProjectCost(project.name);
                const remaining = project.budget - totalSpent;
                const budgetPercentage = ((totalSpent / project.budget) * 100).toFixed(1);
                
                return (
                  <tr key={project.id}>
                    <td className="clickable">{project.name}</td>
                    <td>Ksh{project.budget.toLocaleString()}</td>
                    <td>
                      <div>
                        <strong style={{ color: totalSpent > project.budget ? '#e74c3c' : '#27ae60' }}>
                          Ksh{totalSpent.toLocaleString()}
                        </strong>
                        <br />
                        <small style={{ color: '#666' }}>({budgetPercentage}% of budget)</small>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: remaining < 0 ? '#e74c3c' : '#27ae60' }}>
                        Ksh{remaining.toLocaleString()}
                      </span>
                    </td>
                    <td>{project.startDate}</td>
                    <td>{project.expectedCompletionDate}</td>
                    <td>
                      <span className={`status-badge status-${project.status}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleViewProjectCostBreakdown(project)}
                        style={{ marginRight: '5px' }}
                      >
                        View Costs
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingProject(project)}
                        style={{ marginRight: '5px' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </button>
                    </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

  {/* Removed renderCostAnalysis as it was referenced but not defined */}

      {isAddProjectFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New Project</h3>
            <form onSubmit={handleAddNewProject} className="form-grid">
              <input type="text" name="name" placeholder="Project Name" value={newProjectData.name} onChange={handleNewProjectChange} required />
              <input type="number" name="budget" placeholder="Budget" step="0.01" value={newProjectData.budget} onChange={handleNewProjectChange} required />
              <input type="date" name="startDate" placeholder="Start Date" value={newProjectData.startDate} onChange={handleNewProjectChange} required />
              <input type="date" name="expectedCompletionDate" placeholder="Expected Completion Date" value={newProjectData.expectedCompletionDate} onChange={handleNewProjectChange} required />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Project</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddProjectFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddLaborFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New Labor Cost</h3>
            <form onSubmit={handleAddNewLabor} className="form-grid">
              <select name="projectName" value={newLaborData.projectName} onChange={handleNewLaborChange} required>
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
              <input type="text" name="description" placeholder="Description" value={newLaborData.description} onChange={handleNewLaborChange} required />
              <input type="number" name="amount" placeholder="Amount" step="0.01" value={newLaborData.amount} onChange={handleNewLaborChange} required />
              <input type="date" name="dateIncurred" placeholder="Date Incurred" value={newLaborData.dateIncurred} onChange={handleNewLaborChange} required />
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add Labor Cost</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddLaborFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Edit Project</h3>
            <form onSubmit={handleUpdateProject} className="form-grid">
              <input type="text" name="name" placeholder="Project Name" value={editingProject.name} onChange={(e) => setEditingProject({...editingProject, name: e.target.value})} required />
              <input type="number" name="budget" placeholder="Budget" step="0.01" value={editingProject.budget} onChange={(e) => setEditingProject({...editingProject, budget: e.target.value})} required />
              <input type="date" name="startDate" placeholder="Start Date" value={editingProject.startDate} onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})} required />
              <input type="date" name="expectedCompletionDate" placeholder="Expected Completion Date" value={editingProject.expectedCompletionDate} onChange={(e) => setEditingProject({...editingProject, expectedCompletionDate: e.target.value})} required />
              <select name="status" value={editingProject.status} onChange={(e) => setEditingProject({...editingProject, status: e.target.value})} required>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update Project</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProject(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  

  const renderUsers = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>User Management</h3>
          <button className="btn btn-primary" onClick={() => setIsAddUserFormVisible(true)}>Add User</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddUserFormVisible && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Add New User</h3>
            <form onSubmit={handleAddNewUser} className="form-grid">
              <input type="text" name="name" placeholder="Full Name" required />
              <input type="email" name="email" placeholder="Email Address" required />
              <select name="role" required>
                <option value="">Select Role</option>
                <option value="Manager">Manager</option>
                <option value="Site Agent">Site Agent</option>
                <option value="Stock Clerk">Stock Clerk</option>
                <option value="Foreman">Foreman</option>
                <option value="Gate Officer">Gate Officer</option>
                <option value="Regular Staff">Regular Staff</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Add User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserFormVisible(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-form">
          <div className="modal-content">
            <h3>Edit User</h3>
            <form onSubmit={handleUpdateUser} className="form-grid">
              <input type="text" name="name" placeholder="Full Name" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} required />
              <input type="email" name="email" placeholder="Email Address" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} required />
              <select name="role" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} required>
                <option value="Manager">Manager</option>
                <option value="Site Agent">Site Agent</option>
                <option value="Stock Clerk">Stock Clerk</option>
                <option value="Foreman">Foreman</option>
                <option value="Gate Officer">Gate Officer</option>
                <option value="Regular Staff">Regular Staff</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Update User</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Cost Breakdown Modal */}
      {showCostBreakdownModal && selectedProjectForCostBreakdown && (
        <div className="modal-form">
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Cost Breakdown - {selectedProjectForCostBreakdown.name}</h3>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setShowCostBreakdownModal(false)}
                style={{ float: 'right' }}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="cost-summary" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>Project Budget:</strong> 
                  <div style={{ fontSize: '18px', color: '#2c3e50' }}>Ksh{selectedProjectForCostBreakdown.budget.toLocaleString()}</div>
                </div>
                <div>
                  <strong>Total Spent:</strong> 
                  <div style={{ fontSize: '18px', color: '#e74c3c' }}>Ksh{calculateProjectCost(selectedProjectForCostBreakdown.name).toLocaleString()}</div>
                </div>
                <div>
                  <strong>Remaining:</strong> 
                  <div style={{ fontSize: '18px', color: selectedProjectForCostBreakdown.budget - calculateProjectCost(selectedProjectForCostBreakdown.name) < 0 ? '#e74c3c' : '#27ae60' }}>
                    Ksh{(selectedProjectForCostBreakdown.budget - calculateProjectCost(selectedProjectForCostBreakdown.name)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="cost-breakdown-sections">
              {/* Requisitions Section */}
              <div className="cost-section" style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '5px' }}>
                  Requisitions - Ksh{calculateRequisitionCosts(selectedProjectForCostBreakdown.name).toLocaleString()}
                </h4>
                <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requisitions
                        .filter(req => req.projectName === selectedProjectForCostBreakdown.name)
                        .map(req => (
                          <tr key={req.id}>
                            <td>{req.items}</td>
                            <td>{req.quantity}</td>
                            <td>Ksh{(req.unitPrice || 0).toLocaleString()}</td>
                            <td>Ksh{((req.cost || req.price || (req.quantity * (req.unitPrice || 0))) || 0).toLocaleString()}</td>
                            <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                            <td>{req.date}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Labor Costs Section */}
              <div className="cost-section" style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #e67e22', paddingBottom: '5px' }}>
                  Labor Costs - Ksh{calculateLaborCosts(selectedProjectForCostBreakdown.name).toLocaleString()}
                </h4>
                <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {laborCosts
                        .filter(lc => lc.projectName === selectedProjectForCostBreakdown.name)
                        .map((lc, index) => (
                          <tr key={index}>
                            <td>{lc.description}</td>
                            <td>Ksh{lc.amount.toLocaleString()}</td>
                            <td>{lc.dateIncurred}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Costs Section */}
              <div className="cost-section">
                <h4 style={{ color: '#2c3e50', borderBottom: '2px solid #27ae60', paddingBottom: '5px' }}>
                  Stock Costs - Ksh{calculateStockCosts(selectedProjectForCostBreakdown.name).toLocaleString()}
                </h4>
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  Stock costs are tracked directly in the project record.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = () => {
    const reportData = generateReportData();
    
    return (
      <div className="section-content">
        <div className="reports-controls">
          <div className="control-group">
            <label>Report Type:</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="stock">Stock Report</option>
              <option value="requisitions">Requisitions Report</option>
              <option value="projects">Projects Report</option>
              <option value="attendance">Attendance Report</option>
              <option value="workReports">Work Reports</option>
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
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Low Stock Items:</span>
                  <span className="stat-value">{reportData.data.filter(item => item.lowStock).length}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
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
                        <td>Ksh{item.unitCost}</td>
                        <td>Ksh{item.totalValue.toLocaleString()}</td>
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
                  <span className="stat-value">Ksh{reportData.summary.totalCost.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
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
                        <td>Ksh{(req.quantity * req.unitCost).toLocaleString()}</td>
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
                  <span className="stat-label">Active Projects:</span>
                  <span className="stat-value">{reportData.data.filter(p => p.status === 'active').length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Budget:</span>
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Total Spent:</span>
                  <span className="stat-value">Ksh{reportData.data.reduce((sum, p) => sum + p.spent, 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
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
                        <td>Ksh{project.budget.toLocaleString()}</td>
                        <td>Ksh{project.spent.toLocaleString()}</td>
                        <td>Ksh{project.remaining.toLocaleString()}</td>
                        <td>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(project.progress, 100)}%` }}></div>
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

          {reportType === 'attendance' && (
            <div className="report-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Report Name</th>
                      <th>Type</th>
                      <th>Uploaded At</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReports.map(report => (
                      <tr key={report.id}>
                        <td>{report.name}</td>
                        <td>{report.type}</td>
                        <td>{report.uploadedAt ? new Date(report.uploadedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                        <td>
                          <button 
                            onClick={() => downloadFileFromReport(report)} 
                            className="btn btn-primary btn-sm"
                            title="Download file"
                          >
                            <FaDownload /> Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'workReports' && (
            <div className="report-content">
              <div className="report-summary">
                <div className="summary-stat">
                  <span className="stat-label">Total Work Reports:</span>
                  <span className="stat-value">{workReports.length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Daily Reports:</span>
                  <span className="stat-value">{workReports.filter(report => report.reportType === 'daily').length}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">Weekly Reports:</span>
                  <span className="stat-value">{workReports.filter(report => report.reportType === 'weekly').length}</span>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Report Type</th>
                      <th>Project</th>
                      <th>Date/Period</th>
                      <th>Submitted By</th>
                      <th>Work Description</th>
                      <th>Materials Cost</th>
                      <th>Workers</th>
                      <th>Media</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workReports.map(report => {
                      const materialsCost = report.materialsUsed?.reduce((total, material) => 
                        total + (parseFloat(material.cost) || 0), 0) || 0;
                      
                      return (
                        <tr key={report.id}>
                          <td>
                            <span className={`status-badge ${report.reportType === 'daily' ? 'status-daily' : 'status-weekly'}`}>
                              {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                            </span>
                          </td>
                          <td>{report.projectName || 'N/A'}</td>
                          <td>
                            {report.reportType === 'daily' 
                              ? report.reportDate 
                              : `${report.weekStartDate} to ${report.weekEndDate}`
                            }
                          </td>
                          <td>{report.submittedBy}</td>
                          <td>
                            <div className="work-description-preview">
                              {report.workDescription?.substring(0, 100) || 'No description'}
                              {report.workDescription?.length > 100 && '...'}
                            </div>
                          </td>
                          <td>Ksh{materialsCost.toLocaleString()}</td>
                          <td>{report.workersPresent || 'N/A'}</td>
                          <td>
                            <div className="media-indicators">
                              {report.photos && report.photos.length > 0 && (
                                <span className="media-badge photo-badge" title={`${report.photos.length} photos`}>
                                  📷 {report.photos.length}
                                </span>
                              )}
                              {report.videos && report.videos.length > 0 && (
                                <span className="media-badge video-badge" title={`${report.videos.length} videos`}>
                                  🎥 {report.videos.length}
                                </span>
                              )}
                              {(!report.photos || report.photos.length === 0) && 
                               (!report.videos || report.videos.length === 0) && (
                                <span className="no-media">No media</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge status-${report.status}`}>
                              {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                            </span>
                          </td>
                          <td>
                            {report.submittedAt 
                              ? new Date(report.submittedAt).toLocaleString()
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => viewWorkReportDetails(report)}
                                title="View full report details"
                                style={{ marginRight: '8px' }}
                              >
                                View Details
                              </button>
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={() => downloadIndividualWorkReport(report)}
                                title="Download this report"
                              >
                                <FaDownload /> Download
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const viewWorkReportDetails = (report) => {
    setSelectedWorkReport(report);
    setShowWorkReportModal(true);
  };

  const closeWorkReportModal = () => {
    setSelectedWorkReport(null);
    setShowWorkReportModal(false);
  };

  const downloadIndividualWorkReport = async (report) => {
    // Check if report contains multimedia
    const hasMultimedia = (report.photos && report.photos.length > 0) || 
                         (report.videos && report.videos.length > 0);

    if (hasMultimedia) {
      // Show options for multimedia reports
      const choice = confirm(
        'This report contains photos and/or videos.\n\n' +
        'Click OK to download as ZIP archive (includes all media)\n' +
        'Click Cancel to download as text document only (no media files)'
      );
      
      if (choice) {
        await downloadIndividualReportWithMedia(report);
      } else {
        downloadIndividualReportText(report);
      }
    } else {
      // No multimedia, just download text
      downloadIndividualReportText(report);
    }
  };

  const downloadIndividualReportText = (report) => {
    // Create a comprehensive report document
    const reportContent = generateWorkReportDocument(report);
    
    // Create and download as text file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `work_report_${sanitizeFileName(report.projectName || 'project')}_${sanitizeFileName(report.reportDate || report.weekStartDate || 'date')}_${sanitizeFileName(report.submittedBy || 'user')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadIndividualReportWithMedia = async (report) => {
    try {
      const zipFile = new JSZip();

      // Add the text report
      const reportContent = generateWorkReportDocument(report);
      zipFile.file('work_report.txt', reportContent);

      // Add photos
      if (report.photos && report.photos.length > 0) {
        const photosFolder = zipFile.folder('photos');
        
        for (let index = 0; index < report.photos.length; index++) {
          const photo = report.photos[index];
          try {
            const photoBlob = await downloadMediaFile(photo.url);
            if (photoBlob) {
              const photoFileName = `${index + 1}_${sanitizeFileName(photo.name || `photo_${index + 1}`)}`;
              photosFolder.file(photoFileName, photoBlob);
            }
          } catch (error) {
            console.error(`Error downloading photo ${index + 1}:`, error);
            photosFolder.file(`${index + 1}_FAILED_TO_DOWNLOAD.txt`, 
              `Failed to download: ${photo.name || `photo_${index + 1}`}\nOriginal URL: ${photo.url}\nError: ${error.message}`);
          }
        }
      }

      // Add videos
      if (report.videos && report.videos.length > 0) {
        const videosFolder = zipFile.folder('videos');
        
        for (let index = 0; index < report.videos.length; index++) {
          const video = report.videos[index];
          try {
            const videoBlob = await downloadMediaFile(video.url);
            if (videoBlob) {
              const videoFileName = `${index + 1}_${sanitizeFileName(video.name || `video_${index + 1}`)}`;
              videosFolder.file(videoFileName, videoBlob);
            }
          } catch (error) {
            console.error(`Error downloading video ${index + 1}:`, error);
            videosFolder.file(`${index + 1}_FAILED_TO_DOWNLOAD.txt`, 
              `Failed to download: ${video.name || `video_${index + 1}`}\nOriginal URL: ${video.url}\nError: ${error.message}`);
          }
        }
      }

      // Generate and download ZIP file
      const blob = await zipFile.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `work_report_${sanitizeFileName(report.projectName || 'project')}_${sanitizeFileName(report.reportDate || report.weekStartDate || 'date')}_complete.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Download complete! Archive includes the report and all media files.');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Error creating download file. This may be due to large file sizes or network issues. Please try downloading as text only or check your internet connection.');
    }
  };

  const generateWorkReportDocument = (report) => {
    const materialsCost = report.materialsUsed?.reduce((total, material) => 
      total + (parseFloat(material.cost) || 0), 0) || 0;

    let content = `
=====================================
WORK REPORT DOCUMENT
=====================================

Report Information:
------------------
Report Type: ${report.reportType?.toUpperCase() || 'N/A'}
Project: ${report.projectName || 'N/A'}
Date/Period: ${report.reportType === 'daily' 
  ? report.reportDate || 'N/A'
  : `${report.weekStartDate || 'N/A'} to ${report.weekEndDate || 'N/A'}`}
Submitted By: ${report.submittedBy || 'N/A'}
Submitted At: ${report.submittedAt ? new Date(report.submittedAt).toLocaleString() : 'N/A'}
Status: ${report.status?.toUpperCase() || 'N/A'}

Work Description:
----------------
${report.workDescription || 'No description provided'}

Tasks Completed:
---------------
${report.tasksCompleted || 'No tasks completed listed'}

Tasks In Progress:
-----------------
${report.tasksInProgress || 'No tasks in progress listed'}

Tasks Planned:
-------------
${report.tasksPlanned || 'No tasks planned listed'}

Labor and Equipment:
-------------------
Workers Present: ${report.workersPresent || 'N/A'}
Work Hours: ${report.workHours || 'N/A'}
Labor Details: ${report.laborDetails || 'No labor details provided'}
Equipment Used: ${report.equipmentUsed || 'No equipment listed'}

Conditions and Challenges:
-------------------------
Weather Conditions: ${report.weatherConditions || 'N/A'}
Challenges Faced: ${report.challenges || 'No challenges reported'}
Recommendations: ${report.recommendations || 'No recommendations provided'}

Materials Used:
--------------`;

    if (report.materialsUsed && report.materialsUsed.length > 0) {
      content += '\n';
      report.materialsUsed.forEach((material, index) => {
        content += `${index + 1}. ${material.item || 'N/A'} - Qty: ${material.quantity || 'N/A'} ${material.unit || ''} - Cost: Ksh${material.cost || '0'}\n`;
      });
      content += `\nTotal Materials Cost: Ksh${materialsCost.toLocaleString()}`;
    } else {
      content += '\nNo materials used recorded';
    }

    content += `

Multimedia:
----------
Photos Attached: ${report.photos?.length || 0}`;
    
    if (report.photos && report.photos.length > 0) {
      content += '\nPhoto Files:\n';
      report.photos.forEach((photo, index) => {
        content += `${index + 1}. ${photo.name || `Photo ${index + 1}`}\n`;
      });
    }

    content += `\nVideos Attached: ${report.videos?.length || 0}`;
    
    if (report.videos && report.videos.length > 0) {
      content += '\nVideo Files:\n';
      report.videos.forEach((video, index) => {
        content += `${index + 1}. ${video.name || `Video ${index + 1}`}\n`;
      });
    }

    if (report.notes) {
      content += `

Additional Notes:
----------------
${report.notes}`;
    }

    content += `

=====================================
Report Generated: ${new Date().toLocaleString()}
=====================================`;

    return content;
  };

  const downloadAllWorkReports = async () => {
    if (!workReports || workReports.length === 0) {
      alert('No work reports available to download');
      return;
    }

    try {
      const zipFile = new JSZip();

      // Add CSV summary
      const reportData = generateReportData();
      const csvContent = generateWorkReportsCSVContent(reportData);
      zipFile.file('work_reports_summary.csv', csvContent);

      // Add individual report documents
      const reportsFolder = zipFile.folder('individual_reports');
      
      // Add media folders
      const photosFolder = zipFile.folder('photos');
      const videosFolder = zipFile.folder('videos');

      // Process each report
      for (let index = 0; index < workReports.length; index++) {
        const report = workReports[index];
        
        // Add text report
        const reportContent = generateWorkReportDocument(report);
        const reportFileName = `${String(index + 1).padStart(3, '0')}_${sanitizeFileName(report.projectName || 'project')}_${sanitizeFileName(report.reportDate || report.weekStartDate || 'date')}.txt`;
        reportsFolder.file(reportFileName, reportContent);

        // Add photos for this report
        if (report.photos && report.photos.length > 0) {
          const reportPhotosFolder = photosFolder.folder(`report_${String(index + 1).padStart(3, '0')}_photos`);
          
          for (let photoIndex = 0; photoIndex < report.photos.length; photoIndex++) {
            const photo = report.photos[photoIndex];
            try {
              const photoBlob = await downloadMediaFile(photo.url);
              if (photoBlob) {
                const photoFileName = `${photoIndex + 1}_${sanitizeFileName(photo.name || `photo_${photoIndex + 1}`)}`;
                reportPhotosFolder.file(photoFileName, photoBlob);
              }
            } catch (error) {
              console.error(`Error downloading photo ${photoIndex + 1} from report ${index + 1}:`, error);
              // Add a note about failed download
              reportPhotosFolder.file(`${photoIndex + 1}_FAILED_TO_DOWNLOAD.txt`, 
                `Failed to download: ${photo.name || `photo_${photoIndex + 1}`}\nOriginal URL: ${photo.url}\nError: ${error.message}`);
            }
          }
        }

        // Add videos for this report
        if (report.videos && report.videos.length > 0) {
          const reportVideosFolder = videosFolder.folder(`report_${String(index + 1).padStart(3, '0')}_videos`);
          
          for (let videoIndex = 0; videoIndex < report.videos.length; videoIndex++) {
            const video = report.videos[videoIndex];
            try {
              const videoBlob = await downloadMediaFile(video.url);
              if (videoBlob) {
                const videoFileName = `${videoIndex + 1}_${sanitizeFileName(video.name || `video_${videoIndex + 1}`)}`;
                reportVideosFolder.file(videoFileName, videoBlob);
              }
            } catch (error) {
              console.error(`Error downloading video ${videoIndex + 1} from report ${index + 1}:`, error);
              // Add a note about failed download
              reportVideosFolder.file(`${videoIndex + 1}_FAILED_TO_DOWNLOAD.txt`, 
                `Failed to download: ${video.name || `video_${videoIndex + 1}`}\nOriginal URL: ${video.url}\nError: ${error.message}`);
            }
          }
        }
      }

      // Add a README file explaining the archive structure
      const readmeContent = generateArchiveReadme();
      zipFile.file('README.txt', readmeContent);

      // Generate and download ZIP file
      const blob = await zipFile.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `complete_work_reports_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Download complete! Archive includes all reports, photos, and videos.');
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Error creating download file. This may be due to large file sizes or network issues. Please try downloading individual reports or check your internet connection.');
    }
  };

  const downloadMediaFile = async (url) => {
    try {
      // Handle blob URLs (temporary URLs created from File objects)
      if (url.startsWith('blob:')) {
        const response = await fetch(url);
        return await response.blob();
      }
      
      // Handle regular URLs (Firebase Storage, etc.)
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Error downloading media file:', error);
      return null;
    }
  };

  const sanitizeFileName = (fileName) => {
    // Remove or replace invalid filename characters
    return fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
  };

  const generateArchiveReadme = () => {
    return `
WORK REPORTS ARCHIVE
===================

Generated: ${new Date().toLocaleString()}
Total Reports: ${workReports.length}

ARCHIVE STRUCTURE:
-----------------

📁 work_reports_summary.csv
   Complete data export in CSV format (no media files)

📁 individual_reports/
   Text documents for each work report containing:
   - Report details and metadata
   - Work descriptions and tasks
   - Materials used and costs
   - Labor and equipment information
   - Challenges and recommendations
   - Notes on attached media files

📁 photos/
   📁 report_001_photos/
      Photo files from Report #001
   📁 report_002_photos/
      Photo files from Report #002
   (etc.)

📁 videos/
   📁 report_001_videos/
      Video files from Report #001
   📁 report_002_videos/
      Video files from Report #002
   (etc.)

NOTES:
------
- Each report is numbered sequentially (001, 002, etc.)
- Media files are organized by report number
- If a media file failed to download, a .txt file explains the error
- Report text documents reference which media files belong to each report
- All timestamps are in local time zone

For questions about this archive, contact the system administrator.
`;
  };

  const generateWorkReportsCSVContent = (reportData) => {
    const headers = [
      'Report ID', 'Report Type', 'Project Name', 'Date/Period', 'Submitted By',
      'Submitted At', 'Status', 'Work Description', 'Tasks Completed', 'Tasks In Progress',
      'Tasks Planned', 'Workers Present', 'Work Hours', 'Labor Details', 'Equipment Used',
      'Weather Conditions', 'Challenges', 'Recommendations', 'Total Materials Cost',
      'Photos Count', 'Videos Count', 'Additional Notes'
    ];

    const csvData = reportData.data.map(report => {
      const materialsCost = report.materialsUsed?.reduce((total, material) => 
        total + (parseFloat(material.cost) || 0), 0) || 0;
      
      return [
        report.id || '',
        report.reportType || '',
        report.projectName || '',
        report.reportType === 'daily' ? report.reportDate || '' : `${report.weekStartDate || ''} to ${report.weekEndDate || ''}`,
        report.submittedBy || '',
        report.submittedAt ? new Date(report.submittedAt).toLocaleString() : '',
        report.status || '',
        `"${(report.workDescription || '').replace(/"/g, '""')}"`,
        `"${(report.tasksCompleted || '').replace(/"/g, '""')}"`,
        `"${(report.tasksInProgress || '').replace(/"/g, '""')}"`,
        `"${(report.tasksPlanned || '').replace(/"/g, '""')}"`,
        report.workersPresent || '',
        report.workHours || '',
        `"${(report.laborDetails || '').replace(/"/g, '""')}"`,
        `"${(report.equipmentUsed || '').replace(/"/g, '""')}"`,
        report.weatherConditions || '',
        `"${(report.challenges || '').replace(/"/g, '""')}"`,
        `"${(report.recommendations || '').replace(/"/g, '""')}"`,
        materialsCost,
        report.photos?.length || 0,
        report.videos?.length || 0,
        `"${(report.notes || '').replace(/"/g, '""')}"`
      ];
    });

    return "\uFEFF" + headers.join(",") + "\n" + csvData.map(row => row.join(",")).join("\n");
  };

  const renderRequisitions = () => (
    <div className="section-content">
      <div className="card">
        <h3>All Requisitions</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester Name</th>
                <th>Items</th>
                <th>Quantity</th>
                <th>Unit Price (Ksh)</th>
                <th>Total Cost (Ksh)</th>
                <th>Project Name</th>
                <th>Category</th>
                <th>Reason for Request</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequisitions.map(req => (
                <tr key={req.id}>
                  <td>{req.name}</td>
                  <td>{req.items}</td>
                  <td>{req.quantity}</td>
                  <td>{req.unitPrice ? `Ksh${req.unitPrice.toLocaleString()}` : 'Not specified'}</td>
                  <td>
                    <strong>
                      Ksh{((req.cost || req.price || (req.quantity * (req.unitPrice || 0))) || 0).toLocaleString()}
                    </strong>
                  </td>
                  <td>{req.projectName}</td>
                  <td>{req.category}</td>
                  <td>{req.reasonForRequest}</td>
                  <td>{req.date}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {req.status === 'pending' && (
                      <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                        className="form-grid-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
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

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    const newItem = {
      name: e.target.name.value,
      quantity: parseInt(e.target.quantity.value, 10),
      unitCost: parseFloat(e.target.unitCost.value),
      supplier: e.target.supplier.value,
      project: e.target.project.value,
    };

    try {
      // Add new stock item to Firestore
      await addDoc(collection(db, 'stockItems'), newItem);
      e.target.reset();

      // Calculate the cost of the new stock item
      const itemCost = newItem.quantity * newItem.unitCost;

      // Find the associated project
      const projectToUpdate = projects.find(p => p.name === newItem.project);

      if (projectToUpdate) {
        // Add the cost to the project's stockCostsSpent
        const newStockCostsSpent = (projectToUpdate.stockCostsSpent || 0) + itemCost;

        // Update the project's stockCostsSpent in Firestore
        const projectRef = doc(db, "projects", projectToUpdate.id);
        await updateDoc(projectRef, { stockCostsSpent: newStockCostsSpent });

        // Update the local projects state
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === projectToUpdate.id ? { ...p, stockCostsSpent: newStockCostsSpent } : p
          )
        );
        console.log(`Added ${itemCost} to stock costs for project ${projectToUpdate.name}. New stock costs spent: ${newStockCostsSpent}`);
      } else {
        console.warn(`Project "${newItem.project}" not found for stock cost tracking.`);
      }

      // Re-fetch stocks to update the UI
      const stockCollection = collection(db, 'stockItems');
      const stockSnapshot = await getDocs(stockCollection);
      const stockList = stockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStocks(stockList);

    } catch (error) {
      console.error("Error adding new stock item or updating project stock costs:", error);
      alert("Failed to add new stock item or update project stock costs.");
    }
  };

  const renderStockManagement = () => (
    <div className="section-content">
      <div className="card">
        <h3>Stock Inventory</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Remaining Units</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
                <th>Supplier</th>
                <th>Project Name</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => (
                <tr key={stock.id}>
                  <td>{stock.name}</td>
                  <td>{stock.quantity}</td>
                  <td>Ksh{stock.unitCost}</td>
                  <td>Ksh{(stock.quantity * stock.unitCost).toLocaleString()}</td>
                  <td>{stock.supplier}</td>
                  <td>{stock.project}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h3>Add New Item</h3>
        </div>
        <form onSubmit={handleAddNewItem} className="form-grid">
          <input type="text" name="name" placeholder="Item Name" required />
          <input type="number" name="quantity" placeholder="Quantity" required />
          <input type="number" name="unitCost" placeholder="Unit Cost" step="0.01" required />
          <input type="text" name="supplier" placeholder="Supplier" required />
          <select name="project" required>
            <option value="">Select Project</option>
            {projects.map(project => (
              <option key={project.id} value={project.name}>{project.name}</option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Add Item</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderVisitorManagement = () => (
    <div className="section-content">
      <div className="card">
        <div className="card-header">
          <h3>Visitor Management</h3>
          <div className="summary-stats" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="stat-item">
              <span className="stat-label">Total Visitors Today:</span>
              <span className="stat-value">{visitors.filter(v => {
                const today = new Date().toDateString();
                const visitDate = new Date(v.checkInTime?.seconds ? v.checkInTime.seconds * 1000 : v.checkInTime).toDateString();
                return visitDate === today;
              }).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Currently On Site:</span>
              <span className="stat-value">{visitors.filter(v => !v.checkOutTime).length}</span>
            </div>
          </div>
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
                <th>Check-out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map(visitor => (
                <tr key={visitor.id}>
                  <td>{visitor.name}</td>
                  <td>{visitor.company || 'N/A'}</td>
                  <td>{visitor.host || 'N/A'}</td>
                  <td>{visitor.reason}</td>
                  <td>{visitor.idNumber || 'N/A'}</td>
                  <td>{visitor.phone || 'N/A'}</td>
                  <td>
                    {visitor.checkInTime ? 
                      new Date(visitor.checkInTime.seconds ? visitor.checkInTime.seconds * 1000 : visitor.checkInTime).toLocaleString() 
                      : 'N/A'
                    }
                  </td>
                  <td>
                    {visitor.checkOutTime ? 
                      new Date(visitor.checkOutTime.seconds ? visitor.checkOutTime.seconds * 1000 : visitor.checkOutTime).toLocaleString() 
                      : 'Still on site'
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${visitor.checkOutTime ? 'status-completed' : 'status-active'}`}>
                      {visitor.checkOutTime ? 'Checked Out' : 'On Site'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`admin-dashboard ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Logo" />
            {isSidebarOpen && <h1>Admin</h1>}
          </div>
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <FaBars />
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <a href="#" className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
                <FaHome className="nav-icon" />
                {isSidebarOpen && 'Dashboard'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'projects' ? 'active' : ''} onClick={() => setActiveSection('projects')}>
                <FaProjectDiagram className="nav-icon" />
                {isSidebarOpen && 'Projects'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'requisitions' ? 'active' : ''} onClick={() => setActiveSection('requisitions')}>
                <FaClipboardList className="nav-icon" />
                {isSidebarOpen && 'Requisitions'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'stock' ? 'active' : ''} onClick={() => setActiveSection('stock')}>
                <FaBox className="nav-icon" />
                {isSidebarOpen && 'Stock'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'users' ? 'active' : ''} onClick={() => setActiveSection('users')}>
                <FaUsers className="nav-icon" />
                {isSidebarOpen && 'Users'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'visitors' ? 'active' : ''} onClick={() => setActiveSection('visitors')}>
                <FaUsers className="nav-icon" />
                {isSidebarOpen && 'Visitors'}
              </a>
            </li>
            <li>
              <a href="#" className={activeSection === 'reports' ? 'active' : ''} onClick={() => setActiveSection('reports')}>
                <FaChartLine className="nav-icon" />
                {isSidebarOpen && 'Reports'}
              </a>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt className="nav-icon" />
            {isSidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h1>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h1>
          <div className="header-actions">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <div className="user-profile">
              <img src={logo} alt="User" />
              <span>{currentUserData?.name}</span>
            </div>
          </div>
        </header>
        <div className="content-wrapper">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'projects' && renderProjectManagement()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'visitors' && renderVisitorManagement()}
          {activeSection === 'reports' && renderReports()}
          {activeSection === 'requisitions' && renderRequisitions()}
          {activeSection === 'stock' && renderStockManagement()}
        </div>
      </main>

      {/* Work Report Details Modal */}
      {showWorkReportModal && selectedWorkReport && (
        <div className="modal-overlay" onClick={closeWorkReportModal}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Work Report Details</h3>
              <button className="btn btn-sm btn-secondary" onClick={closeWorkReportModal}>
                ✕
              </button>
            </div>
            
            <div className="work-report-details">
              {/* Report Information */}
              <div className="report-section">
                <h4>Report Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Report Type:</span>
                    <span className={`value status-badge status-${selectedWorkReport.reportType}`}>
                      {selectedWorkReport.reportType?.charAt(0).toUpperCase() + selectedWorkReport.reportType?.slice(1)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Project:</span>
                    <span className="value">{selectedWorkReport.projectName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Date/Period:</span>
                    <span className="value">
                      {selectedWorkReport.reportType === 'daily' 
                        ? selectedWorkReport.reportDate 
                        : `${selectedWorkReport.weekStartDate} to ${selectedWorkReport.weekEndDate}`
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Submitted By:</span>
                    <span className="value">{selectedWorkReport.submittedBy}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Submitted At:</span>
                    <span className="value">
                      {selectedWorkReport.submittedAt 
                        ? new Date(selectedWorkReport.submittedAt).toLocaleString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">Status:</span>
                    <span className={`value status-badge status-${selectedWorkReport.status}`}>
                      {selectedWorkReport.status?.charAt(0).toUpperCase() + selectedWorkReport.status?.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div className="report-section">
                <h4>Work Description</h4>
                <div className="description-content">
                  <p><strong>Work Done:</strong></p>
                  <p>{selectedWorkReport.workDescription || 'No description provided'}</p>
                  
                  {selectedWorkReport.tasksCompleted && (
                    <>
                      <p><strong>Tasks Completed:</strong></p>
                      <p>{selectedWorkReport.tasksCompleted}</p>
                    </>
                  )}
                  
                  {selectedWorkReport.tasksInProgress && (
                    <>
                      <p><strong>Tasks In Progress:</strong></p>
                      <p>{selectedWorkReport.tasksInProgress}</p>
                    </>
                  )}
                  
                  {selectedWorkReport.tasksPlanned && (
                    <>
                      <p><strong>Tasks Planned:</strong></p>
                      <p>{selectedWorkReport.tasksPlanned}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Materials Used */}
              {selectedWorkReport.materialsUsed && selectedWorkReport.materialsUsed.length > 0 && (
                <div className="report-section">
                  <h4>Materials Used</h4>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Quantity</th>
                          <th>Unit</th>
                          <th>Cost (Ksh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWorkReport.materialsUsed.map((material, index) => (
                          <tr key={index}>
                            <td>{material.item || 'N/A'}</td>
                            <td>{material.quantity || 'N/A'}</td>
                            <td>{material.unit || 'N/A'}</td>
                            <td>{material.cost ? `Ksh${parseFloat(material.cost).toLocaleString()}` : 'N/A'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="3"><strong>Total Materials Cost:</strong></td>
                          <td>
                            <strong>
                              Ksh{selectedWorkReport.materialsUsed.reduce((total, material) => 
                                total + (parseFloat(material.cost) || 0), 0
                              ).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Labor and Equipment */}
              <div className="report-section">
                <h4>Labor and Equipment</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Workers Present:</span>
                    <span className="value">{selectedWorkReport.workersPresent || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Work Hours:</span>
                    <span className="value">{selectedWorkReport.workHours || 'N/A'}</span>
                  </div>
                </div>
                {selectedWorkReport.laborDetails && (
                  <div className="description-content">
                    <p><strong>Labor Details:</strong></p>
                    <p>{selectedWorkReport.laborDetails}</p>
                  </div>
                )}
                {selectedWorkReport.equipmentUsed && (
                  <div className="description-content">
                    <p><strong>Equipment Used:</strong></p>
                    <p>{selectedWorkReport.equipmentUsed}</p>
                  </div>
                )}
              </div>

              {/* Conditions and Challenges */}
              <div className="report-section">
                <h4>Conditions and Challenges</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Weather Conditions:</span>
                    <span className="value">{selectedWorkReport.weatherConditions || 'N/A'}</span>
                  </div>
                </div>
                {selectedWorkReport.challenges && (
                  <div className="description-content">
                    <p><strong>Challenges Faced:</strong></p>
                    <p>{selectedWorkReport.challenges}</p>
                  </div>
                )}
                {selectedWorkReport.recommendations && (
                  <div className="description-content">
                    <p><strong>Recommendations:</strong></p>
                    <p>{selectedWorkReport.recommendations}</p>
                  </div>
                )}
              </div>

              {/* Photos */}
              {selectedWorkReport.photos && selectedWorkReport.photos.length > 0 && (
                <div className="report-section">
                  <h4>Photos ({selectedWorkReport.photos.length})</h4>
                  <div className="media-gallery">
                    {selectedWorkReport.photos.map((photo, index) => (
                      <div key={index} className="media-item">
                        <img 
                          src={photo.url} 
                          alt={photo.name || `Photo ${index + 1}`}
                          className="report-image"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <div className="media-info">
                          <span className="media-name">{photo.name || `Photo ${index + 1}`}</span>
                          {photo.size && (
                            <span className="media-size">
                              {(photo.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selectedWorkReport.videos && selectedWorkReport.videos.length > 0 && (
                <div className="report-section">
                  <h4>Videos ({selectedWorkReport.videos.length})</h4>
                  <div className="media-gallery">
                    {selectedWorkReport.videos.map((video, index) => (
                      <div key={index} className="media-item">
                        <video 
                          controls 
                          className="report-video"
                          preload="metadata"
                        >
                          <source src={video.url} type={video.type || 'video/mp4'} />
                          Your browser does not support the video tag.
                        </video>
                        <div className="media-info">
                          <span className="media-name">{video.name || `Video ${index + 1}`}</span>
                          {video.size && (
                            <span className="media-size">
                              {(video.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedWorkReport.notes && (
                <div className="report-section">
                  <h4>Additional Notes</h4>
                  <div className="description-content">
                    <p>{selectedWorkReport.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeWorkReportModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}