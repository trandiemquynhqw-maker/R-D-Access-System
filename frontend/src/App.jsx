import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalLayout from './components/GlobalLayout';
import LoginPage from './pages/LoginPage';
import DeviceRegistrationPage from './pages/DeviceRegistrationPage';
import CheckInPage from './pages/CheckInPage';
import ApprovalPage from './pages/ApprovalPage';
import DashboardPage from './pages/DashboardPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import UserManagementPage from './pages/UserManagementPage';
import PersonalStatsPage from './pages/PersonalStatsPage';
import DeviceQRTagsPage from './pages/DeviceQRTagsPage';
import SecurityVerifyPage from './pages/SecurityVerifyPage';
import PlaceholderPage from './pages/PlaceholderPage';
import RulesPage from './pages/RulesPage';
import SupportPage from './pages/SupportPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterDevicePage from './pages/RegisterDevicePage';
import SessionManagementPage from './pages/SessionManagementPage';
import AuditorDashboard from './pages/AuditorDashboard';
import AuditorAuditLogsPage from './pages/AuditorAuditLogsPage';
import './styles/index.css';

// Redirect theo role
const getRedirectPath = (role) => {
  switch (role) {
    case 'engineer':
      return '/devices';
    case 'manager':
      return '/dashboard';
    case 'security':
      return '/dashboard';
    case 'auditor':
      return '/auditor-dashboard';
    default:
      return '/dashboard';
  }
};

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <main>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={user ? <Navigate to={getRedirectPath(user.role)} /> : <LoginPage />} />

            {/* Standalone Route (Kiosk) - No GlobalLayout, Fully Public */}
            <Route path="/check-in" element={<CheckInPage />} />

            {/* Protected Routes wrapped in GlobalLayout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole={['security', 'manager', 'admin']}>
                  <GlobalLayout>
                    <DashboardPage />
                  </GlobalLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/devices"
              element={
                <ProtectedRoute requiredRole="engineer">
                  <GlobalLayout>
                    <DeviceRegistrationPage />
                  </GlobalLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/approvals"
              element={
                <ProtectedRoute requiredRole={['security', 'manager', 'admin']}>
                  <GlobalLayout>
                    <ApprovalPage />
                  </GlobalLayout>
                </ProtectedRoute>
              }
            />

            {/* Extra Routes mapped to Placeholder */}
            {/* Engineer Routes */}
            <Route path="/engineer-stats" element={<ProtectedRoute requiredRole="engineer"><GlobalLayout><PersonalStatsPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/register-device" element={<ProtectedRoute requiredRole="engineer"><GlobalLayout><RegisterDevicePage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/qr-tags" element={<ProtectedRoute requiredRole="engineer"><GlobalLayout><DeviceQRTagsPage /></GlobalLayout></ProtectedRoute>} />
            
            <Route path="/users" element={<ProtectedRoute requiredRole={['security', 'manager', 'admin']}><GlobalLayout><UserManagementPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/activity" element={<ProtectedRoute requiredRole={['security', 'manager', 'admin']}><GlobalLayout><ActivityLogsPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/verify" element={<ProtectedRoute requiredRole={['security', 'manager', 'admin']}><GlobalLayout><SecurityVerifyPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute requiredRole={['security', 'manager', 'admin']}><GlobalLayout><ActivityLogsPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute requiredRole={['admin']}><GlobalLayout><SessionManagementPage /></GlobalLayout></ProtectedRoute>} />
            
            {/* Auditor Routes */}
            <Route path="/auditor-dashboard" element={<ProtectedRoute requiredRole={['admin', 'auditor']}><GlobalLayout><AuditorDashboard /></GlobalLayout></ProtectedRoute>} />
            <Route path="/auditor-audit-logs" element={<ProtectedRoute requiredRole={['admin', 'auditor']}><GlobalLayout><AuditorAuditLogsPage /></GlobalLayout></ProtectedRoute>} />

            {/* Global Utility Routes */}
            <Route path="/rules" element={<ProtectedRoute requiredRole={['engineer', 'security', 'manager', 'admin', 'auditor']}><GlobalLayout><RulesPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute requiredRole={['engineer', 'security', 'manager', 'admin', 'auditor']}><GlobalLayout><SupportPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRole={['engineer', 'security', 'manager', 'admin', 'auditor']}><GlobalLayout><SettingsPage /></GlobalLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute requiredRole={['engineer', 'security', 'manager', 'admin', 'auditor']}><GlobalLayout><ProfilePage /></GlobalLayout></ProtectedRoute>} />
            
            {/* Catch all */}
            <Route path="/" element={user ? <Navigate to={getRedirectPath(user.role)} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={user ? getRedirectPath(user.role) : '/login'} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
