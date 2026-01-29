import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { 
    FiEye, FiSearch, FiBriefcase, FiCalendar, FiUser, FiFilter, 
    FiX, FiDownload, FiRefreshCw, FiAlertCircle, FiMapPin, FiAward,
    FiClock, FiCheckCircle, FiXCircle, FiFileText
} from "react-icons/fi";

export default function AdminCases() {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        caseType: "",
        specialization: "",
        urgency: "",
        startDate: "",
        endDate: ""
    });
    
    // Pagination
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        total: 0,
        totalPages: 0
    });

    // Fetch cases from backend
    const fetchCases = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
            });
            
            if (filters.search) params.append("search", filters.search);
            if (filters.status) params.append("status", filters.status);
            if (filters.caseType) params.append("caseType", filters.caseType);
            if (filters.specialization) params.append("specialization", filters.specialization);
            if (filters.urgency) params.append("urgency", filters.urgency);
            if (filters.startDate) params.append("startDate", filters.startDate);
            if (filters.endDate) params.append("endDate", filters.endDate);

            console.log("Fetching cases from /admin/cases with params:", params.toString());
            const response = await axiosClient.get(`/admin/cases?${params.toString()}`);
            console.log("Cases response:", response);
            
            if (response.data && response.data.cases) {
                setCases(response.data.cases);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0,
                    totalPages: response.data.totalPages || 0
                }));
            } else {
                console.warn("Unexpected response format:", response.data);
                setCases([]);
            }
        } catch (error) {
            console.error("Error fetching cases:", error);
            console.error("Error response:", error.response);
            console.error("Error status:", error.response?.status);
            console.error("Error URL:", error.config?.url);
            
            if (error.response?.status === 404) {
                toast.error("Cases endpoint not found. Please ensure the backend server is running and restarted.");
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error("Access denied. Please check your admin permissions.");
            } else {
                toast.error(`Failed to load cases: ${error.response?.data?.message || error.message || "Unknown error"}`);
            }
            setCases([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCases();
    }, [pagination.page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "",
            caseType: "",
            specialization: "",
            urgency: "",
            startDate: "",
            endDate: ""
        });
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handleViewDetails = (caseItem) => {
        setSelectedCase(caseItem);
        setShowDetails(true);
    };

    const getStatusStyle = (status) => {
        switch (status?.toUpperCase()) {
            case "DRAFT":
                return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800";
            case "SUBMITTED":
                return "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
            case "UNDER_REVIEW":
                return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50";
            case "MATCHED":
                return "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50";
            case "IN_PROGRESS":
                return "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
            case "CLOSED":
                return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
            default:
                return "bg-gray-100 dark:bg-[#111] text-gray-500 border-gray-200 dark:border-[#333]";
        }
    };

    const getUrgencyStyle = (urgency) => {
        switch (urgency?.toUpperCase()) {
            case "URGENT":
                return "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
            case "HIGH":
                return "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
            case "MEDIUM":
                return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50";
            case "LOW":
                return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
            default:
                return "bg-gray-100 dark:bg-[#111] text-gray-500 border-gray-200 dark:border-[#333]";
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
            });
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-US", { 
                year: "numeric", 
                month: "short", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateString;
        }
    };

    const hasActiveFilters = Object.values(filters).some(val => val !== "");

    return (
        <div className="space-y-8 font-sans transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl p-8 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <FiBriefcase size={120} className="text-[#D4AF37]" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 relative z-10">
                    <div>
                        <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Case Governance</span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">
                            Global Case Ledger
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {pagination.total} total cases
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                                showFilters || hasActiveFilters
                                    ? "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                    : "bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222]"
                            }`}
                        >
                            <FiFilter className="w-4 h-4" />
                            Filters {hasActiveFilters && `(${Object.values(filters).filter(f => f !== "").length})`}
                        </button>
                        <button
                            onClick={fetchCases}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222] disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-6">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by case number, title, applicant, or victim name..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl pl-12 pr-4 py-3 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-700 transition-colors"
                    />
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl p-6 mb-6 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">Advanced Filters</h3>
                            <button
                                onClick={clearFilters}
                                className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                            >
                                <FiX className="w-3 h-3" />
                                Clear All
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="MATCHED">Matched</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>

                            {/* Case Type Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Case Type</label>
                                <select
                                    value={filters.caseType}
                                    onChange={(e) => handleFilterChange("caseType", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                >
                                    <option value="">All Types</option>
                                    <option value="Criminal">Criminal</option>
                                    <option value="Civil">Civil</option>
                                    <option value="Family">Family</option>
                                    <option value="Property">Property</option>
                                    <option value="Employment">Employment</option>
                                    <option value="Consumer">Consumer</option>
                                </select>
                            </div>

                            {/* Specialization Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Specialization</label>
                                <select
                                    value={filters.specialization}
                                    onChange={(e) => handleFilterChange("specialization", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                >
                                    <option value="">All Specializations</option>
                                    <option value="Criminal">Criminal</option>
                                    <option value="Civil">Civil</option>
                                    <option value="Family">Family</option>
                                    <option value="Property">Property</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Constitutional">Constitutional</option>
                                    <option value="Employment">Employment</option>
                                </select>
                            </div>

                            {/* Urgency Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Urgency</label>
                                <select
                                    value={filters.urgency}
                                    onChange={(e) => handleFilterChange("urgency", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                >
                                    <option value="">All Urgency Levels</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>

                            {/* Start Date Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                />
                            </div>

                            {/* End Date Filter */}
                            <div>
                                <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:border-[#D4AF37] outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Cases List */}
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading cases...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 dark:bg-[#111] rounded-2xl border border-dashed border-gray-200 dark:border-[#333] transition-colors">
                        <FiBriefcase className="w-12 h-12 text-gray-300 dark:text-gray-800 mx-auto mb-4 opacity-30 transition-colors" />
                        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                            {hasActiveFilters ? "No cases match your filters" : "No cases found in the central archive"}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {cases.map((c) => (
                                <div
                                    key={c.id}
                                    className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-6 hover:border-[#D4AF37]/50 hover:shadow-2xl transition-all duration-500 group relative transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3 flex-wrap">
                                                <span className="text-[10px] font-black font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
                                                    {c.caseNumber || `CASE-${c.id}`}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${getStatusStyle(c.status)}`}>
                                                    {c.status || "DRAFT"}
                                                </span>
                                                {c.urgency && (
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getUrgencyStyle(c.urgency)}`}>
                                                        {c.urgency}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight mb-2 group-hover:text-[#D4AF37] transition-colors">
                                                {c.caseTitle || "Untitled Case"}
                                            </h3>

                                            <div className="flex flex-wrap gap-6 items-center">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                                                    <FiUser className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                    <span>Citizen: <span className="text-gray-900 dark:text-gray-300 transition-colors">{c.citizenName || c.applicantName || "N/A"}</span></span>
                                                </div>
                                                {c.caseType && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                                                        <FiFileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                        <span>Type: <span className="text-gray-900 dark:text-gray-300 transition-colors">{c.caseType}</span></span>
                                                    </div>
                                                )}
                                                {c.specialization && (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                                                        <FiAward className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                        <span>Specialization: <span className="text-gray-900 dark:text-gray-300 transition-colors">{c.specialization}</span></span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">
                                                    <FiCalendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                                                    <span>Created: <span className="text-gray-900 dark:text-gray-300 transition-colors">{formatDate(c.createdAt)}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleViewDetails(c)}
                                            className="w-full md:w-auto p-4 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333] text-[#D4AF37] rounded-xl hover:bg-[#D4AF37] hover:text-white dark:hover:text-black transition-all shadow-xl group/btn transition-colors"
                                            title="View Details"
                                        >
                                            <FiEye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-[#333]">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {pagination.page * pagination.size + 1} to {Math.min((pagination.page + 1) * pagination.size, pagination.total)} of {pagination.total} cases
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
                                        disabled={pagination.page === 0}
                                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                        Page {pagination.page + 1} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages - 1, prev.page + 1) }))}
                                        disabled={pagination.page >= pagination.totalPages - 1}
                                        className="px-4 py-2 rounded-xl font-bold text-sm transition-all bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Case Details Modal */}
            {showDetails && selectedCase && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333] p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-serif">
                                    Case Details: {selectedCase.caseNumber || `CASE-${selectedCase.id}`}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCase.caseTitle || "Untitled Case"}</p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-xl transition-colors"
                            >
                                <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status and Urgency */}
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border shadow-lg ${getStatusStyle(selectedCase.status)}`}>
                                    {selectedCase.status || "DRAFT"}
                                </span>
                                {selectedCase.urgency && (
                                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${getUrgencyStyle(selectedCase.urgency)}`}>
                                        {selectedCase.urgency}
                                    </span>
                                )}
                            </div>

                            {/* Case Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Case Type</label>
                                    <p className="text-gray-900 dark:text-white">{selectedCase.caseType || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Specialization</label>
                                    <p className="text-gray-900 dark:text-white">{selectedCase.specialization || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Applicant Name</label>
                                    <p className="text-gray-900 dark:text-white">{selectedCase.applicantName || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Victim Name</label>
                                    <p className="text-gray-900 dark:text-white">{selectedCase.victimName || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Incident Date</label>
                                    <p className="text-gray-900 dark:text-white">{formatDate(selectedCase.incidentDate) || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Incident Place</label>
                                    <p className="text-gray-900 dark:text-white">{selectedCase.incidentPlace || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Created At</label>
                                    <p className="text-gray-900 dark:text-white">{formatDateTime(selectedCase.createdAt) || "N/A"}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 block">Last Updated</label>
                                    <p className="text-gray-900 dark:text-white">{formatDateTime(selectedCase.updatedAt) || "N/A"}</p>
                                </div>
                            </div>

                            {/* Citizen Information */}
                            {selectedCase.citizenName && (
                                <div className="bg-gray-50 dark:bg-[#111] rounded-xl p-4 border border-gray-200 dark:border-[#333]">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-widest">Citizen Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1 block">Name</label>
                                            <p className="text-gray-900 dark:text-white">{selectedCase.citizenName}</p>
                                        </div>
                                        {selectedCase.citizenEmail && (
                                            <div>
                                                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1 block">Email</label>
                                                <p className="text-gray-900 dark:text-white">{selectedCase.citizenEmail}</p>
                                            </div>
                                        )}
                                        {selectedCase.citizenMobile && (
                                            <div>
                                                <label className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-1 block">Mobile</label>
                                                <p className="text-gray-900 dark:text-white">{selectedCase.citizenMobile}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
