import React, { useState } from "react";
import { FiCheck, FiX, FiUser, FiFileText, FiShield, FiAlertTriangle } from "react-icons/fi";

export default function AdminUserVerifications() {
  const [verifications] = useState([
    {
      id: 1,
      type: "Lawyer",
      name: "Adv. Ramesh Kumar",
      email: "ramesh@example.com",
      submittedAt: "2025-12-15",
      documents: ["Aadhar Proof", "Bar Certificate"],
    },
    {
      id: 2,
      type: "NGO",
      name: "Legal Aid Foundation",
      email: "contact@legalaid.org",
      submittedAt: "2025-12-14",
      documents: ["Registration Certificate"],
    },
  ]);

  const handleApprove = (id) => {
    console.log("Approve:", id);
  };

  const handleReject = (id) => {
    console.log("Reject:", id);
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
          <div>
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Identity Governance</span>
            <h2 className="text-3xl font-bold text-white font-serif tracking-tight">Pending Verifications</h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-400/10 px-4 py-2 rounded-full border border-orange-400/20">
            <FiAlertTriangle className="w-3.5 h-3.5" />
            {verifications.length} Awaiting Authorization
          </div>
        </div>

        {verifications.length === 0 ? (
          <div className="py-20 text-center bg-[#111] rounded-2xl border border-dashed border-[#333]">
            <FiShield className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-30" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Registry is currently synchronized and clear</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {verifications.map((item) => (
              <div
                key={item.id}
                className="bg-[#111] border border-[#222] rounded-2xl p-6 hover:border-[#D4AF37]/50 transition-all duration-500 group relative"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5 flex-1">
                    <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center text-[#D4AF37] text-2xl font-bold group-hover:bg-[#D4AF37] group-hover:text-black transition-all shadow-xl">
                      {item.name?.charAt(5) || item.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-bold text-white font-serif tracking-tight group-hover:text-[#D4AF37] transition-colors">{item.name}</h3>
                        <span className="px-3 py-1 bg-blue-950/30 text-blue-400 border border-blue-900/50 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">{item.email}</p>

                      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#222]">
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <FiFileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="text-gray-300">{item.documents.join(" • ")}</span>
                        </div>
                        <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-auto">
                          Dossier Submitted: {item.submittedAt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleReject(item.id)}
                      className="flex-1 md:flex-none p-4 bg-[#1a1a1a] border border-red-900/30 text-red-500 rounded-xl hover:bg-red-900 hover:text-white transition-all shadow-xl group/btn"
                      title="Decline Protocol"
                    >
                      <FiX className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="flex-1 md:flex-none p-4 bg-[#D4AF37] text-black rounded-xl hover:bg-[#c5a059] transition-all shadow-2xl shadow-[#D4AF37]/20 group/btn"
                      title="Authorize Identity"
                    >
                      <FiCheck className="w-5 h-5 group-hover/btn:scale-110 transition-transform font-bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
