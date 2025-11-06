import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import SummaryApi from '../common';
// Create context
const AuthContext = createContext();
// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [loading, setLoading] = useState(false);
  const hasFetchedProfileRef = useRef(false);

  // Keep user state in sync across tabs/windows
  useEffect(() => {
    const handleStorageSync = (event) => {
      if (event.key !== 'user') return;

      try {
        const nextUser = event.newValue ? JSON.parse(event.newValue) : null;
        setUser(nextUser);
        if (!nextUser) {
          hasFetchedProfileRef.current = false;
        }
      } catch (parseError) {
        console.error('Failed to parse user data from storage event:', parseError);
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Refresh user profile once per session to ensure latest avatar/details
  useEffect(() => {
    if (!user?._id || hasFetchedProfileRef.current) return;

    const fetchLatestProfile = async () => {
      try {
        const response = await fetch(`${SummaryApi.getUser.url}/${user._id}`, {
          method: SummaryApi.getUser.method,
          credentials: 'include',
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data?.success && data.data) {
          localStorage.setItem('user', JSON.stringify(data.data));
          setUser(data.data);
        }
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    };

    hasFetchedProfileRef.current = true;
    fetchLatestProfile();
  }, [user?._id]);
  
  // Login function
  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await fetch(SummaryApi.logIn.url, {
        method: SummaryApi.logIn.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
     
      const data = await response.json();
     
      if (data.success) {
        // Store user data in localStorage and state
        localStorage.setItem('user', JSON.stringify(data.data));
        setUser(data.data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Server error' };
    } finally {
      setLoading(false);
    }
  };
  // Logout function
  const logout = async () => {
    try {
      // Clear user from localStorage and state
      localStorage.removeItem('user');
      setUser(null);
      hasFetchedProfileRef.current = false;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // New function to update user context
  const updateUserContext = (updatedUserData) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    hasFetchedProfileRef.current = false;
  };

  // Context values to be provided
  const value = {
    user,
    loading,
    login,
    logout,
    updateUserContext,
    isAuthenticated: !!user
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
