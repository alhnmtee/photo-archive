import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/login';
import { Dashboard } from './pages/Dashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 dakika
      cacheTime: 30 * 60 * 1000, // 30 dakika
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <ColorModeScript initialColorMode="light" />
        <ThemeProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default App;