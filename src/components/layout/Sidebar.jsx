import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  UserCircle,
  FolderKanban,
  CheckSquare,
  Wallet,
  CalendarCheck,
  ClipboardList,
  Bell,
  LogOut,
  X,
  BookOpen,
  FileText,
  Search,
  Inbox,
  Video,
  MessageSquare,
  Package,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.jsx';

const menus = {
  manager: [
    {
      to: '/manager/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    
    {
      to: '/manager/employees',
      label: 'Employees',
      icon: Users,
    },
    {
      to: '/manager/clients',
      label: 'Clients',
      icon: UserCircle,
    },
    {
      to: '/manager/projects',
      label: 'Projects',
      icon: FolderKanban,
    },
    {
      to: '/manager/payments',
      label: 'Payments',
      icon: Wallet,
    },
    {
      to: '/manager/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
    },
    {
      to: '/manager/daily-status',
      label: 'Daily Status',
      icon: ClipboardList,
    },
    {
      to: '/manager/notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
  to: '/manager/client-requests',
  label: 'Client Requests',
  icon: Inbox,  // naya icon
},

    // Messages
    {
      to: '/manager/messages',
      label: 'Messages',
      icon: MessageSquare,
    },

    {
      to: '/manager/guides',
      label: 'Guides',
      icon: BookOpen,
    },
    {
      to: '/manager/details',
      label: 'Details',
      icon: FileText,
    },
    {
      to: '/manager/seo',
      label: 'SEO',
      icon: Search,
    },
    {
      to: '/manager/seo/plans',
      label: 'SEO Plans',
      icon: ClipboardList,
    },
     {
    to: '/manager/products',
    label: 'Products',
    icon: Package,
  },
  ],

  sales: [
    {
      to: '/sales/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/sales/clients',
      label: 'My Clients',
      icon: UserCircle,
    },
    {
      to: '/sales/projects',
      label: 'My Projects',
      icon: FolderKanban,
    },
    {
      to : '/sales/client-requests',
      label: 'Client Requests',
      icon: Inbox,
    },
    {
      to: '/sales/payments',
      label: 'Payments',
      icon: Wallet,
    },
      {
    to: '/sales/products',
    label: 'Products',
    icon: Package,
  },
    {
      to: '/sales/daily-status',
      label: 'Daily Status',
      icon: ClipboardList,
    },
    {
      to: '/sales/attendance',
      label: 'Attendance',
      icon: CalendarCheck,
    },
    {
      to: '/sales/notifications',
      label: 'Notifications',
      icon: Bell,
    },

    // Messages
    {
      to: '/sales/messages',
      label: 'Messages',
      icon: MessageSquare,
    },
  ],

 developer: [
  {
    to: '/developer/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },

  {
    to: '/developer/projects',
    label: 'My Projects',
    icon: FolderKanban,
  },

  {
    to: '/developer/tasks',
    label: 'My Tasks',
    icon: CheckSquare,
  },

  {
    to: '/developer/daily-status',
    label: 'Daily Status',
    icon: ClipboardList,
  },

  {
    to: '/developer/attendance',
    label: 'Attendance',
    icon: CalendarCheck,
  },

  {
    to: '/developer/notifications',
    label: 'Notifications',
    icon: Bell,
  },

  {
    to: '/developer/messages',
    label: 'Messages',
    icon: MessageSquare,
  },

  {
    to: '/developer/guide',
    label: 'Guide',
    icon: BookOpen,
  },

  {
    to: '/developer/details',
    label: 'Details',
    icon: FileText,
  },
],

  client: [
    {
      to: '/client/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },

    {
      to: '/client/projects',
      label: 'My Projects',
      icon: FolderKanban,
    },

   {
    to: '/client/meetings',
    label: 'My Meetings',
    icon: Video,
  },


    {
      to: '/client/payments',
      label: 'Payments',
      icon: Wallet,
    },

     {
    to: '/client/products',
    label: 'Products',
    icon: Package,
  },

    {
      to: '/client/messages',
      label: 'Messages',
      icon: MessageSquare,
    },

    
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const items = menus[user.role] || [];

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-0
          left-0
          bottom-0
          z-40
          w-64
          bg-gray-900
          text-white
          flex
          flex-col
          transition-transform
          duration-300
          ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h1 className="font-bold text-lg">
              Zwolf
            </h1>

            <p className="text-xs text-gray-400 capitalize">
              {user.role}
            </p>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <item.icon size={18} />

              <span>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom User Section */}
        <div className="flex-shrink-0 p-3 border-t border-gray-800 bg-gray-900">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium truncate">
              {user.name}
            </p>

            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}