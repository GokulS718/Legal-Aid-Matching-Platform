import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserProfile } from "../../Redux/authSlice.js";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminOverview from "./AdminOverview.jsx";

import AdminCases from "./AdminCases.jsx";
import AdminLawyers from "./AdminLawyers.jsx";
import AdminNGOs from "./AdminNGOs.jsx";
import AdminAuditLogs from "./AdminAuditLogs.jsx";
import AdminProfile from "./AdminProfile.jsx";
import AdminSettings from "./AdminSettings.jsx";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { profile: reduxProfile, isAuthenticated } = useSelector((state) => state.auth);
  const [activePage, setActivePage] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch profile from admin database on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (
      token &&
      isAuthenticated &&
      !reduxProfile.email &&
      !reduxProfile.fullName
    ) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, reduxProfile.email, reduxProfile.fullName]);

  // Check if device width is 700px or less
  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      if (width <= 700) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  // Profile state (editable)
  const [adminProfile, setAdminProfile] = useState({
    shortName: reduxProfile?.shortName || reduxProfile?.fullName || "",
    fullName: reduxProfile?.fullName || "",
    role: reduxProfile?.role || "ADMIN",
    aadhaar: reduxProfile?.aadhaar || "",
    email: reduxProfile?.email || "",
    mobile: reduxProfile?.mobile || "",
    dob: reduxProfile?.dob || "",
    state: reduxProfile?.state || "",
    district: reduxProfile?.district || "",
    city: reduxProfile?.city || "",
    address: reduxProfile?.address || "",
    password: "",
    photo: null,
    photoUrl: reduxProfile?.photoUrl || null,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (reduxProfile && (reduxProfile.email || reduxProfile.fullName)) {
      setAdminProfile((prev) => ({
        ...prev,
        ...reduxProfile,
        shortName: reduxProfile.shortName || reduxProfile.fullName || prev.shortName,
      }));
    }
  }, [reduxProfile]);

  useEffect(() => {
    const handleNavigation = (e) => {
      const page = e.detail?.page;
      if (page) setActivePage(page);
    };
    window.addEventListener('navigateDashboard', handleNavigation);
    return () => window.removeEventListener('navigateDashboard', handleNavigation);
  }, []);

  const profile = {
    fullName: reduxProfile?.fullName || adminProfile.fullName || "Admin User",
    shortName: reduxProfile?.shortName || reduxProfile?.fullName?.split(" ")[0] || adminProfile.shortName || adminProfile.fullName?.split(" ")[0] || "Admin",
    photoUrl: reduxProfile?.photoUrl || adminProfile.photoUrl || null,
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "overview": return "Overview";

      case "cases": return "Cases";
      case "lawyers": return "Lawyers";
      case "ngos": return "NGOs";
      case "audit-logs": return "Audit Logs";
      case "profile": return "My Profile";
      case "settings": return "Settings";
      default: return "Dashboard";
    }
  };

  return (
    <div className="dashboard-container relative">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 dark:bg-opacity-80 z-40 backdrop-blur-sm transition-all"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        profile={profile}
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#222] p-4 flex justify-between items-center sticky top-0 z-20 shadow-lg px-8 transition-colors">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-[#D4AF37] border border-gray-200 dark:border-[#333] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-bold font-serif tracking-tight text-gray-900 dark:text-white uppercase transition-colors">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right transition-colors">
              <div className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{profile.shortName || profile.fullName || "Admin"}</div>
              <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Administrator</div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 border-[#D4AF37]/50 bg-gray-100 dark:bg-[#1a1a1a] shadow-lg shadow-[#D4AF37]/10 overflow-hidden transition-colors">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={profile.fullName || "Admin"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#D4AF37]">{profile.shortName?.charAt(0) || "A"}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar pb-20">
          <section className="space-y-6 max-w-7xl mx-auto">
            {activePage === "overview" && <AdminOverview />}

            {activePage === "cases" && <AdminCases />}
            {activePage === "lawyers" && <AdminLawyers />}
            {activePage === "ngos" && <AdminNGOs />}
            {activePage === "audit-logs" && <AdminAuditLogs />}
            {activePage === "profile" && (
              <AdminProfile
                profile={adminProfile}
                setProfile={setAdminProfile}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
              />
            )}
            {activePage === "settings" && <AdminSettings />}
          </section>
        </div>
      </main>
    </div>
  );
}
