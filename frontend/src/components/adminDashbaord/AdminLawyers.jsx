import React, { useState, useEffect } from "react";
import { FiSearch, FiUser, FiMapPin, FiBriefcase, FiCheck, FiShield, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import axios from "axios";

export default function AdminLawyers() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);

  useEffect(() => {
    fetchLawyers();
  }, [page]);

  const fetchLawyers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/lawyers", {
        params: { page, size: pageSize }
      });
      if (response.data.content) {
        setLawyers(response.data.content);
        setTotalPages(response.data.totalPages);
      } else {
        setLawyers(response.data);
      }
    } catch (error) {
      console.error("Error fetching lawyers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/lawyers/${id}/approve`);
      setLawyers(lawyers.map(l => l.id === id ? { ...l, isApproved: true, adminStatus: "APPROVED" } : l));
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to reject this lawyer application?")) return;
      await axios.put(`http://localhost:8080/api/lawyers/${id}/reject`);
      alert("Lawyer application rejected.");
      setLawyers(lawyers.map(l => l.id === id ? { ...l, isApproved: false, adminStatus: "REJECTED" } : l));
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Failed to reject lawyer.");
    }
  };

  const filteredLawyers = lawyers.filter(
    (l) =>
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans transition-colors duration-300">
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl shadow-2xl p-8 relative overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Provider Governance</span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Lawyer Registry</h2>
          </div>
          <div className="relative group w-full md:w-96">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors" />
            <input
              type="text"
              placeholder="Search authenticated providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl pl-12 pr-4 py-3 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all placeholder-gray-400 dark:placeholder-gray-700 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">Retrieving Records...</p>
          </div>
        ) : filteredLawyers.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 dark:bg-[#111] rounded-2xl border border-dashed border-gray-200 dark:border-[#333] transition-colors">
            <FiUser className="w-12 h-12 text-gray-300 dark:text-gray-800 mx-auto mb-4 opacity-30 transition-colors" />
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] transition-colors">No matches found in the legal vault</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-6 hover:border-[#D4AF37]/50 hover:shadow-2xl transition-all duration-500 group relative"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center text-[#D4AF37] text-xl font-bold group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                    {lawyer.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-lg mb-1 truncate group-hover:text-[#D4AF37] transition-colors">{lawyer.fullName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate transition-colors">{lawyer.email}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">
                    <FiBriefcase className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{lawyer.specialization}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">
                    <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{`${lawyer.city}, ${lawyer.state}`}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-[#222] transition-colors">
                  <div className="flex gap-2">
                    {lawyer.verificationStatus && (
                      <span className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-green-200 dark:border-green-900/50 shadow-lg transition-colors">
                        Verified
                      </span>
                    )}
                    {lawyer.isApproved || lawyer.adminStatus === "APPROVED" ? (
                      <span className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-200 dark:border-blue-900/50 shadow-lg transition-colors">
                        Approved
                      </span>
                    ) : lawyer.adminStatus === "REJECTED" ? (
                      <span className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-red-200 dark:border-red-900/50 shadow-lg transition-colors">
                        Rejected
                      </span>
                    ) : (
                      <span className="bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-orange-200 dark:border-orange-900/50 shadow-lg transition-colors">
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLawyer(lawyer)}
                      className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg transition-all"
                    >
                      Details
                    </button>
                    {!lawyer.isApproved && lawyer.adminStatus !== "REJECTED" && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(lawyer.id)}
                          className="text-[9px] font-black uppercase tracking-widest bg-[#D4AF37] text-black px-4 py-1.5 rounded-lg hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/10 w-full"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(lawyer.id)}
                          className="text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all w-full"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-8 mt-12 pt-8 border-t border-gray-100 dark:border-[#222] transition-colors">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="p-3 border border-gray-200 dark:border-[#333] rounded-xl disabled:opacity-20 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all shadow-xl transition-colors"
            >
              <FiChevronLeft size={20} />
            </button>

            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] transition-colors">
              Cycle <span className="text-gray-900 dark:text-white transition-colors">{page + 1}</span> / {totalPages}
            </span>

            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="p-3 border border-gray-200 dark:border-[#333] rounded-xl disabled:opacity-20 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all shadow-xl transition-colors"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedLawyer && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 transition-colors">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-3xl shadow-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative transition-colors">
            <button
              onClick={() => setSelectedLawyer(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white dark:hover:text-black transition-all"
            >
              <FiX size={20} />
            </button>

            <div className="p-10 sm:p-14 space-y-12">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#D4AF37] text-black rounded-3xl flex items-center justify-center text-3xl font-bold shadow-2xl shadow-[#D4AF37]/20">
                  {selectedLawyer.fullName?.charAt(0)}
                </div>
                <div>
                  <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Dossier File</span>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">{selectedLawyer.fullName}</h2>
                  <p className="text-gray-600 dark:text-gray-500 text-sm mt-1 transition-colors">{selectedLawyer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222] p-6 rounded-2xl relative overflow-hidden group transition-colors">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FiBriefcase size={80} className="text-[#D4AF37]" />
                  </div>
                  <h4 className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest mb-6">Professional Context</h4>
                  <div className="space-y-4">
                    <InfoRow label="Specialization" value={selectedLawyer.specialization} />
                    <InfoRow label="Experience" value={selectedLawyer.experienceYears ? `${selectedLawyer.experienceYears} Years` : "N/A"} />
                    <InfoRow label="Bar ID" value={selectedLawyer.barCouncilId} />
                    <InfoRow label="Bar State" value={selectedLawyer.barState} />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222] p-6 rounded-2xl relative overflow-hidden group transition-colors">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FiMapPin size={80} className="text-[#D4AF37]" />
                  </div>
                  <h4 className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest mb-6">Regional Coordinates</h4>
                  <div className="space-y-4">
                    <InfoRow label="City Hub" value={selectedLawyer.city} />
                    <InfoRow label="District" value={selectedLawyer.district} />
                    <InfoRow label="State" value={selectedLawyer.state} />
                    <div className="pt-2">
                      <span className="text-[9px] text-gray-400 dark:text-gray-600 block mb-1 font-bold uppercase tracking-widest transition-colors">Office Address</span>
                      <p className="text-sm text-gray-900 dark:text-white font-medium break-words leading-relaxed transition-colors">{selectedLawyer.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="footer-actions flex justify-end gap-4 pt-10 border-t border-gray-100 dark:border-[#222] transition-colors">
                <button
                  onClick={() => setSelectedLawyer(null)}
                  className="px-8 py-3 rounded-xl border border-gray-200 dark:border-[#333] text-gray-400 dark:text-gray-500 font-black uppercase text-[10px] tracking-widest hover:text-gray-900 dark:hover:text-white transition-all transition-colors"
                >
                  Dismiss
                </button>
                {!selectedLawyer.isApproved && (
                  <>
                    <button
                      onClick={() => {
                        handleReject(selectedLawyer.id);
                        setSelectedLawyer(null);
                      }}
                      className="px-8 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => {
                        handleApprove(selectedLawyer.id);
                        setSelectedLawyer(null);
                      }}
                      className="px-8 py-3 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#c5a059] transition-all shadow-2xl shadow-[#D4AF37]/20"
                    >
                      Commit Approval
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest border-b border-gray-100 dark:border-[#222] pb-2 last:border-0 transition-colors">
    <span className="text-gray-400 dark:text-gray-600 transition-colors">{label}</span>
    <span className="text-gray-900 dark:text-white transition-colors">{value || "Unverified"}</span>
  </div>
);
