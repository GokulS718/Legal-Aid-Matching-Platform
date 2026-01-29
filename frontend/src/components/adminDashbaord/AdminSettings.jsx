import React, { useState } from "react";
import { FiSettings, FiBell, FiShield, FiInfo, FiActivity, FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function AdminSettings() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoApprove: false,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-8 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl p-8 relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">System Configuration</span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">Admin Preferences</h2>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#333]">
            <FiSettings className="text-[#D4AF37] w-6 h-6 animate-spin-slow" />
          </div>
        </div>

        <div className="space-y-2">
          <SettingItem
            title="Appearance: Dark Protocol"
            description="Toggle between high-contrast dark mode and premium light aesthetic"
            enabled={theme === 'dark'}
            onToggle={toggleTheme}
            icon={theme === 'dark' ? <FiMoon /> : <FiSun />}
          />
          <SettingItem
            title="Registry Notifications"
            description="Broadcast alerts for incoming verification certificates"
            enabled={settings.notifications}
            onToggle={() => handleToggle("notifications")}
            icon={<FiBell />}
          />
          <SettingItem
            title="System Telemetry"
            description="Receive encrypted logs regarding global network stability"
            enabled={settings.emailAlerts}
            onToggle={() => handleToggle("emailAlerts")}
            icon={<FiActivity />}
          />
          <SettingItem
            title="Autonomous Authorization"
            description="Enable zero-touch approval for highly-vetted legal practitioners"
            enabled={settings.autoApprove}
            onToggle={() => handleToggle("autoApprove")}
            icon={<FiShield />}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <FiInfo size={80} className="text-[#D4AF37]" />
        </div>
        <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-6 flex items-center gap-3">
          <FiInfo /> Central System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-200 dark:border-[#222]">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#111] p-4 rounded-xl border border-gray-200 dark:border-[#222] transition-colors">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Protocol Version</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs transition-colors">v2.4.0-GOLD-STABLE</span>
          </div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#111] p-4 rounded-xl border border-gray-200 dark:border-[#222] transition-colors">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Last Sychronisation</span>
            <span className="text-gray-900 dark:text-white font-mono text-xs transition-colors">JAN 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const SettingItem = ({ title, description, enabled, onToggle, icon }) => (
  <div className="flex items-center justify-between py-6 border-b border-gray-200 dark:border-[#222] last:border-0 group">
    <div className="flex items-start gap-4">
      <div className="mt-1 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 dark:text-white tracking-tight transition-colors">{title}</h4>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1 transition-colors">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 border ${enabled ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-gray-100 dark:bg-[#111] border-gray-300 dark:border-[#333]"
        }`}
    >
      <span
        className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full transition-transform duration-300 shadow-xl ${enabled ? "translate-x-7 bg-black" : "translate-x-0 bg-gray-300 dark:bg-[#333]"
          }`}
      />
    </button>
  </div>
);
