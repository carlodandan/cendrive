import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  UserPlus,
  FileText,
  Settings,
  Database,
  Edit2,
  BarChart3,
  Users,
  User
} from 'lucide-react'

const Sidebar = ({ stats, pageType = 'dashboard' }) => {
  const location = useLocation()
  const currentPath = location.pathname

  // Navigation items for all pages
  const navItems = [
    {
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      active: currentPath === '/dashboard',
      colorClass: currentPath === '/dashboard' ? 'text-gray-300' : 'text-gray-400'
    },
    {
      path: '/data-entry',
      icon: <UserPlus className="w-5 h-5" />,
      label: 'Data Entry',
      active: currentPath === '/data-entry',
      colorClass: currentPath === '/data-entry' ? 'text-cyan-400' : 'text-gray-400'
    },
    {
      path: '/reports',
      icon: <FileText className="w-5 h-5" />,
      label: 'Reports',
      active: currentPath === '/reports',
      colorClass: currentPath === '/reports' ? 'text-gray-300' : 'text-gray-400'
    },
    {
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      active: currentPath === '/settings',
      colorClass: currentPath === '/settings' ? 'text-gray-300' : 'text-gray-400'
    }
  ]

  // Determine icon and title based on page type
  const getPageInfo = () => {
    switch(pageType) {
      case 'data-entry':
        return {
          icon: <Edit2 className="w-7 h-7 text-white" />,
          title: 'Data Entry',
          subtitle: 'Add New Census Record'
        }
      case 'reports':
        return {
          icon: <BarChart3 className="w-7 h-7 text-white" />,
          title: 'Census Analytics',
          subtitle: 'Data Management System'
        }
      default: // dashboard
        return {
          icon: <Database className="w-7 h-7 text-white" />,
          title: '<span className="text-amber-300">Cen</span>Drive',
          subtitle: 'Data Management System'
        }
    }
  }

  const pageInfo = getPageInfo()

  return (
    <div className="w-64 h-full bg-gray-800/50 border-r border-gray-700 p-6 flex flex-col">
      {/* Logo/Header Section */}
      <div className="mb-8">
        <div className="w-12 h-12 bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
          {pageInfo.icon}
        </div>
        <h3 
          className="text-gray-300 font-semibold mb-2" 
          dangerouslySetInnerHTML={{ __html: pageInfo.title }}
        />
        <p className="text-gray-500 text-sm">{pageInfo.subtitle}</p>
      </div>

      {/* Navigation Links */}
      <div className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`block p-3 rounded-lg transition-colors duration-200 ${
              item.active
                ? 'bg-gray-700/30 border-l-4 border-cyan-500'
                : 'hover:bg-gray-700/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={item.colorClass}>{item.icon}</div>
              <span className={`${item.active ? 'text-gray-300 font-medium' : item.colorClass}`}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Database Stats Section - Only show on dashboard if stats provided */}
      {stats && pageType === 'dashboard' && (
        <div className="mt-auto p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <h4 className="text-gray-300 font-medium mb-3 text-sm flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Database Stats</span>
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs flex items-center space-x-2">
                <Home className="w-3 h-3" />
                <span>Households:</span>
              </span>
              <span className="text-cyan-400 font-medium">{stats.total_households || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs flex items-center space-x-2">
                <Users className="w-3 h-3" />
                <span>Family Members:</span>
              </span>
              <span className="text-cyan-400 font-medium">{stats.total_family_members || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs flex items-center space-x-2">
                <User className="w-3 h-3" />
                <span>Avg Family Size:</span>
              </span>
              <span className="text-cyan-400 font-medium">
                {stats.avg_family_size ? Math.round(stats.avg_family_size * 10) / 10 : 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar