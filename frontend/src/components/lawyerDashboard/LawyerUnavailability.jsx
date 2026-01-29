import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiChevronLeft, FiChevronRight, FiCheck, FiX, FiTrash2, FiEdit2 } from 'react-icons/fi';
import axiosClient from '../../api/axiosClient';
import { toast } from 'sonner';

export default function LawyerUnavailability({ profile }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [unavailabilityList, setUnavailabilityList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [reason, setReason] = useState('');
    const [editingItem, setEditingItem] = useState(null);

    useEffect(() => {
        fetchUnavailability();
    }, []);

    const fetchUnavailability = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/unavailability/my-unavailability');
            setUnavailabilityList(res.data || []);
        } catch (err) {
            console.error('Error fetching unavailability:', err);
            toast.error('Failed to load unavailability periods');
        } finally {
            setLoading(false);
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

    const getUnavailabilityForDate = (date) => {
        return unavailabilityList.filter(item => {
            const itemDate = new Date(item.startTime);
            return isSameDay(itemDate, date);
        });
    };

    const validateTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return false;
        if (hours < 9 || hours > 17) return false;
        if (hours === 17 && minutes > 0) return false;
        if (minutes < 0 || minutes >= 60) return false;
        return true;
    };

    const handleTimeChange = (type, value) => {
        if (type === 'start') {
            setStartTime(value);
        } else {
            setEndTime(value);
        }
    };

    const handleAddUnavailable = () => {
        if (!selectedDate) {
            toast.error('Please select a date first');
            return;
        }

        if (!startTime || !endTime) {
            toast.error('Please enter both start and end times');
            return;
        }

        if (!validateTime(startTime)) {
            toast.error('Start time must be between 9:00 and 17:00');
            return;
        }

        if (!validateTime(endTime)) {
            toast.error('End time must be between 9:00 and 17:00');
            return;
        }

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(selectedDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        if (startDateTime >= endDateTime) {
            toast.error('End time must be after start time');
            return;
        }

        // Check if this time overlaps with existing unavailability
        const existing = unavailabilityList.find(item => {
            const itemStart = new Date(item.startTime);
            const itemEnd = new Date(item.endTime);
            return (startDateTime < itemEnd && endDateTime > itemStart);
        });

        if (existing) {
            setEditingItem(existing);
            setReason(existing.reason || '');
            // Set times from existing
            const existingStart = new Date(existing.startTime);
            const existingEnd = new Date(existing.endTime);
            setStartTime(`${String(existingStart.getHours()).padStart(2, '0')}:${String(existingStart.getMinutes()).padStart(2, '0')}`);
            setEndTime(`${String(existingEnd.getHours()).padStart(2, '0')}:${String(existingEnd.getMinutes()).padStart(2, '0')}`);
        }

        setShowConfirmModal(true);
    };

    const handleConfirm = async () => {
        if (!selectedDate || !startTime || !endTime) {
            toast.error('Please select date and enter both start and end times');
            return;
        }

        if (!validateTime(startTime) || !validateTime(endTime)) {
            toast.error('Times must be between 9:00 and 17:00');
            return;
        }

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const start = new Date(selectedDate);
        start.setHours(startHour, startMin, 0, 0);
        
        const end = new Date(selectedDate);
        end.setHours(endHour, endMin, 0, 0);

        if (start >= end) {
            toast.error('End time must be after start time');
            return;
        }

        setSaving(true);
        try {
            // Format date as YYYY-MM-DD in local timezone (not UTC)
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            // Format time as HH:mm (24-hour format) in local timezone
            const formatTime = (date) => {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            };

            const payload = {
                date: formatDate(selectedDate),
                startTime: formatTime(start),
                endTime: formatTime(end),
                reason: reason || null
            };

            if (editingItem) {
                await axiosClient.put(`/unavailability/${editingItem.id}`, payload);
                toast.success('Unavailability period updated successfully');
            } else {
                await axiosClient.post('/unavailability', payload);
                toast.success('Unavailability period added successfully');
            }

            setShowConfirmModal(false);
            setStartTime('09:00');
            setEndTime('17:00');
            setReason('');
            setEditingItem(null);
            fetchUnavailability();
        } catch (err) {
            const errorMsg = err.response?.data || 'Failed to save unavailability period';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this unavailability period?')) return;
        
        try {
            await axiosClient.delete(`/unavailability/${id}`);
            toast.success('Unavailability period deleted successfully');
            fetchUnavailability();
        } catch (err) {
            const errorMsg = err.response?.data || 'Failed to delete unavailability period';
            toast.error(errorMsg);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col xl:flex-row gap-10 min-h-[700px] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out transition-colors">
            
            {/* Left: Calendar */}
            <div className="flex-1 bg-white dark:bg-[#0a0a0a] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl dark:shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all">
                <div className="p-12 border-b border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center bg-gray-50 dark:bg-[#111]">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-serif tracking-tighter">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <p className="text-[12px] text-[#D4AF37] font-black uppercase tracking-[0.4em] mt-3">Select Date</p>
                    </div>
                    <div className="flex gap-4">
                        {['prev', 'next'].map((dir, i) => (
                            <button
                                key={dir}
                                onClick={() => {
                                    const newDate = new Date(currentDate);
                                    newDate.setMonth(currentDate.getMonth() + (i === 0 ? -1 : 1));
                                    setCurrentDate(newDate);
                                }}
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
                        const unavailableCount = getUnavailabilityForDate(day).length;

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => setSelectedDate(day)}
                                className={`group relative aspect-square rounded-[1.5rem] flex flex-col items-center justify-center transition-all duration-500 border-2 ${
                                    isSelected
                                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_40px_rgba(212,175,55,0.3)] scale-110 z-10'
                                        : isToday
                                            ? 'bg-gray-100 dark:bg-[#111] border-[#D4AF37]/50 text-[#D4AF37]'
                                            : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-[#333]'
                                }`}
                            >
                                <span className={`text-xl font-bold font-serif ${
                                    isSelected ? 'text-black' : isToday ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                    {day.getDate()}
                                </span>
                                {unavailableCount > 0 && !isSelected && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Time Input */}
            <div className="w-full xl:w-[480px] space-y-10">
                <div className="bg-white dark:bg-[#0f0f0f] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl dark:shadow-[0_30px_70px_rgba(0,0,0,0.5)] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>

                    <div className="mb-10">
                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em]">Time Selection</span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-3 font-serif">
                            {selectedDate ? selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' }) : 'Select Date'}
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-3 font-medium">
                            Enter time range (24-hour format, 9:00 - 17:00)
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">
                                Start Time (24-hour format)
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    min="09:00"
                                    max="17:00"
                                    step="60"
                                    value={startTime || '09:00'}
                                    onChange={(e) => handleTimeChange('start', e.target.value)}
                                    disabled={!selectedDate}
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-4 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={20} />
                            </div>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-2">Minimum: 9:00</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">
                                End Time (24-hour format)
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    min="09:00"
                                    max="17:00"
                                    step="60"
                                    value={endTime}
                                    onChange={(e) => handleTimeChange('end', e.target.value)}
                                    disabled={!selectedDate}
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-4 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={20} />
                            </div>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 mt-2">Maximum: 17:00</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">
                                Reason (Optional)
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={!selectedDate}
                                placeholder="e.g., Personal Leave, Court Hearing"
                                className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-4 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        <button
                            onClick={handleAddUnavailable}
                            disabled={!selectedDate || !startTime || !endTime}
                            className="w-full py-4 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <FiCheck size={18} /> Mark as Unavailable
                        </button>
                    </div>
                </div>

                {/* List of Unavailable Periods */}
                {unavailabilityList.length > 0 && (
                    <div className="bg-white dark:bg-[#0f0f0f] rounded-[3rem] border border-gray-200 dark:border-[#222] shadow-2xl p-10">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif mb-6">Unavailable Periods</h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {unavailabilityList.map(item => (
                                <div key={item.id} className="bg-gray-50 dark:bg-[#151515] p-4 rounded-xl border border-gray-200 dark:border-[#333] flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
                                        </p>
                                        {item.reason && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reason: {item.reason}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition"
                                            title="Delete"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-md w-full p-8 border border-gray-200 dark:border-[#333] shadow-2xl overflow-hidden relative transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]"></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif mb-6 tracking-tight transition-colors">
                            {editingItem ? 'Edit Unavailable Period' : 'Mark as Unavailable'}
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 dark:bg-[#111] p-4 rounded-xl">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Date:</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedDate?.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 mb-2">Time Range:</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {startTime} - {endTime} (24-hour format)
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
                                    Reason (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm transition-all"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="e.g., Personal Leave, Court Hearing"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setStartTime('09:00');
                                        setEndTime('17:00');
                                        setReason('');
                                        setEditingItem(null);
                                    }}
                                    className="flex-1 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-white/5 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <FiX /> Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={saving}
                                    className="flex-1 py-3.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <FiCheck /> {saving ? 'Saving...' : 'Yes, Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
