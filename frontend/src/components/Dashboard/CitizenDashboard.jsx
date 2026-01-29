// CitizenDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import axiosClient from "../../api/axiosClient.js";

import { fetchUserProfile } from "../../Redux/authSlice.js";
import Sidebar from "./Sidebar.jsx";
import Overview from "./Overview.jsx";
import CitizenAnalytics from "./CitizenAnalytics.jsx";
import Messages from "./Messages.jsx";
import Schedule from "./Schedule.jsx";
import CitizenAddCase from "./CitizenAddCase.jsx";
import CitizenMyCases from "./CitizenMyCases.jsx";
import CitizenFindLawyer from "./CitizenFindLawyer.jsx";
import CitizenProfile from "./CitizenProfile.jsx";
import CitizenSettings from "./CitizenSettings.jsx";
import { getMyCases } from "../../api/caseApi";
import ProfileModal from "./ProfileModal.jsx";
import NotificationBell from "./NotificationBell.jsx";
import CitizenMatches from "./CitizenMatches.jsx";
import AppointmentBooking from "./AppointmentBooking.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

// Helper to check type
const isLawyer = (item) => item.type === "LAWYER";

export default function CitizenDashboard() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { profile: reduxProfile, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // activePage state
  const [activePage, setActivePage] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // directory data from backend
  const [lawyers, setLawyers] = useState([]);
  const [ngos, setNgos] = useState([]);

  // Messages state
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Matches state
  const [selectedCaseForMatches, setSelectedCaseForMatches] = useState(null);
  const [myCases, setMyCases] = useState([]);

  // Appointments for status tracking
  const [appointments, setAppointments] = useState([]);

  // Profile Viewer State
  const [viewingProfile, setViewingProfile] = useState(null);

  // Profile (editable)
  const [profile, setProfile] = useState({
    shortName: reduxProfile?.shortName || reduxProfile?.fullName || "",
    fullName: reduxProfile?.fullName || "",
    role: reduxProfile?.role || "CITIZEN",
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
    initialAppointmentData: null, // For pre-filling appointment form
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: theme === 'dark',
    shareProfile: false,
  });

  // Sync settings with global theme
  useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: theme === 'dark' }));
  }, [theme]);

  // Device width → mobile / desktop
  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      if (width <= 500) {
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

  // Load profile from Redux when it changes
  useEffect(() => {
    if (reduxProfile && (reduxProfile.email || reduxProfile.fullName)) {
      setProfile((prev) => ({
        ...prev,
        ...reduxProfile,
        shortName: reduxProfile.shortName || reduxProfile.fullName || prev.shortName,
      }));
    }
  }, [reduxProfile]);

  const casesRef = React.useRef(myCases);
  useEffect(() => {
    casesRef.current = myCases;
  }, [myCases]);

  // Listen for navigation events from NotificationBell
  useEffect(() => {
    const handleNavigation = (e) => {
      const { page, caseId } = e.detail || {};
      if (page) {
        if (page === 'matches') {
          const targetCaseId = caseId || (casesRef.current && casesRef.current.length > 0 ? casesRef.current[0].id : null);
          if (targetCaseId) {
            const caseObj = casesRef.current?.find((c) => c.id === targetCaseId) || { id: targetCaseId };
            setSelectedCaseForMatches(caseObj);
            setActivePage("matches");
          } else {
            setActivePage("cases");
          }
        } else {
          setActivePage(page === 'appointments' ? 'appointments' : page);
        }
      }
    };
    window.addEventListener('navigateDashboard', handleNavigation);
    return () => window.removeEventListener('navigateDashboard', handleNavigation);
  }, []);

  // Fetch lawyers + NGOs from backend
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await axiosClient.get("/lawyers");
        setLawyers(res.data);
      } catch (e) {
        console.error("Failed to load lawyers", e);
      }
    };

    const fetchNgos = async () => {
      try {
        const res = await axiosClient.get("/ngos");
        setNgos(res.data);
      } catch (e) {
        console.error("Failed to load NGOs", e);
      }
    };

    fetchLawyers();
    fetchNgos();
  }, []);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await getMyCases();
        setMyCases(res.data || []);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    };
    if (isAuthenticated) fetchCases();
  }, [isAuthenticated]);

  const fetchAppointments = async () => {
    try {
      console.log("DEBUG: CitizenDashboard - Fetching appointments for Role:", profile.role);
      const res = await axiosClient.get("/appointments");
      console.log("DEBUG: CitizenDashboard - Fetched Appointments:", res.data);
      setAppointments(res.data);
    } catch (e) {
      console.error("Failed to load appointments", e);
    }

    // Independent debug call
    try {
      const debugRes = await axiosClient.get("/appointments/debug/all");
      console.log("DEBUG: ALL APPOINTMENTS IN DB:", debugRes.data);
    } catch (e) {
      console.warn("Could not fetch debug appointments - skip if intentional", e.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated && profile.role === "CITIZEN") {
      fetchAppointments();
    }
  }, [isAuthenticated, profile.role, activePage]);

  useEffect(() => {
    const handler = () => {
      if (profile.role === "CITIZEN") fetchAppointments();
    };
    window.addEventListener("appointmentUpdated", handler);
    return () => window.removeEventListener("appointmentUpdated", handler);
  }, [profile.role]);

  const handleCreateMessage = (recipientProfile) => {
    setActivePage("messages");
    setSelectedRecipient({
      type: recipientProfile.type || (recipientProfile.role === 'LAWYER' ? 'lawyer' : 'ngo'),
      id: recipientProfile.id,
      name: recipientProfile.name || recipientProfile.fullName || recipientProfile.ngoName || recipientProfile.shortName
    });
  };

  const handleBookAppointment = (prof, caseDetail = null) => {
    setActivePage("appointments");
    setProfile(prev => ({
      ...prev,
      initialAppointmentData: {
        providerId: prof.originalId || prof.id,
        providerRole: (prof.type || prof.role || "LAWYER").toUpperCase(),
        providerName: prof.name || prof.fullName || prof.ngoName || prof.shortName || "Provider",
        caseId: caseDetail?.id || prof.caseId || null,
        caseTitle: caseDetail?.caseTitle || prof.caseTitle || null,
        caseSummary: caseDetail ? [
          caseDetail.caseType && `Type: ${caseDetail.caseType}`,
          caseDetail.urgency && `Urgency: ${caseDetail.urgency}`,
          caseDetail.incidentPlace && `Location: ${caseDetail.incidentPlace}`,
          caseDetail.specialization && `Specialization: ${caseDetail.specialization}`
        ].filter(Boolean).join(" • ") : prof.caseSummary || null
      }
    }));
  };

  const menuItems = [
    { key: "overview", label: "Overview" },
    { key: "addcase", label: "Add Your Case" },
    { key: "cases", label: "My Cases" },
    { key: "find", label: "Find Lawyer & NGOs" },
    { key: "appointments", label: "Schedule" },
    { key: "messages", label: "Messages" },
    { key: "profile", label: "Profile" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div
      className="dashboard-container relative"
    >

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 dark:bg-opacity-80 z-40 backdrop-blur-sm transition-all"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        profile={profile}
        activePage={activePage}
        setActivePage={setActivePage}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
        role="CITIZEN"
        menuItems={menuItems}
      />

      <main className="flex-1 min-h-screen overflow-y-auto custom-scrollbar">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-gray-200 dark:border-[#222] px-4 md:px-8 py-4 flex justify-between items-center shadow-lg transition-colors">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-[#D4AF37] border border-gray-200 dark:border-[#333] cursor-pointer active:scale-95 transition-all"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}

            <h1 className="text-xl md:text-2xl font-bold font-serif tracking-tight text-gray-900 dark:text-white uppercase sm:normal-case transition-colors">
              {menuItems.find(item => item.key === activePage)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />

            <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-[#333]">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1 transition-colors">{profile.fullName || "User"}</div>
                <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Citizen</div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-[#D4AF37]/50 bg-gray-100 dark:bg-[#1a1a1a] shadow-lg shadow-[#D4AF37]/10 transition-colors">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-[#D4AF37]">{profile.fullName?.charAt(0) || "U"}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content switch */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <section className="space-y-6 pb-20">
            {activePage === "overview" && <CitizenAnalytics profile={profile} />}

            {activePage === "addcase" && <CitizenAddCase />}

            {activePage === "cases" && (
              <CitizenMyCases
                onViewMatches={(caseObj) => {
                  setSelectedCaseForMatches(caseObj);
                  setActivePage("matches");
                }}
                onMessageProvider={(provider) => {
                  setSelectedRecipient({
                    type: provider.type || "lawyer",
                    id: provider.id,
                    name: provider.name,
                    sessionId: provider.sessionId
                  });
                  setActivePage("messages");
                }}
              />
            )}

            {activePage === "matches" && selectedCaseForMatches && (
              <CitizenMatches
                caseId={selectedCaseForMatches.id}
                caseDetail={selectedCaseForMatches}
                setActivePage={setActivePage}
                setSelectedRecipient={setSelectedRecipient}
                onBookAppointment={handleBookAppointment}
                onBack={() => setActivePage("cases")}
                appointments={appointments}
              />
            )}

            {activePage === "appointments" && (
              <Schedule
                profile={profile}
                externalAppointments={appointments}
                refetchAppointments={fetchAppointments}
              />
            )}

            {activePage === "find" && (
              <CitizenFindLawyer
                setActivePage={setActivePage}
                setSelectedRecipient={setSelectedRecipient}
                onBookAppointment={handleBookAppointment}
                appointments={appointments}
                onViewProfile={(item, type) => {
                  setViewingProfile({
                    ...item,
                    type: type,
                    name: item.name,
                    specialization: item.specialization,
                    city: item.city,
                    state: item.state,
                    mobile: item.contactPhone,
                    email: item.contactEmail,
                    isVerified: item.verified,
                    bio: isLawyer(item) ? "Practicing Lawyer" : "Non-Governmental Organization",
                    onBookAppointment: handleBookAppointment
                  });
                }}
              />
            )}

            {activePage === "messages" && (
              <Messages
                selectedRecipient={selectedRecipient}
                setSelectedRecipient={setSelectedRecipient}
                profile={profile}
              />
            )}

            {activePage === "profile" && (
              <CitizenProfile
                profile={profile}
                setProfile={setProfile}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
              />
            )}

            {activePage === "settings" && (
              <CitizenSettings settings={settings} setSettings={setSettings} />
            )}
          </section>
        </div>
      </main>

      {/* Modal Layer */}
      {viewingProfile && (
        <ProfileModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          onMessage={handleCreateMessage}
        />
      )}

    </div>
  );
}
