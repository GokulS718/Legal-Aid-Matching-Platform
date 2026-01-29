import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { FiCalendar, FiClock, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AppointmentBooking = ({ providerId, providerRole = "LAWYER", providerName, onClose, onSuccess }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, [selectedDate, providerId, providerRole]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const response = await axiosClient.get(`/appointments/availability`, {
                params: { providerId, providerRole, date: selectedDate }
            });
            setSlots(response.data);
        } catch (err) {
            console.error("Error fetching availability", err);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!selectedSlot) return;
        setIsBooking(true);
        try {
            const startTime = `${selectedDate}T${selectedSlot}:00`;
            const [hour, minute] = selectedSlot.split(':').map(Number);
            const endHour = hour + 1;
            const endTime = `${selectedDate}T${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

            const response = await axiosClient.post('/appointments', {
                providerId,
                providerRole: providerRole.toUpperCase(),
                startTime,
                endTime,
                type: 'Legal Consultation',
                description: 'Booked via portal'
            });

            console.log('DEBUG: [AppointmentBooking] Booking successful:', response.data);
            toast.success('Consultation session secured.');
            if (onSuccess) {
                console.log('DEBUG: [AppointmentBooking] Calling onSuccess callback');
                onSuccess();
            }
            if (onClose) onClose();
        } catch (err) {
            console.error('DEBUG: [AppointmentBooking] Booking failed:', err);
            toast.error('Reservation failed. Please synchronise and try again.');
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4 transition-colors">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-3xl w-full max-w-md overflow-hidden shadow-3xl flex flex-col relative transition-colors">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-[#D4AF37] transition-colors p-2"
                >
                    <FiX size={20} />
                </button>

                <div className="p-8 border-b border-gray-100 dark:border-[#222] transition-colors">
                    <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Scheduling Protocol</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Reserve Consultation</h2>
                    <p className="text-gray-500 text-xs mt-1 font-medium italic transition-colors">Establishing link with {providerName || "Legal Provider"}</p>
                </div>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Select Target Date</label>
                        <div className="relative group">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] pl-12 pr-4 py-3.5 rounded-xl text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all appearance-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Available Chronos</h3>
                            {loading && <div className="w-4 h-4 border-2 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>}
                        </div>

                        {!loading && slots.length === 0 ? (
                            <div className="py-10 text-center bg-gray-50 dark:bg-[#111] rounded-2xl border border-dashed border-gray-200 dark:border-[#222] transition-colors">
                                <FiClock className="w-8 h-8 text-gray-300 dark:text-gray-800 mx-auto mb-2 opacity-30 transition-colors" />
                                <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest transition-colors">No available windows</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {slots.map((slot) => {
                                    const isAvailable = slot.status === 'AVAILABLE';
                                    const isSelected = selectedSlot === slot.time;

                                    return (
                                        <button
                                            key={slot.time}
                                            onClick={() => isAvailable && setSelectedSlot(slot.time)}
                                            disabled={!isAvailable}
                                            className={`p-3 text-xs rounded-xl font-black uppercase tracking-widest transition-all duration-300 border ${isSelected
                                                ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-xl shadow-[#D4AF37]/20 scale-105'
                                                : isAvailable
                                                    ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10'
                                                    : 'bg-transparent text-gray-300 dark:text-gray-800 border-gray-100 dark:border-[#222] cursor-not-allowed opacity-30'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 dark:border-[#222] bg-gray-50/50 dark:bg-[#111]/50 flex flex-col gap-3 transition-colors">
                    <button
                        onClick={handleBooking}
                        disabled={!selectedSlot || isBooking}
                        className={`w-full py-4 rounded-xl text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${!selectedSlot || isBooking
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-[#D4AF37] hover:bg-[#c5a059] shadow-[#D4AF37]/10 active:scale-95'
                            }`}
                    >
                        {isBooking ? "Syncing..." : <><FiCheck className="w-4 h-4" /> Secure Session</>}
                    </button>
                    <p className="text-[8px] text-gray-400 dark:text-gray-600 text-center font-bold uppercase tracking-[0.2em] mt-2 transition-colors">By securing a session, you agree to our legal protocol standards.</p>
                </div>
            </div>
        </div>
    );
};

export default AppointmentBooking;
