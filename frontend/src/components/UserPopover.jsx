import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import UserProfileImage from './user/UserProfileImage';

const UserPopover = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/auth/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (!user) return null;

    // Create a display name from first_name and last_name if available
    const displayName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : user.email;

    return (
        <Popover className="relative">
            <PopoverButton className="flex items-center gap-1 cursor-pointer hover:text-yellow-600 data-[headlessui-state~=open]:text-yellow-600 data-[headlessui-state~=open]:outline-none outline-none">
                <span className='flex items-center gap-1'>
                    <UserProfileImage size='sm' />
                    <span className='truncate'>{displayName}</span>
                </span>
            </PopoverButton>
            <PopoverPanel className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                        <div className="text-sm font-medium">{displayName}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                    <Link to="/user/account" className="block px-4 py-2 hover:bg-gray-100">
                        Account Settings
                    </Link>
                    <Link to="/user/purchases" className="block px-4 py-2 hover:bg-gray-100">
                        My Purchases
                    </Link>
                    {user.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-2 hover:bg-gray-100">
                            Admin Dashboard
                        </Link>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                        Logout
                    </button>
                </div>
            </PopoverPanel>
        </Popover>
    );
};

export default UserPopover;