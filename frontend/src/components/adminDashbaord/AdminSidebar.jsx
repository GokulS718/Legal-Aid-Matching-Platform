import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, fetchUserProfile } from "../../Redux/authSlice.js";
import appLogo from "../../assets/logo.png";

export default function AdminSidebar({
  profile: propProfile,
  activePage,
  setActivePage,
  isOpen,
  onClose,
  isMobile,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { profile: reduxProfile, isAuthenticated } = useSelector(
    (state) => state.auth
  );

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

  const profile =
    reduxProfile && (reduxProfile.email || reduxProfile.fullName)
      ? {
        shortName:
          reduxProfile.shortName ||
          reduxProfile.fullName ||
          propProfile?.shortName ||
          "",
        fullName: reduxProfile.fullName || propProfile?.fullName || "",
        photoUrl: reduxProfile.photoUrl || propProfile?.photoUrl || null,
      }
      : propProfile || {
        shortName: "",
        fullName: "",
        photoUrl: null,
      };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", {
      state: { success: "Logged out successfully!" },
    });
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <aside
      className={`${isMobile
        ? "fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ease-in-out"
        : "relative w-80"
        } ${isMobile
          ? isOpen
            ? "translate-x-0"
            : "-translate-x-full"
          : "translate-x-0"
        } bg-white dark:bg-[#0f0f0f] border-r border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400 flex flex-col h-full shadow-2xl font-sans transition-colors duration-300`}
    >
      {/* Close Button for Mobile */}
      {isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-[#D4AF37] cursor-pointer transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Logo Section */}
      <div className="p-8 border-b border-gray-200 dark:border-[#222]">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 border border-[#D4AF37] rounded-full flex items-center justify-center bg-[#D4AF37]/5">
            <img src={appLogo} alt="Logo" className="w-6 h-6 object-contain brightness-0 dark:invert transition-all" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight uppercase transition-colors">Admin Panel</h1>
            <span className="text-[10px] text-[#D4AF37] tracking-[0.2em] font-bold uppercase">System Control</span>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-6">
        <div className="bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-[#333] flex items-center gap-4 shadow-inner ring-1 ring-black/5 dark:ring-white/5 transition-colors">
          <div className="w-12 h-12 bg-[#252525] rounded-full flex items-center justify-center font-bold text-[#D4AF37] border border-[#D4AF37]/30 shadow-lg overflow-hidden shrink-0">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.fullName || "Admin"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{profile.shortName?.charAt(0) || "A"}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate text-gray-900 dark:text-white text-sm transition-colors">{profile.fullName || "Admin User"}</div>
            <div className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mt-0.5">Primary Administrator</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-2 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] px-4 mb-4 mt-6">Management</div>
        {[
          { key: "overview", label: "Overview" },
          { key: "cases", label: "Cases" },
          { key: "lawyers", label: "Lawyers" },
          { key: "ngos", label: "NGOs" },
          { key: "audit-logs", label: "Audit Logs" },
          { key: "profile", label: "Profile" },
          { key: "settings", label: "Settings" },
        ].map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`w-full text-left px-5 py-3.5 rounded-lg transition-all cursor-pointer font-bold text-sm tracking-wide flex items-center gap-3 group relative ${isActive
                ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-[#D4AF37]"
                }`}
            >
              {isActive && <div className="absolute left-0 w-1 h-6 bg-black rounded-r-full"></div>}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 pt-2 border-t border-gray-200 dark:border-[#222]">
        <button
          onClick={handleLogout}
          className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-red-900 hover:bg-red-950/20 hover:text-red-500 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest cursor-pointer transition-all duration-300"
        >
          Exit Dashboard
        </button>
        <div className="mt-4 text-center">
          <p className="text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest transition-colors">© 2026 ADVOCARE CORE</p>
        </div>
      </div>
    </aside>
  );
}
