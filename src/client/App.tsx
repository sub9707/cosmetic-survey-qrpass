import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboardPage from "@/pages/admin-dashboard-page";
import AdminHomePage from "@/pages/admin-home-page";
import AdminLoginPage from "@/pages/admin-login-page";
import EventCompletePage from "@/pages/event-complete-page";
import EventLandingPage from "@/pages/event-landing-page";
import EventSurveyPage from "@/pages/event-survey-page";
import HomePage from "@/pages/home-page";
import NotFoundPage from "@/pages/not-found-page";
import StaffEventPage from "@/pages/staff-event-page";
import StaffHomePage from "@/pages/staff-home-page";
import StaffLoginPage from "@/pages/staff-login-page";
import StaffScannerPage from "@/pages/staff-scanner-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/event/:eventSlug" element={<EventLandingPage />} />
      <Route path="/event/:eventSlug/survey" element={<EventSurveyPage />} />
      <Route path="/event/:eventSlug/complete" element={<EventCompletePage />} />
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route path="/staff" element={<StaffHomePage />} />
      <Route path="/staff/:eventId" element={<StaffEventPage />} />
      <Route path="/staff/:eventId/scanner" element={<StaffScannerPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminHomePage />} />
      <Route path="/admin/:eventId" element={<AdminDashboardPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}
