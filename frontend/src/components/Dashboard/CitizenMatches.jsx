import React, { useState, useEffect } from "react";
import { getMatches } from "../../api/caseApi";
import { FiUser, FiMessageSquare, FiMapPin, FiAward, FiStar, FiArrowLeft, FiShield, FiInfo, FiX, FiMail, FiPhone, FiMap } from "react-icons/fi";
import { createSession } from "../../api/chatApi";
import { toast } from "sonner";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function CitizenMatches({ caseId, caseDetail, setActivePage, setSelectedRecipient, onBookAppointment, onBack, appointments = [] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [matches, setMatches] = useState({ lawyers: [], ngos: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("lawyers");
    const [viewingDetail, setViewingDetail] = useState(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await getMatches(caseId);
                const data = res.data;
                // Normalize name field
                if (data.lawyers) data.lawyers = data.lawyers.map(l => ({ ...l, name: l.fullName }));
                if (data.ngos) data.ngos = data.ngos.map(n => ({ ...n, name: n.ngoName }));
                setMatches(data);
            } catch (err) {
                console.error("Error fetching matches:", err);
            } finally {
                setLoading(false);
            }
        };
        if (caseId) fetchMatches();
    }, [caseId]);

    const handleStartChat = async (provider, role) => {
        try {
            const res = await createSession(caseId, provider.id, role.toUpperCase());
            const session = res.data;

            if (session && session.id) {
                setSelectedRecipient({
                    type: role.toLowerCase(),
                    id: provider.id,
                    name: provider.name || provider.fullName || provider.ngoName || "Provider",
                    sessionId: session.id
                });
                setActivePage("messages");
            } else {
                toast.error("Failed to create chat session.");
            }
        } catch (err) {
            console.error("Error starting chat:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to start chat session.";
            toast.error(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] transition-colors">
                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-[0.3em] transition-colors">Querying Verified Network...</p>
            </div>
        );
    }

    const lawyers = matches.lawyers || [];
    const ngos = matches.ngos || [];

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-10 shadow-2xl relative font-sans transition-colors duration-300">
            <button
                onClick={onBack}
                className="text-[10px] font-bold text-[#D4AF37] hover:text-gray-900 dark:hover:text-white uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors group"
            >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Case Repository
            </button>
            <div className="mb-10">
                <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Algorithmic Matching</span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Verified Legal Providers</h2>
                <p className="text-gray-600 dark:text-gray-500 text-sm mt-2 max-w-xl transition-colors">The following professionals have been matched based on your case classification, location, and specialization requirements.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-10 border-b border-gray-200 dark:border-[#333] mb-10 transition-colors">
                <button
                    onClick={() => setActiveTab("lawyers")}
                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "lawyers"
                        ? "text-[#D4AF37]"
                        : "text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                        }`}
                >
                    Lawyers ({lawyers.length})
                    {activeTab === "lawyers" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab("ngos")}
                    className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "ngos"
                        ? "text-[#D4AF37]"
                        : "text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                        }`}
                >
                    NGOs ({ngos.length})
                    {activeTab === "ngos" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(activeTab === "lawyers" ? lawyers : ngos).map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl p-6 hover:border-[#D4AF37]/50 transition-all duration-500 group shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FiShield size={80} className="text-[#D4AF37]" />
                        </div>

                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xl font-bold text-[#D4AF37] shadow-inner group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                {item.name.charAt(0)}
                            </div>
                            {item.isVerified && (
                                <span className="bg-[#D4AF37] text-black text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-[#D4AF37]/10">
                                    Vetted
                                </span>
                            )}
                        </div>

                        <h3 className="font-bold text-xl text-gray-900 dark:text-white font-serif mb-2 tracking-tight group-hover:text-[#D4AF37] transition-colors">{item.name}</h3>

                        <div className="space-y-2 mb-6">
                            <div className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-2 uppercase tracking-widest">
                                <FiAward className="w-3 h-3" /> {activeTab === "lawyers" ? item.specialization : item.ngoType || "NGO"}
                            </div>
                            <div className="text-[10px] font-bold text-gray-600 dark:text-gray-500 flex items-center gap-2 uppercase tracking-widest transition-colors">
                                <FiMapPin className="w-3 h-3" /> {item.city}, {item.state}
                            </div>
                        </div>

                        <button
                            onClick={() => setViewingDetail({ item, role: activeTab === "lawyers" ? "LAWYER" : "NGO" })}
                            className="w-full mb-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        >
                            <FiInfo className="w-3.5 h-3.5" /> View details
                        </button>

                        <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-200 dark:border-[#222] transition-colors">
                            <button
                                onClick={() => handleStartChat(item, activeTab === "lawyers" ? "LAWYER" : "NGO")}
                                className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white hover:border-[#D4AF37] transition-all flex items-center justify-center gap-3 group/btn"
                            >
                                <FiMessageSquare className="w-4 h-4 text-[#D4AF37] group-hover/btn:scale-110 transition-transform" /> Initiate Consultation
                            </button>
                            {(() => {
                                const role = activeTab === "lawyers" ? "LAWYER" : "NGO";
                                const existingAppt = appointments.find(a => a.providerId === item.id && a.providerRole === role);
                                const hasAppt = !!existingAppt;
                                const status = existingAppt?.status;

                                return (
                                    <button
                                        onClick={() => onBookAppointment({ ...item, type: role }, caseDetail)}
                                        disabled={hasAppt && status !== 'REJECTED' && status !== 'CANCELLED'}
                                        className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${hasAppt
                                            ? (status === 'CONFIRMED' || status === 'APPROVED')
                                                ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 cursor-default"
                                                : (status === 'REJECTED' || status === 'CANCELLED')
                                                    ? "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                                    : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 cursor-default"
                                            : "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                            }`}
                                    >
                                        <FiStar className={`w-4 h-4 ${hasAppt ? 'opacity-40' : 'opacity-100'}`} />
                                        {hasAppt
                                            ? (status === 'REJECTED' || status === 'CANCELLED')
                                                ? "Rebook Encounter"
                                                : `Phase: ${status}`
                                            : "Schedule Protocol"}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                ))}

                {(activeTab === "lawyers" ? lawyers : ngos).length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-[#111] border border-dashed border-gray-300 dark:border-[#333] rounded-2xl flex flex-col items-center transition-colors">
                        <FiUser className="w-16 h-16 text-gray-400 dark:text-gray-800 mb-6 opacity-20 transition-colors" />
                        <p className="text-gray-600 dark:text-gray-500 font-bold uppercase tracking-widest text-xs mb-6 px-10 max-w-lg leading-relaxed transition-colors">No direct matches identified in this tier based on current case parameters.</p>
                        <button
                            onClick={() => setActivePage("find")}
                            className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/10"
                        >
                            Access Full Registry Manually
                        </button>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {viewingDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setViewingDetail(null)}
                >
                    <div
                        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl flex flex-col ${isDark ? "bg-[#0f0f0f] border-[#333]" : "bg-white border-gray-200"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? "bg-[#0f0f0f] border-[#222]" : "bg-gray-50 border-gray-200"}`}>
                            <h3 className={`text-lg font-bold font-serif ${isDark ? "text-white" : "text-gray-900"}`}>
                                {viewingDetail.role === "LAWYER" ? "Lawyer details" : "NGO details"}
                            </h3>
                            <button
                                onClick={() => setViewingDetail(null)}
                                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-600"}`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {viewingDetail.role === "LAWYER" ? (
                                <>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Name</p>
                                        <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{viewingDetail.item.name || viewingDetail.item.fullName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Specialization</p>
                                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.specialization || "—"}</p>
                                    </div>
                                    {(viewingDetail.item.experienceYears ?? viewingDetail.item.experience) != null && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Experience</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.experienceYears ?? viewingDetail.item.experience} years</p>
                                        </div>
                                    )}
                                    {(viewingDetail.item.barCouncilId || viewingDetail.item.barState) && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Bar Council</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                                                {[viewingDetail.item.barCouncilId, viewingDetail.item.barState].filter(Boolean).join(" • ") || "—"}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Location</p>
                                        <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                            {[viewingDetail.item.city, viewingDetail.item.district, viewingDetail.item.state].filter(Boolean).join(", ") || "—"}
                                        </p>
                                    </div>
                                    {viewingDetail.item.address && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Address</p>
                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{viewingDetail.item.address}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingDetail.item.email && (
                                            <div className="flex items-center gap-2">
                                                <FiMail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`mailto:${viewingDetail.item.email}`} className={`text-sm truncate hover:underline ${isDark ? "text-[#D4AF37]" : "text-[#c5a059]"}`}>
                                                    {viewingDetail.item.email}
                                                </a>
                                            </div>
                                        )}
                                        {(viewingDetail.item.mobileNum || viewingDetail.item.mobile_number) && (
                                            <div className="flex items-center gap-2">
                                                <FiPhone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`tel:${viewingDetail.item.mobileNum || viewingDetail.item.mobile_number}`} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                    {viewingDetail.item.mobileNum || viewingDetail.item.mobile_number}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {viewingDetail.item.verificationStatus !== false || viewingDetail.item.isVerified ? (
                                        <div className="flex items-center gap-2 pt-2">
                                            <FiShield className="w-4 h-4 text-[#D4AF37]" />
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Verified professional</span>
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Name</p>
                                        <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{viewingDetail.item.name || viewingDetail.item.ngoName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Type</p>
                                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.ngoType || "—"}</p>
                                    </div>
                                    {viewingDetail.item.registrationNumber && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Registration number</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.registrationNumber}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Location</p>
                                        <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                            {[viewingDetail.item.city, viewingDetail.item.district, viewingDetail.item.state].filter(Boolean).join(", ") || "—"}
                                            {viewingDetail.item.pincode && ` ${viewingDetail.item.pincode}`}
                                        </p>
                                    </div>
                                    {viewingDetail.item.address && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Address</p>
                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{viewingDetail.item.address}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingDetail.item.email && (
                                            <div className="flex items-center gap-2">
                                                <FiMail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`mailto:${viewingDetail.item.email}`} className={`text-sm truncate hover:underline ${isDark ? "text-[#D4AF37]" : "text-[#c5a059]"}`}>
                                                    {viewingDetail.item.email}
                                                </a>
                                            </div>
                                        )}
                                        {(viewingDetail.item.contact) && (
                                            <div className="flex items-center gap-2">
                                                <FiPhone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`tel:${viewingDetail.item.contact}`} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                    {viewingDetail.item.contact}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {viewingDetail.item.verificationStatus !== false || viewingDetail.item.isVerified ? (
                                        <div className="flex items-center gap-2 pt-2">
                                            <FiShield className="w-4 h-4 text-[#D4AF37]" />
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Verified organization</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                        <div className={`p-6 pt-4 flex flex-wrap gap-3 border-t ${isDark ? "border-[#222]" : "border-gray-200"}`}>
                            <button
                                onClick={() => {
                                    handleStartChat(viewingDetail.item, viewingDetail.role);
                                    setViewingDetail(null);
                                }}
                                className="flex-1 min-w-[140px] py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <FiMessageSquare className="w-4 h-4" /> Message
                            </button>
                            {(() => {
                                const existingAppt = appointments.find(a => a.providerId === viewingDetail.item.id && a.providerRole === viewingDetail.role);
                                const hasAppt = !!existingAppt;
                                const status = existingAppt?.status;
                                const canRebook = hasAppt && (status === "REJECTED" || status === "CANCELLED");
                                const disabled = hasAppt && !canRebook;
                                return (
                                    <button
                                        onClick={() => {
                                            if (disabled) return;
                                            onBookAppointment({ ...viewingDetail.item, type: viewingDetail.role }, caseDetail);
                                            setViewingDetail(null);
                                        }}
                                        disabled={disabled}
                                        className={`flex-1 min-w-[140px] py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${disabled
                                            ? "bg-gray-200 dark:bg-[#222] text-gray-500 dark:text-gray-500 cursor-not-allowed"
                                            : canRebook
                                                ? "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                                : "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                            }`}
                                    >
                                        <FiStar className="w-4 h-4" />
                                        {hasAppt ? (canRebook ? "Rebook" : `Phase: ${status}`) : "Schedule"}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
