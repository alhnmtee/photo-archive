
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './pages/login';
import { Dashboard } from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { TestPage } from './pages/TestPage';

function App() {
  return (
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;