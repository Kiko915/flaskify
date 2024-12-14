import { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from '../app/CartContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const { fetchCart, clearCart } = useCart();

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5555/current_user", {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 302) {
        // Handle redirect by following it
        const redirectUrl = response.headers.get('Location');
        if (redirectUrl) {
          const redirectResponse = await fetch(redirectUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          if (redirectResponse.ok) {
            const userData = await redirectResponse.json();
            setUser(userData);
            await fetchCart();
            return;
          }
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          const data = await response.json();
          if (data.code === 'SESSION_EXPIRED') {
            setShowSessionExpired(true);
          }
          setUser(null);
          clearCart();
          return;
        }
        throw new Error('Network response was not ok');
      }

      const userData = await response.json();
      setUser(userData);
      await fetchCart();
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      clearCart();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await fetch("http://localhost:5555/login", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      await fetchUser();
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const response = await fetch("http://localhost:5555/logout", {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      setUser(null);
      clearCart();
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const handleSessionExpiredClose = () => {
    setShowSessionExpired(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        fetchUser,
        showSessionExpired,
        handleSessionExpiredClose 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);