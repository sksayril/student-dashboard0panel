import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import ConfirmModal from './components/ConfirmModal';
import { ToastProvider, useToast } from './components/ToastContainer';
import { api } from './api';
import { studentData } from './data/mockData';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { showSuccess, showInfo } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (token && storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        // Token is stored in localStorage, available for future API calls
        setUserData(parsedUserData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUserData(userData);
    setIsAuthenticated(true);
  };

  const handleDemoLogin = () => {
    // Demo login - no credentials needed, use mock data
    const demoUserData = {
      id: 'demo-user',
      name: 'James Demo',
      email: 'demo@adhyanguru.com',
      role: 'student',
    };
    setUserData(demoUserData);
    setIsAuthenticated(true);
    localStorage.setItem('userData', JSON.stringify(demoUserData));
    localStorage.setItem('authToken', 'demo-token');
    showSuccess('Welcome to Demo Mode! 🎉');
  };

  const handleLogoutClick = () => {
    // Show confirmation modal
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    
    try {
      const result = await api.logout();

      if (result.success) {
        showSuccess('Logged out successfully! 👋');
      } else {
        // Even if API fails, we'll log out locally
        showInfo('Logged out from this device');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still log out locally even if API fails
      showInfo('Logged out from this device');
    } finally {
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Clear state
      setIsAuthenticated(false);
      setUserData(null);
      setCurrentView('dashboard');
      setShowLogoutModal(false);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onDemoLogin={handleDemoLogin} />;
  }

  return (
    <>
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will need to login again to access your dashboard."
        confirmText={isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
        cancelText="No, Stay"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        type="warning"
      />
      
      <div className="flex min-h-screen bg-blue-50">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogoutClick} userData={userData} />
      <div className="flex-1" style={{ marginLeft: '80px' }}>
        {currentView === 'dashboard' && <Dashboard data={studentData} userData={userData} />}
        {currentView === 'analytics' && (
          <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-xl">Analytics View Coming Soon</p>
          </div>
        )}
        {currentView === 'messages' && (
          <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-xl">Messages View Coming Soon</p>
          </div>
        )}
        {currentView === 'settings' && (
          <div className="flex items-center justify-center h-screen bg-blue-900">
            <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Settings</h2>
              {userData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold text-gray-800">{userData.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-800">{userData.email}</span>
                  </div>
                  {userData.contactNumber && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-semibold text-gray-800">{userData.contactNumber}</span>
                    </div>
                  )}
                  {userData.studentLevel && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-semibold text-gray-800">{userData.studentLevel.name || userData.studentLevel}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-semibold text-blue-600 capitalize">{userData.role}</span>
                  </div>
                  {userData.lastLogin && (
                    <div className="flex items-center justify-between py-3">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-semibold text-gray-800">{new Date(userData.lastLogin).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
