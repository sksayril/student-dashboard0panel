import { LayoutGrid, BarChart3, MessageSquare, Settings, LogOut, BookOpen, Crown } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  userData?: any;
}

export default function Sidebar({ currentView, onViewChange, onLogout, userData }: SidebarProps) {
  const [isExpanded] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'courses', icon: BookOpen, label: 'Courses' },
    { id: 'subscription', icon: Crown, label: 'Subscription' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full bg-gradient-to-b from-blue-100 to-white flex flex-col items-center py-8 shadow-lg z-10" style={{ width: '80px' }}>
      <div className="mb-12">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
          S
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-8">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
              currentView === item.id
                ? 'bg-white shadow-md text-gray-700'
                : 'text-gray-400 hover:bg-white/50'
            }`}
            title={item.label}
          >
            <item.icon size={24} />
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <button 
          onClick={onLogout}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
          title="Logout"
        >
          <LogOut size={24} />
        </button>
        <button 
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform"
          title={userData?.name || 'User'}
        >
          {userData?.profileImage ? (
            <img
              src={userData.profileImage}
              alt={userData.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {userData?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
