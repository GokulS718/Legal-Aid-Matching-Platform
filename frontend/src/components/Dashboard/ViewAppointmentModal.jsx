import React from 'react';

export default function ViewAppointmentModal({ appointment, onClose }) {
    if (!appointment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border border-gray-200 dark:border-[#333]">
                {/* Header */}
                <div className="bg-[#D4AF37] p-5 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-white">Appointment Details</h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-full p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-4">
                        <div className="bg-[#D4AF37]/10 p-3 rounded-lg text-[#D4AF37]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Date & Time</p>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">{appointment.date} at {appointment.time}</p>
                        </div>
                    </div>

                    {/* Client Name */}
                    <div className="flex items-center space-x-4">
                        <div className="bg-[#D4AF37]/10 p-3 rounded-lg text-[#D4AF37]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Client</p>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">{appointment.clientName || 'Unknown Client'}</p>
                        </div>
                    </div>

                    {/* Type */}
                    <div className="flex items-center space-x-4">
                        <div className="bg-[#D4AF37]/10 p-3 rounded-lg text-[#D4AF37]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Appointment Type</p>
                            <p className="text-gray-900 dark:text-white font-semibold text-lg">{appointment.type || 'Not Specified'}</p>
                        </div>
                    </div>

                    {/* Case for this protocol */}
                    {(appointment.caseTitle || appointment.caseSummary) && (
                        <div className="bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 rounded-lg">
                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-2">Case for this protocol</p>
                            {appointment.caseTitle && <p className="text-gray-900 dark:text-white font-semibold text-base mb-1">{appointment.caseTitle}</p>}
                            {appointment.caseSummary && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.caseSummary}</p>
                            )}
                        </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' :
                                appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                                    'bg-red-100 text-red-600'
                            }`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Status</p>
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {appointment.status}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 dark:bg-[#222] p-4 rounded-lg border border-gray-100 dark:border-[#333]">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide mb-2">Description</p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {appointment.description || "No description provided."}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-[#222] px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-[#333] dark:hover:bg-[#444] text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                        Close
                    </button>
                    {/* Could add actionable buttons here later, e.g. "Join Call" or "Reschedule" */}
                </div>
            </div>
        </div>
    );
}
