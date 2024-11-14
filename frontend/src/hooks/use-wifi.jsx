import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const useWifiStrength = () => {
    const [wifiStrength, setWifiStrength] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
  
    useEffect(() => {
      const checkWifiStrength = async () => {
        try {
          if ('connection' in navigator && navigator.connection) {
            const connection = navigator.connection;
            
            if (connection.type === 'wifi') {
              const downlink = connection.downlink;
              if (downlink >= 10) setWifiStrength('Excellent');
              else if (downlink >= 5) setWifiStrength('Good');
              else if (downlink >= 2) setWifiStrength('Fair');
              else setWifiStrength('Weak');
            } else {
              setWifiStrength('Not WiFi');
            }
          } else {
            setWifiStrength(isOnline ? 'Connected' : 'Offline');
          }
        } catch (error) {
          console.error('Error checking WiFi strength:', error);
          setWifiStrength('Unknown');
        }
      };
  
      const handleOnlineStatus = () => {
        setIsOnline(navigator.onLine);
        checkWifiStrength();
      };
  
      // Initial check
      checkWifiStrength();
  
      // Event listeners for online/offline status
      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);
  
      // Periodic checks
      const interval = setInterval(checkWifiStrength, 10000);
  
      return () => {
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
        clearInterval(interval);
      };
    }, [isOnline]);
  
    const getWifiIcon = () => {
      if (!isOnline) return <WifiOff className="w-4 h-4" />;
      
      const opacity = {
        'Excellent': 'opacity-100',
        'Good': 'opacity-85',
        'Fair': 'opacity-70',
        'Weak': 'opacity-50',
        'Not WiFi': 'opacity-40',
        'Unknown': 'opacity-60',
        'Connected': 'opacity-100',
        'Offline': 'opacity-30'
      }[wifiStrength];
  
      return <Wifi className={`w-4 h-4 ${opacity}`} />;
    };
  
    return {
      wifiStrength,
      isOnline,
      getWifiIcon,
    };
  };

export default useWifiStrength;