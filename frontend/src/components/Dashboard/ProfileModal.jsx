import React from 'react';

export default function ProfileModal({ profile, onClose, onMessage }) {
    if (!profile) return null;

    const isLawyer = profile.type === 'lawyer' || profile.role === 'LAWYER';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">

                {/* Header with Cover-like background */}
                <div className="h-32 bg-gradient-to-r from-teal-800 to-teal-600 rounded-t-xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-8 pb-8">
                    {/* Profile Image & Basic Info */}
                    <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-200 shadow-lg overflow-hidden flex-shrink-0">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-400">
                                    {profile.name?.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                                ID: {profile.originalId || profile.id}
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600 mt-1">
                                {profile.specialization && (
                                    <span className="bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide">
                                        {profile.specialization}
                                    </span>
                                )}
                                {profile.type === 'ngo' && (
                                    <span className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full font-medium uppercase tracking-wide">
                                        NGO
                                    </span>
                                )}
                                {profile.isVerified && (
                                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Verified
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => {
                                    onClose();
                                    onMessage(profile);
                                }}
                                className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors text-sm"
                            >
                                Message
                            </button>
                            <button
                                onClick={() => {
                                    onClose();
                                    profile.onBookAppointment && profile.onBookAppointment(profile);
                                }}
                                className="bg-[#FDB415] hover:bg-[#eaa512] text-[#234f4a] px-6 py-2 rounded-lg font-bold shadow-sm transition-colors text-sm"
                            >
                                Book Appointment
                            </button>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                                <div className="flex items-start gap-2 text-gray-700">
                                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span>
                                        {profile.city}, {profile.district}, {profile.state}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact</h3>
                                <div className="space-y-2">
                                    {profile.email && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <span>{profile.email}</span>
                                        </div>
                                    )}
                                    {profile.mobile && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span>{profile.mobile}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {profile.bio && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h3>
                                    <p className="text-gray-700 leading-relaxed text-sm">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {isLawyer && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="font-semibold text-gray-800 mb-2">Practice Areas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {/* Assuming specialization is a single string for now, but if it was an array we'd map it */}
                                        <span className="bg-white border text-gray-600 text-xs px-2 py-1 rounded shadow-sm">
                                            {profile.specialization || "General Practice"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {profile.type === 'ngo' && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="font-semibold text-gray-800 mb-2">Focus Areas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="bg-white border text-gray-600 text-xs px-2 py-1 rounded shadow-sm">
                                            {profile.ngoType || "Social Welfare"}
                                        </span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
