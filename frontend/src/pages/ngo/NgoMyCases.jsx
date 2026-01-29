import React, { useEffect, useState } from "react";
import { getProviderMyCases } from "../../api/caseApi";
import { createSession } from "../../api/chatApi";
import { toast } from "sonner";
import { FiBriefcase, FiUser, FiCalendar, FiClock, FiFileText, FiMapPin, FiHash, FiActivity, FiMessageSquare } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext.jsx";

const NgoMyCases = ({ onMessageProvider }) => {
    const { theme } = useTheme();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("ACTIVE"); // Default to ACTIVE

    const filteredCases = cases.filter(c => {
        if (filter === "ALL") return true;
        if (filter === "RESOLVED") return c.status === "COMPLETED" || c.status === "RESOLVED";
        if (filter === "ACTIVE") return c.status !== "COMPLETED" && c.status !== "RESOLVED";
        return true;
    });

    const fetchMyCases = async () => {
        try {
            const response = await getProviderMyCases();
            setCases(response.data);
        } catch (err) {
            console.error("Error fetching NGO cases:", err);
            setError("Failed to load cases");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCases();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "SUBMITTED": return "text-blue-400 bg-blue-900/20 border-blue-900/50";
            case "IN_PROGRESS": return "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/30";
            case "COMPLETED": return "text-green-400 bg-green-900/20 border-green-900/50";
            default: return "text-gray-400 bg-gray-800 border-gray-700";
        }
    };

    const [selectedCase, setSelectedCase] = useState(null);

    // Download document from URL as a named file
    const downloadDocument = async (url, filename = "document") => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const type = blob.type;
            let extension = "pdf";
            if (type.includes("image/jpeg")) extension = "jpg";
            if (type.includes("image/png")) extension = "png";

            const blobUrl = window.URL.createObjectURL(new Blob([blob], { type }));
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${filename}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed:", error);
            window.open(url, '_blank');
        }
    };

    const handleMessage = async (caseItem) => {
        try {
            // Using caseItem.citizenId if avail, fallback to check caseItem.applicantId or just fail
            const targetId = caseItem.citizenId || caseItem.applicantId;
            if (!targetId) {
                toast.error("Beneficiary information missing for chat.");
                return;
            }

            const res = await createSession(caseItem.id, targetId, "CITIZEN");
            const session = res.data;
            if (session && session.id) {
                if (onMessageProvider) {
                    onMessageProvider({
                        sessionId: session.id,
                        id: targetId,
                        name: caseItem.applicantName,
                        type: 'CITIZEN'
                    });
                } else {
                    const event = new CustomEvent('navigateDashboard', {
                        detail: {
                            page: 'messages',
                            recipient: {
                                sessionId: session.id,
                                id: targetId,
                                name: caseItem.applicantName,
                                type: 'CITIZEN'
                            }
                        }
                    });
                    window.dispatchEvent(event);
                }
            } else {
                toast.error("Failed to create chat session.");
            }
        } catch (err) {
            console.error("Failed to start chat:", err);
            toast.error("Failed to start conversation.");
        }
    };

    const downloadCaseAsPDF = (caseItem) => {
        const printWindow = window.open('', '_blank');
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Case Report - ${caseItem.caseNumber || caseItem.id}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #D4AF37;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #D4AF37;
              margin: 0;
              font-size: 24px;
            }
            .header .case-number {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              background: #f5f5f5;
              padding: 10px;
              font-weight: bold;
              border-left: 4px solid #D4AF37;
              margin-bottom: 15px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
              width: 40%;
            }
            .value {
              width: 60%;
              text-align: right;
            }
            .text-block {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 5px;
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NGO CASE REPORT</h1>
            <div class="case-number">Case Number: ${caseItem.caseNumber || `CASE-${caseItem.id}`}</div>
            <div class="case-number">Generated: ${new Date().toLocaleString("en-IN")}</div>
          </div>

          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="row"><span class="label">Case Title:</span><span class="value">${caseItem.caseTitle || "N/A"}</span></div>
            <div class="row"><span class="label">Case Type:</span><span class="value">${caseItem.caseType || "N/A"}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value"><span class="status-badge" style="background: ${caseItem.status === 'SUBMITTED' ? '#dbeafe' : caseItem.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7'}; color: ${caseItem.status === 'SUBMITTED' ? '#1e40af' : caseItem.status === 'COMPLETED' ? '#166534' : '#92400e'};">${caseItem.status || "DRAFT"}</span></span></div>
          </div>

          <div class="section">
            <div class="section-title">Beneficiary Details</div>
            <div class="row"><span class="label">Name:</span><span class="value">${caseItem.applicantName || "N/A"}</span></div>
            <div class="row"><span class="label">Email:</span><span class="value">${caseItem.email || "N/A"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Incident Details</div>
            <div class="row"><span class="label">Date:</span><span class="value">${formatDate(caseItem.createdAt)}</span></div>
            <div class="row"><span class="label">Location:</span><span class="value">${caseItem.incidentPlace || "N/A"}</span></div>
          </div>

          ${caseItem.relief ? `
          <div class="section">
            <div class="section-title">Relief Sought</div>
            <div class="text-block">${caseItem.relief}</div>
          </div>
          ` : ''}

          ${caseItem.background ? `
          <div class="section">
            <div class="section-title">Case Background</div>
            <div class="text-block">${caseItem.background}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="row"><span class="label">Case Created:</span><span class="value">${formatDate(caseItem.createdAt)}</span></div>
            <div style="text-align: center; margin-top: 20px; color: #999;">
              This is a system-generated document from Legal Aid Matching Platform
            </div>
          </div>
        </body>
      </html>
    `;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-[#0a0a0a] min-h-screen text-center">
                <p className="text-red-500 bg-red-900/10 p-4 rounded-xl border border-red-900/30 inline-block">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] p-8 font-sans text-gray-300 relative">
            {/* Header */}
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Case Management</span>
                    <h1 className="text-3xl font-bold text-white font-serif tracking-tight">My Cases</h1>
                </div>

                <div className="flex gap-4">
                    {/* Filters */}
                    <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-[#333]">
                        {["ALL", "ACTIVE", "RESOLVED"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                                    ? "bg-[#D4AF37] text-black shadow-lg"
                                    : "text-gray-500 hover:text-white"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 bg-[#1a1a1a] px-5 py-2.5 rounded-full border border-[#333]">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total</span>
                        <span className="text-[#D4AF37] font-bold text-xl font-serif">{filteredCases.length}</span>
                    </div>
                </div>
            </div>

            {filteredCases.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] bg-[#1a1a1a] rounded-3xl border border-[#222]">
                    <FiBriefcase className="w-16 h-16 text-[#333] mb-6" />
                    <p className="text-gray-500 font-medium">No {filter !== "ALL" ? filter.toLowerCase() : ""} cases found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCases.map((c) => (
                        <div key={c.id} className="group bg-[#1a1a1a] rounded-2xl border border-[#222] hover:border-[#D4AF37]/50 transition-all duration-300 flex flex-col h-full hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]">

                            {/* Card Header */}
                            <div className="p-6 pb-4 border-b border-[#222] group-hover:border-[#333] transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${getStatusColor(c.status)}`}>
                                        {c.status || "Pending"}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-mono bg-[#111] px-2 py-1 rounded border border-[#222]">
                                        #{c.caseNumber || c.id}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white font-serif mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors pl-2 border-l-2 border-[#D4AF37]/50">
                                    {c.caseTitle || "Case Details"}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                                    <span className="flex items-center gap-1.5">
                                        <FiClock className="text-[#D4AF37]" /> {formatDate(c.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 flex-1 space-y-4">

                                {/* Applicant */}
                                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#111] border border-[#222]">
                                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333] text-[#D4AF37]">
                                        <FiUser />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Beneficiary</p>
                                        <p className="text-sm font-bold text-gray-200">{c.applicantName || "Anonymous"}</p>
                                        <p className="text-xs text-gray-600 mt-0.5">{c.email}</p>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-wider">Type</p>
                                        <p className="text-xs text-gray-300 font-medium truncate">{c.caseType || "General"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-wider">Requested Relief</p>
                                        <p className="text-xs text-gray-300 font-medium truncate">{c.relief ? "Specified" : "Unspecified"}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-wider">Incident Location</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-300">
                                            <FiMapPin className="text-gray-600" />
                                            {c.incidentPlace || "Location Undisclosed"}
                                        </div>
                                    </div>
                                </div>

                                {/* Description Preview */}
                                {c.background && (
                                    <div className="pt-2">
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-wider mb-2">Background</p>
                                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic">
                                            "{c.background}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Card Footer */}
                            <div className="p-4 border-t border-[#222] bg-[#151515] rounded-b-2xl flex gap-3">
                                <button
                                    onClick={() => setSelectedCase(c)}
                                    className="flex-1 py-3 rounded-lg bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#b5952f] transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center justify-center gap-2"
                                >
                                    <FiFileText size={14} />
                                    View Details
                                </button>

                                <button
                                    onClick={() => handleMessage(c)}
                                    className="px-4 py-3 rounded-lg bg-[#222] text-[#Dbeafe] border border-blue-900/30 hover:bg-blue-900/20 hover:text-white transition-all font-bold text-xs flex items-center justify-center"
                                    title="Message Beneficiary"
                                >
                                    <FiMessageSquare size={16} />
                                </button>

                                <button
                                    onClick={() => downloadCaseAsPDF(c)}
                                    className="px-4 py-3 rounded-lg bg-[#222] text-[#D4AF37] border border-[#333] hover:bg-[#333] hover:text-white transition-all font-bold text-xs flex items-center justify-center"
                                    title="Download PDF"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>

                                {c.documentsUrl && (
                                    <button
                                        onClick={() => downloadDocument(c.documentsUrl.split(',')[0], `case_${c.caseNumber || c.id}_doc`)}
                                        className="px-4 py-3 rounded-lg bg-[#222] text-gray-300 border border-[#333] hover:bg-[#333] hover:text-white transition-all font-bold text-xs"
                                        title="Download Submitted Documents"
                                    >
                                        <FiFileText size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Case Details Modal */}
            {selectedCase && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCase(null)}>
                    <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333] p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-serif">{selectedCase.caseTitle}</h2>
                                <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mt-1">Case #{selectedCase.caseNumber || selectedCase.id}</p>
                            </div>
                            <button
                                onClick={() => handleMessage(selectedCase)}
                                className="w-8 h-8 rounded-full bg-[#333] text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 flex items-center justify-center transition-colors mr-2"
                                title="Message Beneficiary"
                            >
                                <FiMessageSquare size={16} />
                            </button>
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="w-8 h-8 rounded-full bg-[#333] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Case Type</h4>
                                    <p className="text-white font-medium">{selectedCase.caseType}</p>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Status</h4>
                                    <span className={`inline-block px-3 py-1 rounded text-xs font-bold border ${getStatusColor(selectedCase.status)}`}>
                                        {selectedCase.status}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Beneficiary</h4>
                                    <p className="text-white font-medium">{selectedCase.applicantName}</p>
                                    <p className="text-gray-500 text-sm">{selectedCase.email}</p>
                                </div>
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Relief Sought</h4>
                                    <p className="text-white font-medium">{selectedCase.relief || "Unspecified"}</p>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-[#222]">
                                <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#333] pb-2">Full Case Background</h4>
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {selectedCase.background || "No additional background details provided."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Incident Location</h4>
                                    <p className="text-white">{selectedCase.incidentPlace}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#333] bg-[#151515] flex justify-end gap-3 sticky bottom-0 rounded-b-2xl">
                            <button
                                onClick={() => downloadCaseAsPDF(selectedCase)}
                                className="px-6 py-3 rounded-lg bg-[#D4AF37] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#b5952f] transition-all shadow-lg shadow-[#D4AF37]/10 flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NgoMyCases;
