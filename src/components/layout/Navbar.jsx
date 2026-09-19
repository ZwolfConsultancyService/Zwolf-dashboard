import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationDropdown from '../NotificationDropdown.jsx';

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-gray-800 capitalize">
            {user?.role} Panel
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <NotificationDropdown />
          <div className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.charAt(0)}
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
}