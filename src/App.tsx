import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./store";
import { AuthPage, FindPasswordPage, HomePage, NotificationsPage, ServicesPage, SplashPage } from "./pages/EntryPages";
import { DocumentsPage, MatchPage, PeriodPage, PolicyDetailPage, PolicyListPage } from "./pages/PolicyPages";
import { FacilityDetailPage, FacilityListPage, FacilitySearchPage, MapPage } from "./pages/MapPages";
import { ChatPage, GapPage, SharePage } from "./pages/CarePages";
import { CalendarPage, MySchedulePage, ScheduleFormPage } from "./pages/CalendarPages";
import { HouseholdPage, MyPage, PrivacyPage, ProfileEditPage, SavedDonePage, SavedPoliciesPage } from "./pages/MyPages";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/policies" element={<PolicyListPage />} />
          <Route path="/policies/:id" element={<PolicyDetailPage />} />
          <Route path="/policies/:id/docs" element={<DocumentsPage />} />
          <Route path="/policies/:id/period" element={<PeriodPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/facilities" element={<FacilityListPage />} />
          <Route path="/facilities/search" element={<FacilitySearchPage />} />
          <Route path="/facilities/:id" element={<FacilityDetailPage />} />
          <Route path="/gap" element={<GapPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/calendar/new" element={<ScheduleFormPage />} />
          <Route path="/me" element={<MyPage />} />
          <Route path="/me/edit" element={<ProfileEditPage />} />
          <Route path="/me/saved-done" element={<SavedDonePage />} />
          <Route path="/me/saved" element={<SavedPoliciesPage />} />
          <Route path="/me/schedule" element={<MySchedulePage />} />
          <Route path="/me/household" element={<HouseholdPage />} />
          <Route path="/me/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
