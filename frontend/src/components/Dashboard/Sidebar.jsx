import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, fetchUserProfile } from "../../Redux/authSlice.js";
import appLogo from "../../assets/logo.png";
import { FiGrid, FiCalendar, FiSlash, FiMessageSquare, FiUser, FiSettings, FiLogOut, FiBriefcase } from "react-icons/fi";

// Helper to map keys to icons
const getIcon = (key) => {
  switch (key) {
    case "overview": return <FiGrid size={20} />;
    case "appointments": return <FiCalendar size={20} />;
    case "unavailability": return <FiSlash size={20} />;
    case "messages": return <FiMessageSquare size={20} />;
    case "profile": return <FiUser size={20} />;
    case "settings": return <FiSettings size={20} />;
    case "cases": return <FiBriefcase size={20} />;
    case "find": return <FiBriefcase size={20} />; // Or search icon
    case "addcase": return <FiBriefcase size={20} />; // Or plus icon
    default: return <FiGrid size={20} />;
  }
};

export default function Sidebar({
  profile: propProfile,
  activePage,
  setActivePage,
  isOpen,
  onClose,
  isMobile,
  role,
  menuItems
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
      !reduxProfile.fullName &&
      !reduxProfile.ngoName
    ) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, reduxProfile]);

  const profile =
    reduxProfile && (reduxProfile.email || reduxProfile.fullName || reduxProfile.ngoName)
      ? {
        ...reduxProfile,
        displayName:
          reduxProfile.fullName ||
          reduxProfile.ngoName ||
          propProfile?.fullName ||
          propProfile?.ngoName ||
          "User",
        photoUrl: reduxProfile.photoUrl || propProfile?.photoUrl || null,
      }
      : {
        ...propProfile,
        displayName:
          propProfile?.fullName ||
          propProfile?.ngoName ||
          propProfile?.shortName ||
          "User",
        photoUrl: propProfile?.photoUrl || null,
      };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    if (isMobile) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#0a0a0a] border-r border-[#222] z-50 transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          } ${!isMobile ? "lg:translate-x-0 lg:static" : ""}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-8 pb-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <img src={appLogo} alt="logo" className="w-6 h-6 object-contain invert" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-serif tracking-tight">AdvoCare</h2>
              <p className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-bold">Legal Justice</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#D4AF37]/20 to-transparent h-[1px] mx-8 mb-8" />

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {/* Special My Cases Button for Providers */}
            {/* Special My Cases Button moved to menuItems for correct ordering */}

            {menuItems.map((item) => {
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative ${isActive
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B4941F] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                    }`}
                >
                  <span className={`${isActive ? "text-black" : "text-[#D4AF37] group-hover:text-white"} transition-colors`}>
                    {getIcon(item.key)}
                  </span>
                  <span className={`font-medium text-sm tracking-wide ${isActive ? "font-bold" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile Snippet */}
          <div className="p-4 mx-4 mt-auto mb-4 rounded-2xl bg-[#1a1a1a] border border-[#222]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center overflow-hidden border border-[#444]">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-bold">{profile.displayName?.charAt(0)}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-white font-bold text-sm truncate">{profile.displayName}</h4>
                <p className="text-xs text-gray-500 truncate">{role}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#252525] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-xs font-bold uppercase tracking-widest border border-[#333] hover:border-red-500/30"
            >
              <FiLogOut size={14} />
              Logout System
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
