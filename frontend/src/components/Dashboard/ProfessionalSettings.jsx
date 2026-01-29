import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ProfessionalSettings({ settings, setSettings, role }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight mb-8">System Settings</h2>

            <div className="bg-white dark:bg-[#111] p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-[#222] space-y-10 transition-all duration-300">

                {/* Profile Visibility */}
                <div className="flex items-center justify-between pb-8 border-b border-gray-100 dark:border-[#1a1a1a]">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Active Registry Status</div>
                        <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                            Control your visibility in the global registry. When disabled, you will not appear in new match results.
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, active: !prev.active }))}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 border ${settings?.active ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-gray-100 dark:bg-[#222] border-gray-300 dark:border-[#333]"}`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${settings?.active ? "translate-x-7 bg-white" : "translate-x-0 bg-gray-400 dark:bg-gray-600"}`} />
                    </button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between pb-8 border-b border-gray-100 dark:border-[#1a1a1a]">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Protocol Notifications</div>
                        <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                            Receive real-time alerts for new consultation requests, message signals, and system updates.
                        </p>
                    </div>
                    <button
                        onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 border ${settings?.notifications ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-gray-100 dark:bg-[#222] border-gray-300 dark:border-[#333]"}`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${settings?.notifications ? "translate-x-7 bg-white" : "translate-x-0 bg-gray-400 dark:bg-gray-600"}`} />
                    </button>
                </div>

                {/* Dark Mode */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Appearance: Dark Protocol</div>
                        <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                            Toggle between the standard high-contrast dark mode and premium light aesthetic.
                        </p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 border ${theme === 'dark' ? "bg-[#D4AF37] border-[#D4AF37]" : "bg-gray-100 dark:bg-white border-gray-300"}`}
                    >
                        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${theme === 'dark' ? "translate-x-7 bg-black" : "translate-x-0 bg-gray-300"}`} />
                    </button>
                </div>

            </div>

            <div className="mt-12 flex justify-end">
                <button
                    onClick={() => alert("System parameters updated.")}
                    className="px-8 py-4 bg-[#D4AF37] text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:bg-[#b8962d] transition-all hover:scale-105 active:scale-95"
                >
                    Update System Configuration
                </button>
            </div>
        </div>
    );
}
