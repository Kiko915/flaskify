import { useRef } from 'react';
import { Clock, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import useWifiStrength from '@/hooks/use-wifi';
import { useNetworkState } from 'react-use';

const AbstractPattern = ({ className }) => (
  <div className={`absolute inset-0 overflow-hidden opacity-20 ${className}`}>
    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-xl"></div>
    <div className="absolute right-8 bottom-8 w-24 h-24 rounded-full blur-lg"></div>
    <div className="absolute left-12 top-12 w-16 h-16 rounded-full blur-md"></div>
    <svg className="absolute right-0 bottom-0" width="120" height="120" viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8"/>
      <path d="M20 80L100 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="40" y="40" width="40" height="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
    </svg>
  </div>
);

function GreetingTab({ username, role = 'user' }) {
    const state = useNetworkState();
    console.log(state);

  const getRoleBadgeConfig = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return {
          text: 'Admin Account',
          bgColor: 'bg-red-500'
        };
      case 'seller':
        return {
          text: 'Seller Account',
          bgColor: 'bg-yellow-500'
        };
      default:
        return {
          text: 'User Account',
          bgColor: 'bg-blue-500'
        };
    }
  };

  const getGreetingConfig = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return {
        text: 'Good Morning',
        Icon: Sun,
        bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600',
        patternColor: 'text-orange-200',
        accentColor: 'bg-orange-500'
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: 'Good Afternoon',
        Icon: Clock,
        bgColor: 'bg-gradient-to-br from-yellow-50 to-orange-50',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
        patternColor: 'text-yellow-200',
        accentColor: 'bg-yellow-500'
      };
    } else {
      return {
        text: 'Good Evening',
        Icon: Moon,
        bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
        textColor: 'text-indigo-800',
        iconColor: 'text-indigo-600',
        patternColor: 'text-indigo-200',
        accentColor: 'bg-indigo-500'
      };
    }
  };

  const { text, Icon, bgColor, textColor, iconColor, patternColor, accentColor } = getGreetingConfig();
  
  return (
    <div className={`relative ${bgColor} p-8 rounded-2xl shadow-lg w-full transition-all duration-300 hover:shadow-xl overflow-hidden motion-preset-fade`}>
      <AbstractPattern className={patternColor} />
      
      <div className="relative flex items-start space-x-4">
        <div className={`p-3 rounded-2xl ${accentColor} bg-opacity-10 backdrop-blur-sm`}>
          <Icon className={`${iconColor} w-8 h-8`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className={`${textColor} text-2xl font-bold tracking-tight`}>
              {text}, <span>{username}</span>!
            </h2>
            {/** Dynamic Role Badge */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${getRoleBadgeConfig(role).bgColor} text-white font-medium rounded-full px-2 py-1`}>
                {getRoleBadgeConfig(role).text}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mt-2 font-medium">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GreetingTab;