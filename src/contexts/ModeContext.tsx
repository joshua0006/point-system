import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ModeContextType {
  isSellerMode: boolean;
  toggleMode: () => void;
  canAccessSellerMode: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [isSellerMode, setIsSellerMode] = useState(false);
  
  // Check if user can access seller mode (must be consultant or admin)
  const canAccessSellerMode = profile?.role === 'consultant' || profile?.role === 'admin';

  // Load saved mode preference from localStorage
  useEffect(() => {
    if (canAccessSellerMode) {
      const savedMode = localStorage.getItem('seller-mode');
      if (savedMode === 'true') {
        setIsSellerMode(true);
      }
    } else {
      // If user can't access seller mode, ensure it's disabled
      setIsSellerMode(false);
      localStorage.removeItem('seller-mode');
    }
  }, [canAccessSellerMode]);

  const toggleMode = () => {
    if (!canAccessSellerMode) return;
    
    const newMode = !isSellerMode;
    setIsSellerMode(newMode);
    localStorage.setItem('seller-mode', newMode.toString());
  };

  const value = {
    isSellerMode,
    toggleMode,
    canAccessSellerMode,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useMode = () => {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};