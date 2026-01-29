import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiPlus, FiChevronLeft, FiChevronRight, FiCheckCircle, FiInfo, FiTrash2, FiCheck, FiX, FiFileText, FiUser, FiDownload } from 'react-icons/fi';
import { getMyAppointments, scheduleAppointment, updateAppointmentStatus } from '../../api/appointmentApi';
import { getMyAssignedCases, assignCase, unassignCase, getCaseById } from '../../api/caseApi';
import axiosClient from '../../api/axiosClient';
import { toast } from 'sonner';

export default function Schedule({ profile, externalAppointments, refetchAppointments }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState(externalAppointments || []);
    const [availability, setAvailability] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        notes: ''
    });

    const [conflictInfo, setConflictInfo] = useState(null);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [assignedMap, setAssignedMap] = useState(new Map());
    const [viewingCase, setViewingCase] = useState(null);
    const [caseDetailLoading, setCaseDetailLoading] = useState(false);

    const isCitizen = (profile?.role || localStorage.getItem("role")) === "CITIZEN";

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [selectedDate, profile?.initialAppointmentData]);

    const fetchAppointments = async () => {
        console.log('DEBUG: [Schedule] fetchAppointments called, refetchAppointments exists:', !!refetchAppointments);

        // Debug Analysis Call
        try {
            const analysis = await axiosClient.get("/appointments/debug/analyze");
            // Force stringify to see full depth
            console.log("DEBUG: [BACKEND ANALYSIS] FULL REPORT: " + JSON.stringify(analysis.data, null, 2));
        } catch (e) {
            console.warn("DEBUG: [BACKEND ANALYSIS] Failed:", e);
        }

        if (refetchAppointments) {
            await refetchAppointments();
            return;
        }
        try {
            console.log('DEBUG: [Schedule] Calling getMyAppointments API');
            const res = await getMyAppointments();
            console.log("DEBUG: [Schedule] Fetched Appointments - Count:", res.data?.length, "Data:", res.data);
            setAppointments(res.data);
        } catch (err) {
            console.error("DEBUG: [Schedule] Failed to fetch appointments:", err);
        }
    };

    useEffect(() => {
        if (externalAppointments) {
            console.log("DEBUG: Schedule.jsx - Updating from External Appointments:", externalAppointments);
            setAppointments(externalAppointments);
        }
    }, [externalAppointments]);

    useEffect(() => {
        const handleUpdate = () => {
            console.log("DEBUG: Schedule.jsx - Received appointmentUpdated event");
            fetchAppointments();
            fetchAvailability();
        };
        window.addEventListener('appointmentUpdated', handleUpdate);
        return () => window.removeEventListener('appointmentUpdated', handleUpdate);
    }, []);

    const fetchAssigned = async () => {
        if (isCitizen) return;
        try {
            const res = await getMyAssignedCases();
            const list = res.data || [];
            const map = new Map();
            list.forEach((a) => map.set(a.caseId, { matchId: a.matchId, appointmentId: a.appointmentId }));
            setAssignedMap(map);
        } catch (e) {
            console.warn("Failed to fetch assigned cases", e);
        }
    };

    useEffect(() => {
        fetchAssigned();
    }, [isCitizen]);

    const handleTakeCase = async (appt) => {
        if (!appt.caseId) return;
        try {
            await assignCase(appt.caseId, appt.id);
            toast.success("Case assigned to you.");
            await fetchAssigned();
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        } catch (e) {
            toast.error(e.response?.data || "Failed to take case.");
        }
    };

    const handleCancelCase = async (appt) => {
        if (!appt.caseId) return;
        const a = assignedMap.get(appt.caseId);
        if (!a?.matchId) return;
        try {
            await unassignCase(appt.caseId, { matchId: a.matchId });
            toast.success("Case assignment cancelled.");
            await fetchAssigned();
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        } catch (e) {
            toast.error(e.response?.data || "Failed to cancel assignment.");
        }
    };

    const handleViewCaseDetails = async (caseId) => {
        setCaseDetailLoading(true);
        setViewingCase(null);
        try {
            const res = await getCaseById(caseId);
            setViewingCase(res.data);
        } catch (e) {
            toast.error(e.response?.data || "Could not load case details.");
        } finally {
            setCaseDetailLoading(false);
        }
    };

    const fetchAvailability = async () => {
        console.log("DEBUG: Schedule.jsx - fetchAvailability called. isCitizen:", isCitizen, "Role:", (profile?.role || localStorage.getItem("role")));
        if (!isCitizen) {
            console.warn("DEBUG: Schedule.jsx - Skipping availability fetch because user is NOT a CITIZEN role.");
            return;
        }
        setLoading(true);
        try {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const providerId = profile?.initialAppointmentData?.providerId || 1;
            const providerRole = profile?.initialAppointmentData?.providerRole || "LAWYER";
            const requesterId = profile?.id;
            const requesterRole = profile?.role;

            console.log("DEBUG: Schedule.jsx - Requesting availability for:", { providerId, providerRole, dateStr, requesterId, requesterRole });

            const res = await axiosClient.get(`/appointments/availability`, {
                params: { providerId, providerRole, date: dateStr, requesterId, requesterRole }
            });
            console.log("DEBUG: Schedule.jsx - Availability Response:", res.data);
            setAvailability(res.data);
        } catch (err) {
            console.error("DEBUG: Schedule.jsx - Availability Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (force = false) => {
        if (!selectedSlot || (!formData.title && !force)) {
            toast.error("MISSING PROTOCOL DETAILS");
            return;
        }

        // Close modal before retrying with force
        if (force) {
            setShowConflictModal(false);
        }

        setBooking(true);
        try {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const startTime = `${dateStr}T${selectedSlot}:00`;
            const endHour = parseInt(selectedSlot.split(':')[0]) + 1;
            const endTime = `${dateStr}T${String(endHour).padStart(2, '0')}:00:00`;

            const payload = {
                providerId: profile?.initialAppointmentData?.providerId || 1,
                providerRole: profile?.initialAppointmentData?.providerRole || "LAWYER",
                startTime,
                endTime,
                type: formData.title,
                description: force ? "[FORCE] " + (formData.notes || "") : formData.notes,
                caseId: profile?.initialAppointmentData?.caseId || null,
                caseTitle: profile?.initialAppointmentData?.caseTitle || null,
                caseSummary: profile?.initialAppointmentData?.caseSummary || null
            };

            console.log('DEBUG: [Schedule] Booking appointment with payload:', payload);
            const response = await scheduleAppointment(payload);
            console.log('DEBUG: [Schedule] Booking response:', response.data);

            toast.success("APPOINTMENT SECURED PROTOCOL ESTABLISHED");

            // Immediately refetch appointments
            console.log('DEBUG: [Schedule] Refetching appointments after successful booking');
            await fetchAppointments();
            fetchAvailability();

            setFormData({ title: '', notes: '' });
            setSelectedSlot(null);
            setConflictInfo(null);
        } catch (err) {
            console.log("=== BOOKING ERROR DEBUG ===");
            console.log("Full error object:", err);
            console.log("Error response:", err.response);
            console.log("Error response data:", err.response?.data);
            console.log("Error response status:", err.response?.status);

            const data = err.response?.data;
            let errorMsg = "";

            if (typeof data === 'string') {
                errorMsg = data;
                console.log("Error is string:", errorMsg);
            } else if (data && typeof data === 'object' && data.message) {
                errorMsg = data.message;
                console.log("Error is object with message:", errorMsg);
            } else {
                errorMsg = "RESOURCE ALLOCATION FAILED";
                console.log("Using default error message");
            }

            console.log("Final error message:", errorMsg);
            console.log("Starts with REACTION_REQUIRED?", errorMsg.startsWith("REACTION_REQUIRED:"));

            if (errorMsg.includes("REACTION_REQUIRED:")) { // Use includes for better matches
                const conflictMsg = errorMsg.split("REACTION_REQUIRED:")[1].trim();
                setConflictInfo(conflictMsg);
                setShowConflictModal(true);
                console.log("Showing conflict modal with info:", conflictMsg);
            } else {
                toast.error(errorMsg);
                console.log("Showing toast error");
            }
        } finally {
            setBooking(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        console.log(`DEBUG: Schedule.jsx - Updating Status for ${id} to ${status}`);
        if (!id) return;

        // Optimistic Update
        const originalAppointments = [...appointments];
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status } : a));

        try {
            await updateAppointmentStatus(id, status);
            toast.success(`Appointment ${status.toLowerCase()}ed!`);

            // Fetch fresh data
            await fetchAppointments();
            if (refetchAppointments) await refetchAppointments();
            if (!isCitizen) await fetchAssigned();
            window.dispatchEvent(new CustomEvent('appointmentUpdated'));
        } catch (err) {
            console.error("Failed to update appointment status:", err);
            setAppointments(originalAppointments); // Revert
            toast.error(err.response?.data?.message || "Failed to update appointment status");
        }
    };

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const calendarDays = [];
    const days = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= days; i++) calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

    const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

    const getAppointmentsForDate = (date) => {
        const filtered = appointments.filter(appt => {
            const apptDate = new Date(appt.startTime);
            const match = isSameDay(apptDate, date);
            console.log(`DEBUG: Schedule.jsx - Filtering Appt ID ${appt.id}: StartTime=${appt.startTime}, SelectedDate=${date.toISOString()}, IsSameDay=${match}`);
            return match;
        });
        return filtered;
    };

    return (
        <div className="flex flex-col xl:flex-row gap-10 min-h-[700px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out transition-colors">

            {/* Left: Temporal Grid (Calendar) */}
            <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all">
                <div className="p-12 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50 dark:bg-[#111]">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-serif tracking-tighter">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-[12px] text-[#D4AF37] font-black uppercase tracking-[0.4em] mt-3">Temporal Nexus Grid</p>
                    </div>
                    <div className="flex gap-4">
                        {['yesterday', 'tomorrow'].map((dir, i) => (
                            <button
                                key={dir}
                                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + (i === 0 ? -1 : 1))))}
                                className="p-4 bg-white dark:bg-[#151515] border border-gray-200 dark:border-[#222] hover:border-[#D4AF37]/50 rounded-2xl transition-all shadow-xl active:scale-90"
                            >
                                {i === 0 ? <FiChevronLeft className="text-gray-400" /> : <FiChevronRight className="text-gray-400" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-12 grid grid-cols-7 gap-6 bg-white dark:bg-[#080808]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-6 opacity-40">{d}</div>
                    ))}
                    {calendarDays.map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} className="aspect-square opacity-10"></div>;
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());
                        const appts = getAppointmentsForDate(day);
                        const hasAppts = appts.length > 0;

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`group relative aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-500 border-2 ${isSelected
                                    ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_40px_rgba(212,175,55,0.3)] scale-110 z-10'
                                    : isToday
                                        ? 'bg-gray-100 dark:bg-[#111] border-[#D4AF37]/50 text-[#D4AF37]'
                                        : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-[#333]'
                                    }`}
                            >
                                <span className={`text-xl font-bold font-serif ${isSelected ? 'text-black' : isToday ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {day.getDate()}
                                </span>
                                {hasAppts && (
                                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full z-20">
                                        {appts.length}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Operations Pane */}
            <div className="w-full xl:w-[480px] space-y-10">

                {/* Booking Console (Citizens Only) */}
                {isCitizen ? (
                    <div className="bg-white dark:bg-[#0f0f0f] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl dark:shadow-[0_30px_70px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

                        <div className="mb-10">
                            <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Protocol Initiation</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3 font-serif">
                                {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
                            </h3>
                            {profile?.initialAppointmentData?.providerName && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3 font-medium flex items-center gap-2">
                                    Target Link: <span className="text-[#D4AF37] font-black uppercase tracking-widest">{profile.initialAppointmentData.providerName}</span>
                                </p>
                            )}
                            {profile?.initialAppointmentData?.caseTitle && (
                                <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222]">
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">Case for this protocol</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{profile.initialAppointmentData.caseTitle}</p>
                                    {profile?.initialAppointmentData?.caseSummary && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{profile.initialAppointmentData.caseSummary}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Available Chronos</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {loading ? (
                                        <div className="col-span-3 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-700 animate-pulse">Syncing nodes...</div>
                                    ) : availability.length === 0 ? (
                                        <div className="col-span-3 py-6 text-center text-[10px] font-black uppercase tracking-widest text-gray-800">No windows available</div>
                                    ) : (
                                        availability.map((slot) => (
                                            <button
                                                key={slot.time}
                                                disabled={slot.status === 'BOOKED' || slot.status === 'UNAVAILABLE'}
                                                title={slot.status === 'UNAVAILABLE' && slot.unavailabilityReason ? `Provider unavailable: ${slot.unavailabilityReason}` : null}
                                                onClick={() => {
                                                    if (slot.status === 'AVAILABLE') {
                                                        setSelectedSlot(slot.time);
                                                    }
                                                }}
                                                className={`py-3 px-2 rounded-xl border text-[10px] font-black tracking-widest transition-all ${slot.status === 'BOOKED'
                                                    ? 'bg-red-500/5 dark:bg-red-900/10 border-red-500/20 dark:border-red-900/30 text-red-600/40 dark:text-red-500/20 cursor-not-allowed line-through'
                                                    : slot.status === 'UNAVAILABLE'
                                                        ? 'bg-gray-500/5 dark:bg-gray-900/10 border-gray-500/20 dark:border-gray-900/30 text-gray-600/40 dark:text-gray-500/20 cursor-not-allowed opacity-60'
                                                        : slot.status === 'CONFLICT'
                                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500/80 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                                            : selectedSlot === slot.time
                                                                ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-xl'
                                                                : 'bg-gray-100 dark:bg-[#151515] border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400 hover:border-[#D4AF37]/50 hover:text-black dark:hover:text-white'
                                                    }`}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    {slot.displayTime || slot.time}
                                                    {slot.status === 'CONFLICT' && (
                                                        <span className="text-[7px] text-amber-500/60 font-black animate-pulse">CONFLICT</span>
                                                    )}
                                                    {slot.status === 'UNAVAILABLE' && (
                                                        <>
                                                            <span className="text-[7px] text-gray-500/60 font-black">UNAVAILABLE</span>
                                                            {slot.unavailabilityReason && (
                                                                <span className="text-[6px] text-gray-500/80 font-bold leading-tight max-w-[4.5rem] truncate" title={slot.unavailabilityReason}>
                                                                    {slot.unavailabilityReason}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                                {isCitizen && availability.some(s => s.status === 'UNAVAILABLE' && s.unavailabilityReason) && (
                                    <p className="mt-3 text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                                        Hover over unavailable slots to see the provider&apos;s reason.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-5">

                                <div className="relative">
                                    <select
                                        className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-2xl p-5 text-[11px] font-bold tracking-widest text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none transition-all appearance-none cursor-pointer"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    >
                                        <option value="" disabled>SELECT PROTOCOL TYPE</option>
                                        <option value="In-Person">IN-PERSON MEETING</option>
                                        <option value="Voice Call">VOICE CALL</option>
                                        <option value="Video Call">VIDEO CONFERENCE</option>
                                    </select>
                                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <textarea
                                    placeholder="DETAILED NOTES (OPTIONAL)"
                                    rows="3"
                                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-2xl p-5 text-[11px] font-bold tracking-widest text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:border-[#D4AF37] outline-none transition-all resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <button
                                onClick={() => handleBook(false)}
                                disabled={booking || !selectedSlot}
                                className="w-full py-6 bg-[#D4AF37] text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.5em] shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:bg-[#c5a059] active:scale-95 transition-all disabled:opacity-20 disabled:scale-100"
                            >
                                {booking ? 'Initiating...' : 'Secure Session'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-[#0f0f0f] rounded-[3rem] border border-gray-200 dark:border-[#222] p-10 shadow-2xl transition-colors">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Operations Status</span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3 font-serif">Registry Dashboard</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
                            <div className="bg-gray-50 dark:bg-[#151515] p-6 rounded-3xl border border-gray-100 dark:border-[#222]">
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Pending</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 font-serif transition-colors">
                                    {getAppointmentsForDate(selectedDate).filter(a => a.status === 'PENDING').length}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#151515] p-6 rounded-3xl border border-gray-100 dark:border-[#222]">
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Confirmed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 font-serif transition-colors">
                                    {getAppointmentsForDate(selectedDate).filter(a => a.status === 'CONFIRMED').length}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#151515] p-6 rounded-3xl border border-gray-100 dark:border-[#222]">
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Rejected</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2 font-serif transition-colors">
                                    {getAppointmentsForDate(selectedDate).filter(a => a.status === 'REJECTED').length}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Agenda Feed */}
                <div className="bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-10 flex-1 flex flex-col min-h-0 transition-all">
                    <div className="mb-10 flex justify-between items-center">
                        <span className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Agenda Feed</span>
                        <div className="w-12 h-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-full"></div>
                    </div>

                    <div className="space-y-6 overflow-y-auto max-h-[400px] custom-scrollbar pr-4">
                        {getAppointmentsForDate(selectedDate).length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Agenda Registry Void</p>
                            </div>
                        ) : (
                            getAppointmentsForDate(selectedDate).map((appt) => (
                                <div key={appt.id} className="p-8 rounded-[2rem] bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222] hover:border-[#D4AF37]/40 transition-all group relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="flex items-center gap-3 text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.2em]">
                                            <FiClock className="text-[#D4AF37]/50" /> {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${appt.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                                            appt.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 line-through decoration-red-500/50' :
                                                'bg-[#D4AF37]/10 text-[#D4AF37]'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white font-serif">{appt.type}</h4>
                                        {(appt.caseTitle || appt.caseSummary) && (
                                            <div className="rounded-xl bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 mt-2">
                                                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">Case for this protocol</p>
                                                {appt.caseTitle && <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{appt.caseTitle}</p>}
                                                {appt.caseSummary && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">{appt.caseSummary}</p>
                                                )}
                                            </div>
                                        )}
                                        {appt.providerName && (
                                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] pt-1">
                                                Session with: {appt.providerName}
                                            </p>
                                        )}
                                        {!isCitizen && appt.requesterName && (
                                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] pt-2">
                                                Requester: {appt.requesterName}
                                            </p>
                                        )}
                                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed mt-4 italic">
                                            {appt.description || 'NO ADDITIONAL PROTOCOLS PROVIDED'}
                                        </p>
                                    </div>

                                    {/* Action Buttons for Lawyers/NGOs */}
                                    {!isCitizen && appt.status === 'PENDING' && (
                                        <div className="mt-6 flex gap-3 pt-6 border-t border-gray-200 dark:border-[#222]">
                                            <button
                                                onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                                                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-900/20 font-bold text-sm flex items-center justify-center gap-2"
                                                title="Approve Appointment"
                                            >
                                                <FiCheck strokeWidth={3} />
                                                <span>Approve</span>
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(appt.id, "REJECTED")}
                                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-900/20 font-bold text-sm flex items-center justify-center gap-2"
                                                title="Reject Appointment"
                                            >
                                                <FiX strokeWidth={3} />
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    )}
                                    {!isCitizen && appt.status === 'CONFIRMED' && appt.caseId && (
                                        <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-200 dark:border-[#222]">
                                            <button
                                                onClick={() => handleViewCaseDetails(appt.caseId)}
                                                className="px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-[#252525] transition font-bold text-sm flex items-center gap-2 border border-gray-200 dark:border-[#333]"
                                            >
                                                <FiFileText size={16} />
                                                <span>View Case Details</span>
                                            </button>
                                            {assignedMap.has(appt.caseId) ? (
                                                <button
                                                    onClick={() => handleCancelCase(appt)}
                                                    className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-bold text-sm flex items-center gap-2"
                                                >
                                                    <FiX size={16} />
                                                    <span>Cancel Case</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleTakeCase(appt)}
                                                    className="px-4 py-3 bg-[#D4AF37] text-black rounded-xl hover:bg-[#c5a059] transition font-bold text-sm flex items-center gap-2"
                                                >
                                                    <FiCheck size={16} />
                                                    <span>Take Case</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* View Case Details Modal (Lawyer/NGO) */}
            {(viewingCase !== null || caseDetailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#0f0f0f] border border-[#D4AF37]/30 rounded-[2.5rem] p-10 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] opacity-50 rounded-t-[2.5rem]"></div>
                        {caseDetailLoading ? (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm font-bold text-gray-500">Loading case details…</p>
                            </div>
                        ) : viewingCase ? (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif">Case Details</h3>
                                    <button onClick={() => setViewingCase(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500">
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Title</span><p className="text-gray-900 dark:text-white mt-1">{viewingCase.caseTitle || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Type</span><p className="text-gray-900 dark:text-white mt-1">{viewingCase.caseType || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Urgency</span><p className="text-gray-900 dark:text-white mt-1">{viewingCase.urgency || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Location</span><p className="text-gray-900 dark:text-white mt-1">{viewingCase.incidentPlace || '—'}</p></div>
                                    <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Victim</span><p className="text-gray-900 dark:text-white mt-1">{viewingCase.victimName || '—'} {viewingCase.relation ? `(${viewingCase.relation})` : ''}</p></div>
                                    {viewingCase.background && <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Background</span><p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{viewingCase.background}</p></div>}
                                    {viewingCase.relief && <div><span className="font-bold text-[#D4AF37] uppercase tracking-wider">Relief Sought</span><p className="text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{viewingCase.relief}</p></div>}
                                    {viewingCase.documentsUrl && (
                                        <div className="pt-4 border-t border-gray-200 dark:border-[#222]">
                                            <span className="font-bold text-[#D4AF37] uppercase tracking-wider">Case documents</span>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 mb-2">Shared by the citizen. View or download below.</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {viewingCase.documentsUrl.split(',').map((url, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={url.trim()}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 dark:hover:bg-[#D4AF37]/30 text-xs font-bold uppercase tracking-wider"
                                                    >
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

            {/* Conflict Confirmation Modal */}
            {
                showConflictModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-[#0f0f0f] border border-[#D4AF37]/30 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_100px_rgba(212,175,55,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37] opacity-50"></div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                                    <FiInfo size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">Temporal Conflict</h3>
                                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mt-1">Resource Overlap Detected</p>
                                </div>
                            </div>

                            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed mb-10 tracking-wide uppercase">
                                {conflictInfo}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => {
                                        setShowConflictModal(false);
                                        setConflictInfo(null);
                                    }}
                                    className="py-4 bg-gray-50 dark:bg-[#151515] text-gray-500 border border-gray-100 dark:border-[#222] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white hover:border-red-500/50 transition-all"
                                >
                                    NO - CANCEL
                                </button>
                                <button
                                    onClick={() => handleBook(true)}
                                    className="py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c5a059] shadow-lg shadow-[#D4AF37]/10 active:scale-95 transition-all"
                                >
                                    YES - PROCEED
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
