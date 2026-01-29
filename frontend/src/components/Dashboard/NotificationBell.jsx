import React, { useState, useEffect } from "react";
import { getNotifications, getUnreadCount } from "../../api/notificationApi";
import { FiBell } from "react-icons/fi";
import NotificationPanel from "./NotificationPanel";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = () => fetchData();
        window.addEventListener("appointmentUpdated", handler);
        return () => window.removeEventListener("appointmentUpdated", handler);
    }, []);

    const fetchData = async () => {
        try {
            const [notifsRes, countRes] = await Promise.all([
                getNotifications(),
                getUnreadCount()
            ]);
            setNotifications(notifsRes.data || []);
            setUnreadCount(countRes.data?.count || 0);
        } catch (err) {
            // Silently handle errors - notifications are not critical
            // Only log if it's not a 400/401 error (which are expected for unauthenticated users)
            if (err.response?.status !== 400 && err.response?.status !== 401) {
                console.error("Notification fetch error:", err);
            }
            // Set empty state on error
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`relative p-2.5 rounded-full transition-all outline-none border cursor-pointer ${isOpen
                        ? "bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        : "bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#333] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                        }`}
                >
                    <FiBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border border-white text-[8px] font-bold items-center justify-center text-white">
                                {unreadCount}
                            </span>
                        </span>
                    )}
                </button>
            </div>

            <NotificationPanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                notifications={notifications}
                setNotifications={setNotifications}
                fetchData={fetchData}
                setUnreadCount={setUnreadCount}
            />
        </>
    );
}
