import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Courses from './components/Courses';
import EnrolledCourses from './components/EnrolledCourses';
import CourseDetail from './components/CourseDetail';
import Profile from './components/Profile';
import SubscriptionPage from './components/Subscription';
import Analytics from './components/Analytics';
import LoginPage from './components/LoginPage';
import ConfirmModal from './components/ConfirmModal';
import Watermark from './components/Watermark';
import { ToastProvider, useToast } from './components/ToastContainer';
import { api } from './api';
import { studentData } from './data/mockData';
import { User } from './api/types';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
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
      setSelectedCourseId(null);
      setShowLogoutModal(false);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleCourseClick = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('course-detail');
  };

  const handleBackToCourses = () => {
    setSelectedCourseId(null);
    setCurrentView('courses');
  };

  const handleProfileUpdate = (updatedData: User) => {
    setUserData(updatedData);
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
      
      <div className="flex min-h-screen bg-blue-50 relative">
        <Watermark text="AG" opacity={0.03} fontSize="15rem" />
        <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogoutClick} userData={userData} />
      <div className="flex-1 relative" style={{ marginLeft: '80px' }}>
        {currentView === 'dashboard' && (
          <Dashboard 
            data={studentData} 
            userData={userData}
            onCourseClick={handleCourseClick}
          />
        )}
        {currentView === 'courses' && <Courses userData={userData} onCourseClick={handleCourseClick} onNavigateToEnrolled={() => setCurrentView('enrolled-courses')} />}
        {currentView === 'enrolled-courses' && (
          <EnrolledCourses 
            userData={userData} 
            onCourseClick={handleCourseClick}
            onNavigateToAvailable={() => setCurrentView('courses')}
          />
        )}
        {currentView === 'course-detail' && selectedCourseId && (
          <CourseDetail 
            courseId={selectedCourseId} 
            userData={userData} 
            onBack={() => {
              // Go back to the previous view
              setCurrentView('courses');
              setSelectedCourseId(null);
            }}
            onEnrollmentSuccess={() => {
              // Optionally navigate to enrolled courses after enrollment
              // setCurrentView('enrolled-courses');
            }}
          />
        )}
        {currentView === 'analytics' && (
          <Analytics userData={userData} />
        )}
        {currentView === 'messages' && (
          <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-xl">Messages View Coming Soon</p>
          </div>
        )}
        {currentView === 'subscription' && (
          <SubscriptionPage userData={userData} />
        )}
        {currentView === 'settings' && (
          <Profile 
            userData={userData}
            onProfileUpdate={handleProfileUpdate}
          />
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
