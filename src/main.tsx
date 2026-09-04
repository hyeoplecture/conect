import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { StatusBar, Style } from "@capacitor/status-bar";

import Home from "@/app/conect3/page";
import Search from "@/app/conect3/search/page";
import Experts from "@/app/conect3/experts/page";
import ExpertDetail from "@/app/conect3/experts/[slug]/page";
import ExpertReviews from "@/app/conect3/experts/[slug]/reviews/page";
import Community from "@/app/conect3/community/page";
import CommunityPost from "@/app/conect3/community/[id]/page";
import CommunityWrite from "@/app/conect3/community/write/page";
import Login from "@/app/conect3/login/page";
import My from "@/app/conect3/my/page";
import MySettings from "@/app/conect3/my/settings/page";
import MyLicenses from "@/app/conect3/my/licenses/page";
import Reservation from "@/app/conect3/my/reservations/[id]/page";
import Notifications from "@/app/conect3/notifications/page";
import Checkout from "@/app/conect3/checkout/page";
import CheckoutPay from "@/app/conect3/checkout/pay/page";
import CheckoutDone from "@/app/conect3/checkout/done/page";
import ExpertHome from "@/app/conect3/expert/page";
import ExpertApply from "@/app/conect3/expert/apply/page";
import ExpertBookings from "@/app/conect3/expert/bookings/page";
import ExpertBooking from "@/app/conect3/expert/bookings/[id]/page";
import ExpertProfile from "@/app/conect3/expert/profile/page";
import ExpertSchedule from "@/app/conect3/expert/schedule/page";
import ExpertSettlements from "@/app/conect3/expert/settlements/page";
import AdminLayout from "@/app/conect3/admin/layout";
import AdminHome from "@/app/conect3/admin/page";
import AdminBookings from "@/app/conect3/admin/bookings/page";
import AdminExperts from "@/app/conect3/admin/experts/page";
import AdminPayments from "@/app/conect3/admin/payments/page";
import AdminReports from "@/app/conect3/admin/reports/page";
import AdminSettlements from "@/app/conect3/admin/settlements/page";
import AdminUsers from "@/app/conect3/admin/users/page";
import { MobileFrame } from "@/app/conect3/_components/shell";
import "./globals.css";
import "@/app/conect3/conect3.css";
import "./native.css";

void StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);

function AppFrame({ children }: { children: ReactNode }) {
  return <div className="conect3-root" data-seed data-seed-color-mode="light-only"><MobileFrame>{children}</MobileFrame></div>;
}

function AdminRoutes() {
  return <AdminLayout><Outlet /></AdminLayout>;
}

function App() {
  return (
    <AppFrame>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/experts" element={<Experts />} />
        <Route path="/experts/:slug" element={<ExpertDetail />} />
        <Route path="/experts/:slug/reviews" element={<ExpertReviews />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/write" element={<CommunityWrite />} />
        <Route path="/community/:id" element={<CommunityPost />} />
        <Route path="/login" element={<Login />} />
        <Route path="/my" element={<My />} />
        <Route path="/my/settings" element={<MySettings />} />
        <Route path="/my/licenses" element={<MyLicenses />} />
        <Route path="/my/reservations/:id" element={<Reservation />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/pay" element={<CheckoutPay />} />
        <Route path="/checkout/done" element={<CheckoutDone />} />
        <Route path="/expert" element={<ExpertHome />} />
        <Route path="/expert/apply" element={<ExpertApply />} />
        <Route path="/expert/bookings" element={<ExpertBookings />} />
        <Route path="/expert/bookings/:id" element={<ExpertBooking />} />
        <Route path="/expert/profile" element={<ExpertProfile />} />
        <Route path="/expert/schedule" element={<ExpertSchedule />} />
        <Route path="/expert/settlements" element={<ExpertSettlements />} />
        <Route path="/admin" element={<AdminRoutes />}>
          <Route index element={<AdminHome />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="experts" element={<AdminExperts />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppFrame>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><HashRouter><App /></HashRouter></StrictMode>,
);
