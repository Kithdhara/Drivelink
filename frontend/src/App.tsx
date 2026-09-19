import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { AuthProvider, RequireAuth } from './lib/auth';
import { DashboardLayout, PublicLayout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Forgot from './pages/auth/Forgot';
import Reset from './pages/auth/Reset';
import Profile from './pages/shared/Profile';
import Notifications from './pages/shared/Notifications';
import ApplicantDashboard from './pages/applicant/Dashboard';
import Apply from './pages/applicant/Apply';
import Renew from './pages/applicant/Renew';
import ApplicationDetail from './pages/applicant/ApplicationDetail';
import BookMedical from './pages/applicant/BookMedical';
import BookExam from './pages/applicant/BookExam';
import BookTrial from './pages/applicant/BookTrial';
import ApplicantTickets from './pages/applicant/Tickets';
import NewTicket from './pages/applicant/NewTicket';
import Payments from './pages/applicant/Payments';
import Complaints from './pages/applicant/Complaints';
import OfficerDashboard from './pages/officer/Dashboard';
import OfficerApplications from './pages/officer/Applications';
import OfficerReview from './pages/officer/Review';
import OfficerTickets from './pages/officer/Tickets';
import OfficerTicketDetail from './pages/officer/TicketDetail';
import OfficerReports from './pages/officer/Reports';
import CoordinatorDashboard from './pages/coordinator/Dashboard';
import CoordinatorSchedules from './pages/coordinator/Schedules';
import CoordinatorBookings from './pages/coordinator/Bookings';
import CoordinatorLocations from './pages/coordinator/Locations';
import ExaminerDashboard from './pages/examiner/Dashboard';
import ExaminerSchedule from './pages/examiner/Schedule';
import ExaminerHistory from './pages/examiner/History';
import TrainerDashboard from './pages/trainer/Dashboard';
import TrainerTrainees from './pages/trainer/Trainees';
import TrainerSchedule from './pages/trainer/Schedule';
import MedicalDashboard from './pages/medical/Dashboard';
import MedicalAppointments from './pages/medical/Appointments';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminAudit from './pages/admin/Audit';
import ComplaintsAdmin from './pages/admin/ComplaintsAdmin';
import NotFound from './pages/NotFound';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset" element={<Reset />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireAuth roles={['applicant']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ApplicantDashboard />} />
        <Route path="apply" element={<Apply />} />
        <Route path="renew" element={<Renew />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="medical" element={<BookMedical />} />
        <Route path="exam" element={<BookExam />} />
        <Route path="trial" element={<BookTrial />} />
        <Route path="tickets" element={<ApplicantTickets />} />
        <Route path="tickets/new" element={<NewTicket />} />
        <Route path="payments" element={<Payments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/officer"
        element={
          <RequireAuth roles={['officer']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="applications" element={<OfficerApplications />} />
        <Route path="applications/:id" element={<OfficerReview />} />
        <Route path="tickets" element={<OfficerTickets />} />
        <Route path="tickets/:id" element={<OfficerTicketDetail />} />
        <Route path="reports" element={<OfficerReports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/coordinator"
        element={
          <RequireAuth roles={['coordinator']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<CoordinatorDashboard />} />
        <Route path="schedules" element={<CoordinatorSchedules />} />
        <Route path="bookings" element={<CoordinatorBookings />} />
        <Route path="locations" element={<CoordinatorLocations />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/examiner"
        element={
          <RequireAuth roles={['examiner']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ExaminerDashboard />} />
        <Route path="schedule" element={<ExaminerSchedule />} />
        <Route path="history" element={<ExaminerHistory />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/trainer"
        element={
          <RequireAuth roles={['trainer']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<TrainerDashboard />} />
        <Route path="trainees" element={<TrainerTrainees />} />
        <Route path="schedule" element={<TrainerSchedule />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/medical"
        element={
          <RequireAuth roles={['medical']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<MedicalDashboard />} />
        <Route path="appointments" element={<MedicalAppointments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth roles={['admin']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="complaints" element={<ComplaintsAdmin />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

