import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

import Login from './pages/auth/Login.jsx';

import ManagerDashboard from './pages/manager/Dashboard.jsx';
import ManagerEmployees from './pages/manager/Employees.jsx';
import ManagerClients from './pages/manager/Clients.jsx';
import ManagerClientDetails from './pages/manager/ClientDetails.jsx';
import ManagerProjects from './pages/manager/Projects.jsx';
import ManagerProjectDetails from './pages/manager/ProjectDetails.jsx';
import ManagerPayments from './pages/manager/Payments.jsx';
import ManagerAttendance from './pages/manager/Attendance.jsx';
import ManagerDailyStatus from './pages/manager/DailyStatus.jsx';
import ManagerNotifications from './pages/manager/Notifications.jsx';
import ManagerMessages from './pages/manager/Messages.jsx';
import ManagerActivityLogs from './pages/manager/ActivityLogs.jsx';
import ManagerGuides from './pages/manager/Guides.jsx';
import ManagerDetails from './pages/manager/Details.jsx';

import SalesDashboard from './pages/sales/Dashboard.jsx';
import SalesClients from './pages/sales/Clients.jsx';
import SalesClientDetails from './pages/sales/ClientDetails.jsx';
import SalesProjects from './pages/sales/Projects.jsx';
import SalesPayments from './pages/sales/Payments.jsx';
import SalesDailyStatus from './pages/sales/DailyStatus.jsx';
import SalesAttendance from './pages/sales/Attendance.jsx';
import SalesNotifications from './pages/sales/Notifications.jsx';
import SalesMessages from './pages/sales/Messages.jsx';
import SalesProjectDetails from './pages/sales/ProjectDetails.jsx';

import DeveloperDashboard from './pages/developer/Dashboard.jsx';
import DeveloperProjects from './pages/developer/Projects.jsx';
import DeveloperProjectDetails from './pages/developer/ProjectDetails.jsx';
import DeveloperTasks from './pages/developer/Tasks.jsx';
import DeveloperDailyStatus from './pages/developer/DailyStatus.jsx';
import DeveloperAttendance from './pages/developer/Attendance.jsx';
import DeveloperNotifications from './pages/developer/Notifications.jsx';
import DeveloperMessages from './pages/developer/DeveloperMessages.jsx';
import DeveloperDetails from './pages/developer/Details.jsx';
import Guide from './pages/developer/Guide.jsx';

import ClientDashboard from './pages/client/Dashboard.jsx';

import SEO from './pages/manager/seo/SEO';
import SEOPlans from './pages/manager/seo/SEOPlans';
import ClientProjectDetails from './pages/client/ClientProjectDetails.jsx';
import ClientMessages from './pages/client/ClientMessages.jsx';
import ServiceWorkerHandler from './components/ServiceWorkerHandler.jsx';
import MessageNotifier from './components/MessageNotifier.jsx';
import ManagerClientRequests from './pages/manager/ClientRequests.jsx';
import MyMeetings from './pages/client/MyMeetings.jsx';
import MyProjects from './pages/client/MyProjects.jsx';
import ClientPayments from './pages/client/Payments.jsx';

function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={`/${user.role}/dashboard`}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ServiceWorkerHandler />
      <MessageNotifier />
      <Routes>

        {/* =========================
            ROOT
        ========================== */}
        <Route
          path="/"
          element={<RoleRedirect />}
        />

        {/* =========================
            LOGIN
        ========================== */}

        {/* Common Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Client Login */}
        <Route
          path="/client/login"
          element={<Login />}
        />

        {/* =========================
            MANAGER ROUTES
        ========================== */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute roles={['manager']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />
          <Route path="client-requests" element={<ManagerClientRequests />} />

          <Route
            path="dashboard"
            element={<ManagerDashboard />}
          />

          <Route
            path="employees"
            element={<ManagerEmployees />}
          />

          <Route
            path="clients"
            element={<ManagerClients />}
          />

          <Route
            path="clients/:id"
            element={<ManagerClientDetails />}
          />

          <Route
            path="projects"
            element={<ManagerProjects />}
          />

          <Route
            path="projects/:id"
            element={<ManagerProjectDetails />}
          />

          {/* SEO */}
          <Route
            path="seo"
            element={<SEO />}
          />

          <Route
            path="seo/plans"
            element={<SEOPlans />}
          />

          <Route
            path="payments"
            element={<ManagerPayments />}
          />

          <Route
            path="attendance"
            element={<ManagerAttendance />}
          />

          <Route
            path="daily-status"
            element={<ManagerDailyStatus />}
          />

          <Route
            path="notifications"
            element={<ManagerNotifications />}
          />

          <Route
            path="messages"
            element={<ManagerMessages />}
          />

          <Route
            path="activity-logs"
            element={<ManagerActivityLogs />}
          />

          <Route
            path="guides"
            element={<ManagerGuides />}
          />

          <Route
            path="details"
            element={<ManagerDetails />}
          />
        </Route>

        {/* =========================
            SALES ROUTES
        ========================== */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute roles={['sales']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<SalesDashboard />}
          />

          <Route
            path="clients"
            element={<SalesClients />}
          />

          <Route
            path="clients/:id"
            element={<SalesClientDetails />}
          />

          <Route
            path="projects"
            element={<SalesProjects />}
          />

          <Route
            path="projects/:id"
            element={<SalesProjectDetails />}
          />

          <Route
            path="payments"
            element={<SalesPayments />}
          />

          <Route
            path="daily-status"
            element={<SalesDailyStatus />}
          />

          <Route
            path="attendance"
            element={<SalesAttendance />}
          />

          <Route
            path="notifications"
            element={<SalesNotifications />}
          />

          <Route
            path="messages"
            element={<SalesMessages />}
          />
        </Route>

        {/* =========================
            DEVELOPER ROUTES
        ========================== */}
        <Route
          path="/developer"
          element={
            <ProtectedRoute roles={['developer']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<DeveloperDashboard />}
          />

          <Route
            path="projects"
            element={<DeveloperProjects />}
          />

          <Route
            path="projects/:id"
            element={<DeveloperProjectDetails />}
          />

          <Route
            path="tasks"
            element={<DeveloperTasks />}
          />

          <Route
            path="messages"
            element={<DeveloperMessages />}
          />

          <Route
            path="daily-status"
            element={<DeveloperDailyStatus />}
          />

          <Route
            path="attendance"
            element={<DeveloperAttendance />}
          />

          <Route
            path="notifications"
            element={<DeveloperNotifications />}
          />

          <Route
            path="guide"
            element={<Guide />}
          />

          <Route
            path="details"
            element={<DeveloperDetails />}
          />
        </Route>

        {/* =========================
            CLIENT ROUTES
        ========================== */}
        <Route
          path="/client"
          element={
            <ProtectedRoute roles={['client']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* /client */}
          {/*      ↓ */}
          {/* /client/dashboard */}

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          {/* Client Dashboard */}
          <Route
            path="dashboard"
            element={<ClientDashboard />}
          />
          <Route
            path="meetings"
            element={<MyMeetings />}
          />
          {/* 🆕 YAHAN ADD KARO */}
          <Route
            path="projects"
            element={<MyProjects />}
          />
          <Route
            path="payments"
            element={<ClientPayments />}
          />
          <Route
            path="projects/:id"
            element={<ClientProjectDetails />}
          />
          <Route
            path="messages"
            element={<ClientMessages />}
          />
        </Route>

        {/* =========================
            FALLBACK
        ========================== */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}