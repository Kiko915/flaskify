import { useState } from 'react';
import { User, CreditCard, MapPin, KeyRound, Settings, Bell, ShoppingBag, Ticket, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import UserProfileImage from './UserProfileImage';
import { useAuth } from '../../utils/AuthContext';

const UserSidebar = () => {
  const { user } = useAuth();
  const [openMenuId, setOpenMenuId] = useState(null);
  const location = useLocation();

  const menuItems = [
    {
      id: 'account',
      title: 'My Account',
      icon: <User className="w-5 h-5" />,
      subItems: [
        { title: 'Profile', href: '/user/account', icon: <User className="w-4 h-4" /> },
        { title: 'Banks & Cards', href: '/user/account/payment-methods', icon: <CreditCard className="w-4 h-4" /> },
        { title: 'Addresses', href: '/user/account/addresses', icon: <MapPin className="w-4 h-4" /> },
        { title: 'Change Password', href: '/user/account/change-password', icon: <KeyRound className="w-4 h-4" /> },
        { title: 'Privacy Settings', href: '/user/account/privacy', icon: <Settings className="w-4 h-4" /> },
        { title: 'Notification Settings', href: '/user/account/notifications', icon: <Bell className="w-4 h-4" /> },
      ],
    },
    {
      id: 'purchase',
      title: 'My Purchase',
      href: '/user/purchases',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      href: '/user/notifications',
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: 'vouchers',
      title: 'My Vouchers',
      href: '/user/vouchers',
      icon: <Ticket className="w-5 h-5" />,
    }
  ];
  const toggleMenu = (menuId) => {
    setOpenMenuId(openMenuId === menuId ? null : menuId);
  };

  const renderMenuItem = (item) => {
    if (item.subItems) {
      return (
        <button
          onClick={() => toggleMenu(item.id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
            openMenuId === item.id ? 'bg-gray-100' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span className="font-medium">{item.title}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              openMenuId === item.id ? 'transform rotate-180' : ''
            }`}
          />
        </button>
      );
    }

    return (
      <Link
        to={item.href}
        className={`w-full flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
          location.pathname === item.href ? 'bg-gray-100' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          {item.icon}
          <span className="font-medium">{item.title}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-8">
          <UserProfileImage />
          <div>
            <h2 className="text-gray-800 font-medium">{user?.username}</h2>
            <Link to="/user/account" className="text-gray-500 text-sm flex items-center gap-1">
              <Settings className="w-4 h-4" /> Edit Profile
            </Link>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id} className="space-y-1">
              {renderMenuItem(item)}
              {item.subItems && (
                <div
                  className={`ml-8 space-y-1 overflow-hidden transition-all duration-200 ease-in-out ${
                    openMenuId === item.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={subItem.href}
                      className={`flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
                        location.pathname === subItem.href ? 'bg-gray-100' : ''
                      }`}
                    >
                      {subItem.icon}
                      <span>{subItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default UserSidebar;