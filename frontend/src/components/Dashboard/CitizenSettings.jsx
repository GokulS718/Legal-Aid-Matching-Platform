import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function CitizenSettings({ settings, setSettings }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3">Settings</h2>

      <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333] space-y-6 transition-colors">
        {/* Notifications */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-[#222]">
          <div>
            <div className="font-bold text-gray-800 dark:text-white">Notifications</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Receive updates for matched lawyers and appointments.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) =>
              setSettings((s) => ({ ...s, notifications: e.target.checked }))
            }
            className="w-5 h-5 accent-[#D4AF37]"
          />
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-[#222]">
          <div>
            <div className="font-bold text-gray-800 dark:text-white">Appearance: Dark Protocol</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Toggle between high-contrast dark mode and premium light aesthetic
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 border ${theme === 'dark' ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-gray-100 border-gray-300"
              }`}
          >
            <span
              className={`absolute top-1 left-1 w-4.5 h-4.5 rounded-full transition-transform duration-300 shadow-xl ${theme === 'dark' ? "translate-x-7 bg-black" : "translate-x-0 bg-gray-300"
                }`}
            />
          </button>
        </div>

        {/* 🌿 APP THEME
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">App Theme</div>
            <div className="text-sm text-gray-600">
              Enable soft green application theme.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.appTheme}
            onChange={(e) =>
              setSettings((s) => ({ ...s, appTheme: e.target.checked }))
            }
            className="w-5 h-5"
          />
        </div> */}

        {/* Share Profile */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              Share profile with matched lawyers
            </div>
            <div className="text-sm text-gray-600">
              Control whether your details are shared.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.shareProfile}
            onChange={(e) =>
              setSettings((s) => ({ ...s, shareProfile: e.target.checked }))
            }
            className="w-5 h-5"
          />
        </div>

        <div className="pt-3">
          <button
            onClick={() => alert("Settings saved (local).")}
            className="bg-teal-700 text-white px-4 py-2 rounded"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
