import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiX, FiBell, FiMessageSquare, FiCalendar, FiCheckCircle, FiTrash2, FiClock, FiFileText, FiDownload } from 'react-icons/fi';
import { markAsRead, markAllNotificationsAsRead, deleteNotification } from '../../api/notificationApi';
import { updateAppointmentStatus, getMyAppointments } from '../../api/appointmentApi';
import { getCaseById, assignCase } from '../../api/caseApi';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function NotificationPanel({ isOpen, onClose, notifications = [], setNotifications, fetchData, setUnreadCount }) {
    const [filter, setFilter] = useState('ALL');
    const [appointments, setAppointments] = useState([]);
    const [viewingCase, setViewingCase] = useState(null);
    const [caseDetailLoading, setCaseDetailLoading] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const role = (typeof localStorage !== 'undefined' && localStorage.getItem('role')) || '';
    const isProvider = role === 'LAWYER' || role === 'NGO';

    useEffect(() => {
        if (!isOpen || !isProvider) return;
        const load = async () => {
            try {
                const res = await getMyAppointments();
                setAppointments(res.data || []);
            } catch {
                setAppointments([]);
            }
        };
        load();
    }, [isOpen, isProvider]);

    useEffect(() => {
        const handler = () => {
            if (isOpen && isProvider) {
                getMyAppointments().then((r) => setAppointments(r.data || [])).catch(() => setAppointments([]));
            }
        };
        window.addEventListener('appointmentUpdated', handler);
        return () => window.removeEventListener('appointmentUpdated', handler);
    }, [isOpen, isProvider]);

    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const getApptForNotification = (n) => {
        if (!n?.referenceId || !Array.isArray(appointments)) return null;
        return appointments.find((a) => a.id === n.referenceId) || null;
    };

    const isConfirmedProviderAppointment = (n) => {
        if (n.type !== 'APPOINTMENT' || !isProvider) return false;
        const appt = getApptForNotification(n);
        const confirmed = appt?.status === 'CONFIRMED' || n.appointmentStatus === 'CONFIRMED';
        return appt && appt.caseId && confirmed;
    };

    const filteredNotifications = safeNotifications.filter(n => {
        if (filter === 'UNREAD') return !n.isRead;
        if (filter === 'READ') return n.isRead;
        return true;
    });

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success("CENTRAL REGISTRY SYNCHRONIZED");
        } catch (err) {
            console.error(err);
            toast.error("SYNC FAILED");
        }
    };

    const handleAppointmentAction = async (e, notification, status) => {
        e.stopPropagation();
        try {
            if (!notification.referenceId) {
                toast.error("Invalid Appointment Reference");
                return;
            }
            await updateAppointmentStatus(notification.referenceId, status);
            const label = status === 'CONFIRMED' ? 'confirmed' : 'declined';
            toast.success(`Appointment ${label}!`);

            // Optimistic update: reflect confirm/decline instantly in notification
            const newMessage = status === 'CONFIRMED' ? 'Appointment confirmed.' : 'Appointment declined.';
            setNotifications(prev => prev.map(n => n.id === notification.id
                ? { ...n, message: newMessage, isRead: true, appointmentStatus: status }
                : n));
            if (!notification.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            // Refetch notifications and trigger schedule refresh everywhere
            if (fetchData) fetchData();
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        } catch (err) {
            console.error(err);
            toast.error("Action Failed");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteNotification(id);
            const notif = safeNotifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notif && !notif.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleViewCaseDetails = async (e, n) => {
        e.stopPropagation();
        const appt = getApptForNotification(n);
        if (!appt?.caseId) return;
        setCaseDetailLoading(true);
        setViewingCase(null);
        try {
            const res = await getCaseById(appt.caseId);
            setViewingCase(res.data);
        } catch (err) {
            toast.error(err.response?.data || 'Could not load case details.');
        } finally {
            setCaseDetailLoading(false);
        }
    };

    const handleAcceptCase = async (e, n) => {
        e.stopPropagation();
        const appt = getApptForNotification(n);
        if (!appt?.caseId || !appt?.id) return;
        try {
            await assignCase(appt.caseId, appt.id);
            toast.success('Case assigned to you.');
            if (fetchData) fetchData();
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        } catch (err) {
            toast.error(err.response?.data || 'Failed to take case.');
        }
    };

    const handleNotificationClick = (n) => {
        // Determine target page based on notification message or type
        let targetPage = 'overview';
        const msg = (n.message || '').toLowerCase();

        if (msg.includes('appointment') || n.type === 'APPOINTMENT') {
            targetPage = 'appointments';
        } else if (msg.includes('message') || n.type === 'MESSAGE') {
            targetPage = 'messages';
        } else if (msg.includes('match') || n.type === 'MATCH') {
            targetPage = 'matches';
        } else if (msg.includes('case') || msg.includes('verif')) {
            targetPage = 'cases';
        }

        // Dispatch custom event for dashboard navigation
        const event = new CustomEvent('navigateDashboard', {
            detail: { page: targetPage }
        });
        window.dispatchEvent(event);

        // Mark as read and close
        if (!n.isRead) handleMarkAsRead(n.id);
        onClose();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'MESSAGE': return <FiMessageSquare className="text-blue-400" />;
            case 'APPOINTMENT': return <FiCalendar className="text-purple-400" />;
            case 'MATCH': return <FiCheckCircle className="text-emerald-400" />;
            default: return <FiBell className="text-[#D4AF37]" />;
        }
    };

    if (!isOpen) return null;

    const unreadCount = safeNotifications.filter(n => !n.isRead).length;

    // Use Portal for z-index fix
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] overflow-hidden flex justify-end">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            <div className={`relative w-full max-w-md border-l flex flex-col animate-in slide-in-from-right duration-500 ease-out transition-colors ${isDark ? 'bg-[#080808] border-[#222] shadow-[0_0_100px_rgba(0,0,0,1)]' : 'bg-white border-gray-200 shadow-xl'}`}>

                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className={`p-8 border-b relative z-10 transition-colors ${isDark ? 'border-[#1a1a1a] bg-[#0c0c0c]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className={`text-3xl font-bold font-serif tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
                            <div className="flex items-center gap-3 mt-4">
                                <span className="bg-[#D4AF37] text-black text-[9px] font-black px-2 py-0.5 rounded tracking-[0.1em]">
                                    {unreadCount} ACTIVE
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Live Registry Feed</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-3 border rounded-2xl transition-all hover:border-[#D4AF37]/50 ${isDark ? 'bg-[#151515] border-[#222] text-gray-400 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900'}`}
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className={`px-8 py-4 border-b flex items-center justify-between transition-colors ${isDark ? 'border-[#111] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className={`flex p-1 rounded-xl gap-1 ${isDark ? 'bg-[#111]' : 'bg-gray-200'}`}>
                        {['ALL', 'UNREAD', 'READ'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all ${filter === f
                                    ? 'bg-[#D4AF37] text-black shadow-lg'
                                    : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] hover:underline flex items-center gap-1.5"
                        >
                            Sync All
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-y-auto custom-scrollbar transition-colors ${isDark ? 'bg-[#080808]' : 'bg-white'}`}>
                    {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-16 text-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 border ${isDark ? 'bg-[#111] border-[#222]' : 'bg-gray-100 border-gray-200'}`}>
                                <FiBell size={32} className={isDark ? 'text-gray-800' : 'text-gray-500'} />
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] leading-relax ${isDark ? 'text-gray-700' : 'text-gray-600'}`}>Registry Void • No protocol history detected</p>
                        </div>
                    ) : (
                        <div className={isDark ? 'divide-y divide-[#151515]' : 'divide-y divide-gray-200'}>
                            {filteredNotifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-8 group relative transition-all duration-300 cursor-pointer ${!n.isRead ? 'bg-[#D4AF37]/[0.02]' : ''} ${isDark ? 'hover:bg-[#0c0c0c]' : 'hover:bg-gray-50'}`}
                                >
                                    {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_15px_#D4AF37]"></div>}

                                    <div className="flex gap-6">
                                        <div className={`mt-1 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl shrink-0 group-hover:border-[#D4AF37]/30 transition-colors border ${isDark ? 'bg-[#0a0a0a] border-[#222]' : 'bg-gray-100 border-gray-200'}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <p className={`text-sm leading-relaxed ${!n.isRead ? (isDark ? 'font-bold text-white' : 'font-bold text-gray-900') : (isDark ? 'text-gray-500 font-medium' : 'text-gray-600 font-medium')}`}>
                                                    {n.message}
                                                </p>
                                                {n.appointmentStatus === 'CONFIRMED' && (
                                                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">Confirmed</span>
                                                )}
                                                {n.appointmentStatus === 'REJECTED' && (
                                                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">Declined</span>
                                                )}
                                                {!n.isRead && !n.appointmentStatus && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_10px_#D4AF37] mt-1.5 shrink-0 animate-pulse"></div>}
                                            </div>

                                            <div className={`flex items-center gap-4 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-gray-700' : 'text-gray-600'}`}>
                                                <span className="flex items-center gap-1.5"><FiClock size={10} /> {new Date(n.createdAt).toLocaleDateString()}</span>
                                                <span className={`px-2 py-0.5 rounded tracking-[0.1em] ${isDark ? 'bg-[#111]' : 'bg-gray-100'}`}>• {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>

                                            {/* Advanced Actions */}
                                            <div className="flex flex-wrap gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                                                {isConfirmedProviderAppointment(n) ? (
                                                    <>
                                                        <button onClick={(e) => handleViewCaseDetails(e, n)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252525] uppercase tracking-wider border border-gray-200 dark:border-[#333]">
                                                            <FiFileText size={12} /> Case Detail
                                                        </button>
                                                        <button onClick={(e) => handleAcceptCase(e, n)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black bg-[#D4AF37] text-black hover:bg-[#c5a059] uppercase tracking-wider">
                                                            Accept Case
                                                        </button>
                                                    </>
                                                ) : !n.appointmentStatus && !n.isRead && n.type === 'APPOINTMENT' && isProvider ? (
                                                    <>
                                                        <button onClick={(e) => handleAppointmentAction(e, n, 'CONFIRMED')} className="text-[9px] font-black text-green-500 hover:text-green-400 uppercase tracking-[0.2em] border-b border-transparent hover:border-green-500">
                                                            Confirm
                                                        </button>
                                                        <button onClick={(e) => handleAppointmentAction(e, n, 'REJECTED')} className="text-[9px] font-black text-red-500 hover:text-red-400 uppercase tracking-[0.2em] border-b border-transparent hover:border-red-500">
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : !n.isRead && !n.appointmentStatus && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }} className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] border-b border-transparent hover:border-[#D4AF37]">
                                                        Resolve
                                                    </button>
                                                )}

                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="text-[9px] font-black text-gray-600 hover:text-red-500 uppercase tracking-[0.2em] border-b border-transparent hover:border-red-500">
                                                    Discard
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-8 border-t transition-colors ${isDark ? 'border-[#1a1a1a] bg-[#0c0c0c]' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                        onClick={onClose}
                        className={`w-full py-4 bg-transparent rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.5em] transition-all shadow-xl border hover:text-[#D4AF37] hover:border-[#D4AF37] ${isDark ? 'border-[#222] text-gray-600' : 'border-gray-200 text-gray-600'}`}
                    >
                        Minimize Nexus
                    </button>
                </div>
            </div>

            {/* Case Detail Modal (Lawyer/NGO) */}
            {(viewingCase !== null || caseDetailLoading) && (
                <div
                    className="absolute inset-0 z-[99999] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300"
                    onClick={() => { if (!caseDetailLoading) setViewingCase(null); }}
                >
                    <div
                        className={`border rounded-[2rem] p-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative ${isDark ? 'bg-[#0f0f0f] border-[#333]' : 'bg-white border-gray-200'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] opacity-50 rounded-t-[2rem]"></div>
                        {caseDetailLoading ? (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
                                <p className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading case details…</p>
                            </div>
                        ) : viewingCase ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className={`text-xl font-bold font-serif ${isDark ? 'text-white' : 'text-gray-900'}`}>Case Details</h3>
                                    <button onClick={() => { setViewingCase(null); }} className={`p-2 rounded-full ${isDark ? 'hover:bg-[#222] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Title</span><p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{viewingCase.caseTitle || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Type</span><p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{viewingCase.caseType || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Urgency</span><p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{viewingCase.urgency || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Location</span><p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{viewingCase.incidentPlace || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Victim</span><p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{viewingCase.victimName || '—'} {viewingCase.relation ? `(${viewingCase.relation})` : ''}</p></div>
                                    {viewingCase.background && <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Background</span><p className={`mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{viewingCase.background}</p></div>}
                                    {viewingCase.relief && <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Relief Sought</span><p className={`mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{viewingCase.relief}</p></div>}
                                    {viewingCase.documentsUrl && (
                                        <div className={`pt-4 border-t ${isDark ? 'border-[#222]' : 'border-gray-200'}`}>
                                            <span className="font-bold text-[#D4AF37] uppercase tracking-wider">Case documents</span>
                                            <p className={`text-[10px] mt-1 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Shared by the citizen.</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {viewingCase.documentsUrl.split(',').map((url, idx) => (
                                                    <a key={idx} href={url.trim()} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-[#D4AF37]/20 border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/30' : 'bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#c5a059] hover:bg-[#D4AF37]/20'}`}>
                                                        <FiDownload size={14} /> Document {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
