import React, { useState, useEffect } from "react";
import axios from "axios";

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Users");
    const [actionFilter, setActionFilter] = useState("All Actions");

    useEffect(() => {
        fetchLogs();
    }, [startDate, endDate, roleFilter, actionFilter, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [roleFilter, actionFilter, startDate, endDate]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");

            const response = await axios.get("http://localhost:8080/api/audit-logs", {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: currentPage,
                    size: pageSize,
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            });

            setTotalPages(response.data.totalPages);
            setTotalElements(response.data.totalElements);

            let data = response.data.content || [];

            // Client-side filtering
            if (roleFilter !== "All Users") {
                data = data.filter(log => log.userRole === roleFilter);
            }
            if (actionFilter !== "All Actions") {
                if (actionFilter === "Cases") {
                    data = data.filter(log => {
                        const action = (log.action || "").toLowerCase();
                        return action.includes("submitted case");
                    });
                } else if (actionFilter === "Account") {
                    data = data.filter(log => {
                        const action = (log.action || "").toLowerCase();
                        return action.includes("created account") ||
                            action.includes("approved") ||
                            (action.includes("rejected") && !action.includes("appointment")) ||
                            action.includes("updated profile");
                    });
                } else if (actionFilter === "Appointments") {
                    data = data.filter(log => {
                        const action = (log.action || "").toLowerCase();
                        // module is usually uppercase, action can be mixed
                        return log.module === "APPOINTMENT" || action.includes("appointment");
                    });
                }
            }

            setLogs(data);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    const handleExportCSV = () => {
        const headers = ["Date & Time", "User Email", "Role", "Action", "Module", "Details"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                new Date(log.timestamp).toLocaleString(),
                log.userEmail,
                log.userRole,
                log.action,
                log.module,
                `"${log.details.replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Format: audit_logs_YYYYMMDD.csv
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        a.download = `audit_logs_${dateStr}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header & Filters */}
            <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-200 dark:border-[#333] shadow-sm">
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    {/* Filters Group */}
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#333] px-2 py-1.5 rounded-lg">
                            <span className="text-gray-500 text-xs font-medium whitespace-nowrap">Date Range</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs outline-none text-gray-700 dark:text-gray-300 w-24"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="bg-transparent text-xs outline-none text-gray-700 dark:text-gray-300 w-24"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <select
                            className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#333] px-3 py-1.5 rounded-lg text-xs outline-none text-gray-700 dark:text-gray-300"
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                        >
                            <option>All Users</option>
                            <option value="ADMIN">Admin</option>
                            <option value="LAWYER">Lawyer</option>
                            <option value="NGO">NGO</option>
                            <option value="CITIZEN">Citizen</option>
                        </select>

                        {/* Action Filter */}
                        <select
                            className="bg-gray-50 dark:bg-[#0f0f0f] border border-gray-200 dark:border-[#333] px-3 py-1.5 rounded-lg text-xs outline-none text-gray-700 dark:text-gray-300"
                            value={actionFilter}
                            onChange={e => setActionFilter(e.target.value)}
                        >
                            <option>All Actions</option>
                            <option value="Cases">Cases</option>
                            <option value="Account">Account</option>
                            <option value="Appointments">Appointments</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-1.5 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-blue-500/10 whitespace-nowrap"
                    >
                        <span>Export CSV</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#333] text-gray-500 font-semibold">
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Module</th>
                                <th className="px-6 py-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#222]">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No logs found.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                            {formatDate(log.timestamp)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">
                                            {log.userEmail}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${log.action.includes('Delete') ? 'bg-red-100 text-red-800' :
                                                    log.action.includes('Approve') ? 'bg-green-100 text-green-800' :
                                                        log.action.includes('Reject') ? 'bg-orange-100 text-orange-800' :
                                                            'bg-blue-100 text-blue-800'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{log.module}</td>
                                        <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{log.details}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-gray-200 dark:border-[#333] flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-[#0f0f0f] gap-4">
                    <span className="text-xs text-gray-500">
                        Showing {logs.length} of {totalElements} logs (Page {currentPage + 1} of {totalPages})
                    </span>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0 || loading}
                            className="px-3 py-1 text-xs font-bold rounded bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        <div className="flex gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                // Simple logic to show first 5 pages or context around current
                                // For simplicity/robustness, just showing first 5 or simpler logic
                                // Let's just show simple Previous | Page X | Next
                                return null;
                            })}
                            <span className="text-xs font-mono bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333] px-3 py-1 rounded">
                                {currentPage + 1}
                            </span>
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1 || loading}
                            className="px-3 py-1 text-xs font-bold rounded bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="bg-[#0f172a] p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">Audit Log Details</h3>
                            <button onClick={() => setSelectedLog(null)} className="hover:bg-white/10 p-1 rounded transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between border-b border-gray-100 dark:border-[#333] pb-2">
                                <span className="text-gray-500 text-sm font-semibold">User:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedLog.userEmail}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-[#333] pb-2">
                                <span className="text-gray-500 text-sm font-semibold">Role:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedLog.userRole}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-[#333] pb-2">
                                <span className="text-gray-500 text-sm font-semibold">Action:</span>
                                <span className="text-[#D4AF37] font-bold">{selectedLog.action}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 dark:border-[#333] pb-2">
                                <span className="text-gray-500 text-sm font-semibold">Module:</span>
                                <span className="text-gray-900 dark:text-white font-medium">{selectedLog.module}</span>
                            </div>
                            <div className="space-y-1 border-b border-gray-100 dark:border-[#333] pb-2">
                                <span className="text-gray-500 text-sm font-semibold block">Details:</span>
                                <div className="bg-gray-50 dark:bg-[#0f0f0f] p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono break-all">
                                    {selectedLog.details}
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm font-semibold">Date & Time:</span>
                                <span className="text-gray-900 dark:text-white font-medium text-sm">{formatDate(selectedLog.timestamp)}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-[#0f0f0f] flex justify-end gap-2 border-t border-gray-200 dark:border-[#333]">
                            <button onClick={() => setSelectedLog(null)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase hover:bg-gray-200 dark:hover:bg-[#252525] rounded transition-colors">Close</button>
                            <button onClick={() => setSelectedLog(null)} className="px-6 py-2 bg-[#D4AF37] hover:bg-[#c4a030] text-white font-bold text-xs uppercase rounded shadow-lg transition-all">OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
