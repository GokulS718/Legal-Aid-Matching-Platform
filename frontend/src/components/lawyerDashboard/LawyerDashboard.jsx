import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserProfile } from "../../Redux/authSlice.js";
import Sidebar from "../Dashboard/Sidebar.jsx";
import Overview from "../Dashboard/Overview.jsx";
import Messages from "../Dashboard/Messages.jsx";
import Schedule from "../Dashboard/Schedule.jsx";
import LawyerProfile from "./LawyerProfile.jsx";
import ProfessionalSettings from "../Dashboard/ProfessionalSettings.jsx";
import NotificationBell from "../Dashboard/NotificationBell.jsx";
import LawyerUnavailability from "./LawyerUnavailability.jsx";
import LawyerAnalytics from "./LawyerAnalytics.jsx";
import LawyerMyCases from "../../pages/lawyer/LawyerMyCases.jsx";

export default function LawyerDashboard() {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { profile: reduxProfile } = useSelector((state) => state.auth);

  const [activePage, setActivePage] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState({ ...reduxProfile });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: theme === 'dark',
    active: true
  });
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Sync settings with global theme
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: theme === 'dark' }));
  }, [theme]);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      setIsSidebarOpen(width > 700);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    if (reduxProfile) setProfile(reduxProfile);
  }, [reduxProfile]);

  useEffect(() => {
    const handleNavigation = (e) => {
      const page = e.detail?.page;
      const recipient = e.detail?.recipient;
      if (page) setActivePage(page);
      if (recipient) setSelectedRecipient(recipient);
    };
    window.addEventListener('navigateDashboard', handleNavigation);
    return () => window.removeEventListener('navigateDashboard', handleNavigation);
  }, []);

  const menuItems = [
    { key: "overview", label: "Dashboard" },
    { key: "cases", label: "My Cases" },
    { key: "appointments", label: "Schedule" },
    { key: "unavailability", label: "Unavailable Times" },
    { key: "messages", label: "Messages" },
    { key: "profile", label: "My Profile" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="dashboard-container relative">
      <Sidebar
        profile={profile}
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isMobile={isMobile}
        role="LAWYER"
        menuItems={menuItems}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#222] p-4 flex justify-between items-center sticky top-0 z-20 shadow-lg transition-colors">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-[#D4AF37] border border-gray-200 dark:border-[#333] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-bold font-serif tracking-tight text-gray-900 dark:text-white uppercase transition-colors">
              {menuItems.find(i => i.key === activePage)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="hidden sm:block text-right border-l border-gray-200 dark:border-[#333] pl-4 transition-colors">
              <div className="font-bold text-sm text-gray-900 dark:text-white transition-colors">{profile.fullName}</div>
              <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Lawyer</div>
            </div>
            <div className="w-10 h-10 rounded-full flex justify-center items-center font-bold border-2 border-[#D4AF37]/50 bg-gray-100 dark:bg-[#1a1a1a] shadow-lg shadow-[#D4AF37]/10 overflow-hidden transition-colors">
              {profile.photoUrl ? <img src={profile.photoUrl} className="w-full h-full object-cover" /> : <span className="text-[#D4AF37]">{profile.fullName?.charAt(0)}</span>}
            </div>
          </div>
        </header>

        <main className="p-8 overflow-y-auto flex-1 pb-20 custom-scrollbar">
          {activePage === "overview" && <LawyerAnalytics profile={profile} />}

          {activePage === "profile" && (
            <LawyerProfile
              profile={profile}
              setProfile={setProfile}
              isEditing={isEditingProfile}
              setIsEditing={setIsEditingProfile}
            />
          )}

          {activePage === "settings" && (
            <ProfessionalSettings
              settings={settings}
              setSettings={setSettings}
              role="LAWYER"
            />
          )}

          {activePage === "messages" && <Messages profile={profile} selectedRecipient={selectedRecipient} setSelectedRecipient={setSelectedRecipient} />}

          {activePage === "appointments" && <Schedule profile={profile} />}

          {activePage === "unavailability" && <LawyerUnavailability profile={profile} />}

          {activePage === "cases" && <LawyerMyCases onMessageProvider={(recipient) => {
            setSelectedRecipient(recipient);
            setActivePage("messages");
          }} />}
        </main>
      </div>
    </div>
  );
}
