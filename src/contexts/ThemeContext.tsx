import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

type ViewMode = 'grid' | 'list' | 'timeline' | 'calendar' | 'users' | 'yearMonth';

type GridSize = 'small' | 'medium' | 'large' | 'xlarge';

type ThemeContextType = {
  viewMode: ViewMode;
  gridSize: GridSize;  // Tipi güncelle
  setViewMode: (mode: ViewMode) => void;
  setGridSize: (size: GridSize) => void;  // Tipi güncelle
  toggleColorMode: () => void;
  colorMode: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridSize, setGridSize] = useState<GridSize>('medium');
  const { colorMode, toggleColorMode } = useColorMode();

  // Kullanıcı tercihlerini localStorage'dan yükle
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode') as ViewMode;
    const savedGridSize = localStorage.getItem('gridSize') as GridSize;

    if (savedViewMode) setViewMode(savedViewMode);
    if (savedGridSize) setGridSize(savedGridSize);
  }, []);

  // Kullanıcı tercihlerini localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
    localStorage.setItem('gridSize', gridSize);
  }, [viewMode, gridSize]);

  return (
    <ThemeContext.Provider
      value={{
        viewMode,
        gridSize,
        setViewMode,
        setGridSize,
        toggleColorMode,
        colorMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};