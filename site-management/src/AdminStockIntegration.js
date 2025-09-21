// Simple integration for AdminDashboard - add this to the appropriate section

const renderStockManagement = () => (
  <StockManagement 
    userRole="Admin"
    currentUserData={currentUserData}
    projects={projects}
  />
);

// Add this to the main content area where other sections are rendered:
// {activeSection === 'stock' && renderStockManagement()}

// And add this to the navigation:
/*
<li>
  <a 
    href="#" 
    className={activeSection === 'stock' ? 'active' : ''} 
    onClick={() => setActiveSection('stock')}
  >
    <FaBox className="nav-icon" />
    <span>Stock Management</span>
  </a>
</li>
*/