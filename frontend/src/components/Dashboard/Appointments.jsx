import React, { useState, useEffect } from "react";
import { getMyAppointments, scheduleAppointment, updateAppointmentStatus } from "../../api/appointmentApi";
import { FiCalendar, FiClock, FiVideo, FiPhone, FiMapPin, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { toast } from "sonner";

export default function Appointments({ profile, onAppointmentUpdate }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const role = profile?.role || localStorage.getItem("role") || "CITIZEN";
    const isCitizen = role === "CITIZEN";

    const [formData, setFormData] = useState({
        providerId: profile?.initialAppointmentData?.providerId || "",
        providerRole: profile?.initialAppointmentData?.providerRole || "LAWYER",
        startTime: "",
        type: "CALL",
        description: ""
    });

    useEffect(() => {
        if (profile?.initialAppointmentData) {
            setFormData(prev => ({
                ...prev,
                providerId: profile.initialAppointmentData.providerId,
                providerRole: profile.initialAppointmentData.providerRole
            }));
            setShowModal(true);
        }
    }, [profile?.initialAppointmentData]);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const res = await getMyAppointments();
            setAppointments(res.data);
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e) => {
        e.preventDefault();
        try {
            if (!formData.providerId || !formData.startTime) {
                toast.error("Please fill all required fields");
                return;
            }

            const start = new Date(formData.startTime);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

            const payload = {
                ...formData,
                endTime: end.toISOString()
            };

            await scheduleAppointment(payload);
            toast.success("Appointment request sent!");
            setShowModal(false);
            fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data || "Failed to schedule appointment");
        }
    };

    const handleUpdateStatus = async (id, status) => {
        console.log(`DEBUG: Attempting to update status for Appointment ID: ${id} to ${status}`);
        if (!id) {
            toast.error("Error: Appointment ID is missing");
            return;
        }

        // Optimistic Update
        const originalAppointments = [...appointments];
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status } : a));

        try {
            await updateAppointmentStatus(id, status);
            toast.success(`Appointment ${status.toLowerCase()}ed!`);
            await fetchAppointments();
            if (onAppointmentUpdate) onAppointmentUpdate();
        } catch (err) {
            console.error("Failed to update status:", err);
            // Revert on failure
            setAppointments(originalAppointments);
            toast.error(err.response?.data?.message || err.message || "Failed to update status");
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case "CONFIRMED": return "bg-[#D4AF37] text-black border border-[#D4AF37]";
            case "PENDING": return "bg-transparent text-[#D4AF37] border border-[#D4AF37]/30";
            case "REJECTED": return "bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50";
            default: return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700";
        }
    };

    return (
        <div className="space-y-8 font-sans transition-colors duration-300">
            <div className="rounded-2xl p-8 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] shadow-2xl relative overflow-hidden group transition-colors">
                <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-all">
                    <FiCalendar size={120} className="text-[#D4AF37]" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Scheduler</span>
                        <h1 className="text-3xl font-bold font-serif text-gray-900 dark:text-white tracking-tight transition-colors">Appointments</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-md transition-colors">Orchestrate your legal consultations and system meetings with precision.</p>
                    </div>
                    {isCitizen && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-[#D4AF37] text-black px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#c5a059] transition-all transform hover:scale-105 shadow-xl shadow-[#D4AF37]/10 flex items-center gap-2"
                        >
                            <FiPlus strokeWidth={3} /> New Booking
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Synchronizing...</p>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-gray-200 dark:border-[#333] group transition-colors">
                    <FiCalendar className="w-16 h-16 text-gray-300 dark:text-gray-800 mx-auto mb-6 group-hover:text-[#D4AF37]/20 transition-colors" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Scheduled Engagements</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {appointments.map(appt => (
                        <div key={appt.id} className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-200 dark:border-[#333] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-[#D4AF37]/40 hover:shadow-2xl transition-all duration-300 group">
                            <div className="flex items-start gap-6 flex-1">
                                <div className="bg-gray-50 dark:bg-[#252525] p-3 rounded-xl border border-gray-200 dark:border-[#333] text-[#D4AF37] font-bold text-center min-w-[90px] shadow-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                    <div className="text-[10px] uppercase tracking-widest mb-1">{new Date(appt.startTime).toLocaleString('default', { month: 'short' })}</div>
                                    <div className="text-3xl font-serif leading-none">{new Date(appt.startTime).getDate()}</div>
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg font-serif tracking-tight transition-colors">
                                            {isCitizen
                                                ? appt.providerName
                                                    ? `${appt.type} / ${appt.providerRole === 'LAWYER' ? 'Lawyer' : 'NGO'} ${appt.providerName}`
                                                    : `${appt.type} / Provider #${appt.providerId}`
                                                : appt.requesterName
                                                    ? `${appt.type} / Citizen ${appt.requesterName}`
                                                    : `${appt.type} / Citizen #${appt.requesterId}`}
                                        </h3>
                                        <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-colors ${getStatusStyles(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <div className="text-gray-500 text-[11px] font-bold uppercase tracking-widest flex items-center gap-6">
                                        <span className="flex items-center gap-2 text-[#D4AF37]"><FiClock /> {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="flex items-center gap-2">
                                            {appt.type === 'VIDEO_CALL' ? <FiVideo className="text-blue-500" /> : appt.type === 'CALL' ? <FiPhone className="text-green-500" /> : <FiMapPin className="text-red-500" />}
                                            {appt.type}
                                        </span>
                                    </div>
                                    {appt.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium border-l-2 border-[#D4AF37]/20 pl-4 transition-colors">{appt.description}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                                {!isCitizen && appt.status === "PENDING" && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(appt.id, "CONFIRMED")}
                                            className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-900/20 font-bold text-sm flex items-center gap-2"
                                            title="Approve Appointment"
                                        >
                                            <FiCheck strokeWidth={3} />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(appt.id, "REJECTED")}
                                            className="flex-1 md:flex-none px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-900/20 font-bold text-sm flex items-center gap-2"
                                            title="Reject Appointment"
                                        >
                                            <FiX strokeWidth={3} />
                                            <span>Reject</span>
                                        </button>
                                    </>
                                )}
                                {appt.status === "CONFIRMED" && appt.type === "VIDEO_CALL" && (
                                    <button className="w-full md:w-auto px-6 py-2.5 bg-[#D4AF37] text-black rounded-xl hover:bg-[#c5a059] transition text-xs font-bold uppercase tracking-widest shadow-xl shadow-[#D4AF37]/20">
                                        Enter Chambers
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - Redesigned for Dark/Gold */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-md w-full p-8 border border-gray-200 dark:border-[#333] shadow-2xl overflow-hidden relative transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]"></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif mb-6 tracking-tight transition-colors">Request Consultation</h2>
                        <form onSubmit={handleSchedule} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Provider ID</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm transition-all"
                                        value={formData.providerId}
                                        onChange={e => setFormData({ ...formData, providerId: e.target.value })}
                                        placeholder="ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Role Type</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm cursor-pointer transition-colors"
                                        value={formData.providerRole}
                                        onChange={e => setFormData({ ...formData, providerRole: e.target.value })}
                                    >
                                        <option value="LAWYER">Lawyer</option>
                                        <option value="NGO">NGO</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Preferred Timeline</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm transition-colors"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Communication Mode</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm cursor-pointer transition-colors"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="CALL">Authenticated Phone Call</option>
                                    <option value="VIDEO_CALL">Secure Video Conference</option>
                                    <option value="MEETING">Physical Office Visit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Brief Summary</label>
                                <textarea
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm resize-none transition-colors"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Outline the matter for discussion..."
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/20"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
