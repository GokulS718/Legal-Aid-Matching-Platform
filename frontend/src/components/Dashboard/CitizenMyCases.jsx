import React, { useState, useEffect, useMemo } from "react";
import { getMyCases, updateCaseStatus, saveStep, uploadDocuments, getAssignedProviders, unassignCase, updateDocumentsVisibility } from "../../api/caseApi";
import { createSession } from "../../api/chatApi";
import { FiFileText, FiUser, FiAlertCircle, FiMapPin, FiCalendar, FiEye, FiX, FiClock, FiDownload, FiCheck, FiRefreshCw, FiMessageSquare, FiSearch, FiEdit2, FiUpload, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { useTheme } from "../../context/ThemeContext.jsx";
import {
  INDIAN_STATES_AND_UT_ARRAY,
  STATES_OBJECT,
  STATE_WISE_CITIES,
} from "indian-states-cities-list";

export default function CitizenMyCases({ onViewMatches, onMessageProvider }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [newDocuments, setNewDocuments] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelData, setCancelData] = useState(null);

  // Resolution Confirmation Modal State
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [caseToResolve, setCaseToResolve] = useState(null);

  const handleResolveClick = (caseItem) => {
    if (caseItem.status === "COMPLETED") {
      // Case is already resolved, do not allow toggling back
      return;
    } else {
      setCaseToResolve(caseItem);
      setShowResolveModal(true);
    }
  };

  const confirmResolve = async () => {
    if (!caseToResolve) return;
    try {
      await updateCaseStatus(caseToResolve.id, "COMPLETED");
      setCases(cases.map(c => c.id === caseToResolve.id ? { ...c, status: "COMPLETED" } : c));
      toast.success("Case successfully marked as resolved.");
      setShowResolveModal(false);
      setCaseToResolve(null);
    } catch (error) {
      console.error("Failed to resolve case:", error);
      toast.error("Failed to update case status.");
    }
  };

  // Download PDF from Cloudinary raw URL
  const downloadPdf = async (url, filename = "document.pdf") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Toggle case status between COMPLETED and PENDING
  const toggleCaseStatus = async (caseId, currentStatus) => {
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await updateCaseStatus(caseId, newStatus);
      setCases(cases.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const [assignedByCaseId, setAssignedByCaseId] = useState({});

  const fetchCases = async () => {
    try {
      const res = await getMyCases();
      console.log("DEBUG: CitizenMyCases.jsx - Fetched Cases:", res.data);
      setCases(res.data || []);
    } catch (err) {
      console.error("Error fetching cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    const handler = () => fetchCases();
    window.addEventListener("caseSubmitted", handler);
    return () => window.removeEventListener("caseSubmitted", handler);
  }, []);

  const fetchAssigned = async () => {
    const list = cases.filter((c) => c.isSubmitted);
    if (list.length === 0) {
      setAssignedByCaseId({});
      return;
    }
    const out = {};
    await Promise.all(
      list.map(async (c) => {
        try {
          const res = await getAssignedProviders(c.id);
          out[c.id] = res.data || [];
        } catch {
          out[c.id] = [];
        }
      })
    );
    setAssignedByCaseId(out);
  };

  useEffect(() => {
    fetchAssigned();
  }, [cases]);

  useEffect(() => {
    const handler = () => fetchAssigned();
    window.addEventListener("appointmentUpdated", handler);
    return () => window.removeEventListener("appointmentUpdated", handler);
  }, [cases]);

  const stateOptions = INDIAN_STATES_AND_UT_ARRAY;

  const selectedStateObj = useMemo(() => {
    return STATES_OBJECT.find((s) => s.value === selectedState);
  }, [selectedState]);

  const districtOptions = useMemo(() => {
    if (!selectedState || !selectedStateObj) return [];
    const stateKey = selectedStateObj.name;
    const districts = STATE_WISE_CITIES[stateKey];
    if (!districts) return [];
    const dists = new Set();
    if (Array.isArray(districts)) {
      districts.forEach(d => {
        if (d.district) dists.add(d.district);
        else if (d.value) dists.add(d.value);
      });
    }
    return Array.from(dists).sort();
  }, [selectedState, selectedStateObj]);

  const cityOptions = useMemo(() => {
    if (!selectedState || !selectedStateObj || !selectedDistrict) return [];
    const stateKey = selectedStateObj.name;
    const cities = STATE_WISE_CITIES[stateKey];
    if (!cities) return [];
    return cities
      .filter(c => c.district === selectedDistrict)
      .map(c => c.name || c.value)
      .sort();
  }, [selectedState, selectedStateObj, selectedDistrict]);

  // Update incidentPlace when location changes
  useEffect(() => {
    if (selectedState && selectedDistrict && selectedCity) {
      setEditForm(prev => ({ ...prev, incidentPlace: `${selectedCity}, ${selectedDistrict}, ${selectedState}` }));
    } else if (selectedState && selectedDistrict) {
      setEditForm(prev => ({ ...prev, incidentPlace: `${selectedDistrict}, ${selectedState}` }));
    } else if (selectedState) {
      setEditForm(prev => ({ ...prev, incidentPlace: selectedState }));
    }
  }, [selectedState, selectedDistrict, selectedCity]);

  const handleEditCase = (caseItem) => {
    setEditingCase(caseItem);

    // Parse incident place to extract state/district/city
    const incidentPlace = caseItem.incidentPlace || "";
    const parts = incidentPlace.split(", ");
    if (parts.length === 3) {
      setSelectedCity(parts[0]);
      setSelectedDistrict(parts[1]);
      setSelectedState(parts[2]);
    } else if (parts.length === 2) {
      setSelectedDistrict(parts[0]);
      setSelectedState(parts[1]);
      setSelectedCity("");
    } else if (parts.length === 1 && parts[0]) {
      setSelectedState(parts[0]);
      setSelectedDistrict("");
      setSelectedCity("");
    } else {
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedCity("");
    }

    setEditForm({
      caseTitle: caseItem.caseTitle || "",
      caseType: caseItem.caseType || "",
      victimName: caseItem.victimName || "",
      relation: caseItem.relation || "",
      victimGender: caseItem.victimGender || "",
      victimAge: caseItem.victimAge || "",
      incidentDate: caseItem.incidentDate || "",
      incidentPlace: caseItem.incidentPlace || "",
      urgency: caseItem.urgency || "Medium",
      specialization: caseItem.specialization || "",
      courtType: caseItem.courtType || "",
      seekingNgoHelp: caseItem.seekingNgoHelp || "No",
      ngoType: caseItem.ngoType || "",
      background: caseItem.background || "",
      relief: caseItem.relief || "",
    });
    setNewDocuments([]);
  };

  const handleUpdateCase = async () => {
    if (!editingCase) return;

    try {
      // Update case fields using saveStep API
      // We'll update step by step - Step 2 (Case Details), Step 1 (Victim), Step 3 (Incident), Step 4 (Legal Preference), Step 5 (Explanation)

      // Step 2: Case Details
      await saveStep(2, {
        caseTitle: editForm.caseTitle,
        caseType: editForm.caseType,
      }, editingCase.id);

      // Step 1: Victim Details
      await saveStep(1, {
        victimName: editForm.victimName,
        relation: editForm.relation,
        victimGender: editForm.victimGender,
        victimAge: editForm.victimAge,
      }, editingCase.id);

      // Step 3: Incident Details
      await saveStep(3, {
        incidentDate: editForm.incidentDate,
        incidentPlace: editForm.incidentPlace,
        urgency: editForm.urgency,
      }, editingCase.id);

      // Step 4: Legal Preference
      await saveStep(4, {
        specialization: editForm.specialization,
        courtType: editForm.courtType,
        seekingNgoHelp: editForm.seekingNgoHelp,
        ngoType: editForm.ngoType || null,
      }, editingCase.id);

      // Step 5: Explanation
      await saveStep(5, {
        background: editForm.background,
        relief: editForm.relief,
      }, editingCase.id);

      // Upload new documents if any
      if (newDocuments.length > 0) {
        setUploadingDocs(true);
        try {
          const uploadRes = await uploadDocuments(editingCase.id, newDocuments);
          if (uploadRes.data.errors && uploadRes.data.errors.length > 0) {
            toast.error("Some documents failed to upload");
          } else {
            toast.success("Documents uploaded successfully");
          }
        } catch (err) {
          toast.error("Failed to upload documents");
        } finally {
          setUploadingDocs(false);
        }
      }

      toast.success("Case updated successfully");

      // Refresh cases list
      const res = await getMyCases();
      setCases(res.data || []);

      setEditingCase(null);
      setEditForm({});
      setNewDocuments([]);
    } catch (err) {
      console.error("Error updating case:", err);
      toast.error("Failed to update case");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Validate file size (2MB max)
    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 2MB limit`);
        return false;
      }
      return true;
    });
    setNewDocuments([...newDocuments, ...validFiles]);
  };

  const removeDocument = (index) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
  };

  const getStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50";
      case "IN_PROGRESS":
      case "PENDING":
        return "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30";
      case "RESOLVED":
      case "COMPLETED":
        return "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "CLOSED":
        return "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-50 dark:bg-[#111] text-gray-400 dark:text-gray-600 border-gray-100 dark:border-[#222]";
    }
  };

  const getUrgencyStyles = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high":
        return "text-red-500 font-black";
      case "medium":
        return "text-orange-400 font-bold";
      case "low":
        return "text-green-500 font-medium";
      default:
        return "text-gray-500";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate and download case as PDF
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
            <h1>LEGAL AID CASE REPORT</h1>
            <div class="case-number">Case Number: ${caseItem.caseNumber || `CASE-${caseItem.id}`}</div>
            <div class="case-number">Generated: ${new Date().toLocaleString("en-IN")}</div>
          </div>

          <div class="section">
            <div class="section-title">Case Information</div>
            <div class="row"><span class="label">Case Title:</span><span class="value">${caseItem.caseTitle || "N/A"}</span></div>
            <div class="row"><span class="label">Case Type:</span><span class="value">${caseItem.caseType || "N/A"}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value"><span class="status-badge" style="background: ${caseItem.status === 'SUBMITTED' ? '#dbeafe' : caseItem.status === 'COMPLETED' ? '#dcfce7' : '#fef3c7'}; color: ${caseItem.status === 'SUBMITTED' ? '#1e40af' : caseItem.status === 'COMPLETED' ? '#166534' : '#92400e'};">${caseItem.status || "DRAFT"}</span></span></div>
            <div class="row"><span class="label">Urgency:</span><span class="value">${caseItem.urgency || "Medium"}</span></div>
            <div class="row"><span class="label">Specialization Required:</span><span class="value">${caseItem.specialization || "N/A"}</span></div>
            <div class="row"><span class="label">Court Type:</span><span class="value">${caseItem.courtType || "N/A"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Victim Information</div>
            <div class="row"><span class="label">Name:</span><span class="value">${caseItem.victimName || "N/A"}</span></div>
            <div class="row"><span class="label">Relation:</span><span class="value">${caseItem.relation || "N/A"}</span></div>
            <div class="row"><span class="label">Gender:</span><span class="value">${caseItem.victimGender || "N/A"}</span></div>
            <div class="row"><span class="label">Age:</span><span class="value">${caseItem.victimAge || "N/A"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Incident Details</div>
            <div class="row"><span class="label">Date:</span><span class="value">${formatDate(caseItem.incidentDate)}</span></div>
            <div class="row"><span class="label">Location:</span><span class="value">${caseItem.incidentPlace || "N/A"}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Applicant Information</div>
            <div class="row"><span class="label">Name:</span><span class="value">${caseItem.applicantName || "N/A"}</span></div>
            <div class="row"><span class="label">Email:</span><span class="value">${caseItem.email || "N/A"}</span></div>
            <div class="row"><span class="label">Mobile:</span><span class="value">${caseItem.mobile || "N/A"}</span></div>
          </div>

          ${caseItem.background ? `
          <div class="section">
            <div class="section-title">Case Background</div>
            <div class="text-block">${caseItem.background}</div>
          </div>
          ` : ''}

          ${caseItem.relief ? `
          <div class="section">
            <div class="section-title">Relief Sought</div>
            <div class="text-block">${caseItem.relief}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="row"><span class="label">Case Created:</span><span class="value">${formatDateTime(caseItem.createdAt)}</span></div>
            <div class="row"><span class="label">Last Updated:</span><span class="value">${formatDateTime(caseItem.updatedAt)}</span></div>
            <div style="text-align: center; margin-top: 20px; color: #999;">
              This is a system-generated document from Legal Aid Matching Platform
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent dark:bg-[#0a0a0a] p-6 flex flex-col items-center justify-center transition-colors">
        <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest transition-colors">Accessing Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#0a0a0a] p-4 sm:p-6 lg:p-10 font-sans transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 sm:p-12 mb-10 relative overflow-hidden group shadow-2xl transition-colors">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-all">
          <FiFileText size={120} className="text-[#D4AF37]" />
        </div>
        <div className="relative z-10">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">Case Management</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white font-serif mb-4 tracking-tight">Case Repository</h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-3xl leading-relaxed">
            A secure environment to monitor, audit, and manage your legal proceedings.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <div className="bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-xl px-6 py-3 flex items-center gap-3 shadow-inner transition-colors">
              <span className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest transition-colors">Active Archives</span>
              <span className="text-[#D4AF37] font-serif text-2xl font-bold leading-none">{cases.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cases Grid */}
      {cases.length === 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-20 text-center max-w-2xl mx-auto shadow-2xl transition-colors">
          <FiFileText className="w-20 h-20 text-gray-200 dark:text-gray-800 mx-auto mb-8 opacity-20 transition-colors" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif mb-3 tracking-tight transition-colors">Dossier Required</h3>
          <p className="text-gray-400 dark:text-gray-600 text-sm font-medium tracking-wide transition-colors">
            No active cases found in your encrypted repository.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {cases.map((c, index) => (
            <div
              key={c.id}
              className="group bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 shadow-xl transition-all duration-500 overflow-hidden transition-colors"
            >
              <div className="p-6 sm:p-8">
                {/* Top Row */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className="text-[10px] font-black bg-gray-50 dark:bg-[#252525] text-[#D4AF37] border border-[#D4AF37]/20 px-3 py-1.5 rounded uppercase tracking-[0.2em] shadow-inner transition-colors">
                    Record ID: {c.caseNumber || c.id}
                  </span>
                  <span className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.2em] ${getUrgencyStyles(c.urgency)}`}>
                    Urgency: {c.urgency || "STANDARD"}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg ${getStatusStyles(c.status)}`}>
                    {c.status || "Draft"}
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-gray-50 dark:bg-[#111] px-4 py-2 rounded-full border border-gray-100 dark:border-[#222] transition-colors">
                      <FiClock className="w-3 h-3 text-[#D4AF37]" />
                      Created: {formatDate(c.createdAt)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest bg-gray-50 dark:bg-[#111] px-4 py-2 rounded-full border border-gray-100 dark:border-[#222] transition-colors">
                      <FiCalendar className="w-3 h-3 text-[#D4AF37]" />
                      Updated: {formatDate(c.updatedAt)}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 dark:text-white font-serif text-xl sm:text-2xl mb-6 tracking-tight group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                  {c.caseTitle || "Unnamed Proceeding"}
                </h3>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] transition-colors">Subject</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold text-sm truncate uppercase tracking-widest transition-colors">{c.victimName || "Not Disclosed"}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] transition-colors">Classification</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold text-sm uppercase tracking-widest transition-colors">{c.caseType || "Pending"}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] transition-colors">Regional Hub</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold text-sm truncate uppercase tracking-widest transition-colors">{c.incidentPlace || "N/A"}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] transition-colors">Judicial Tier</span>
                    <span className="text-gray-700 dark:text-gray-300 font-bold text-sm uppercase tracking-widest transition-colors">{c.courtType || "District"}</span>
                  </div>
                </div>

                {/* Assigned counsel: name, profile, message + documents visibility toggle */}
                {(assignedByCaseId[c.id] || []).length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                    <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-3">Your assigned counsel</p>
                    <div className="space-y-3">
                      {(assignedByCaseId[c.id] || []).map((a) => (
                        <div key={a.matchId} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 dark:bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-lg shrink-0">
                            {(a.providerName || "P").charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.providerName || "Provider"}</p>
                            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider mt-0.5">{a.providerRole}</p>
                            {(a.specializationOrType || a.city || a.state) && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 flex-wrap">
                                {a.specializationOrType && <span>{a.specializationOrType}</span>}
                                {(a.city || a.state) && (
                                  <span className="flex items-center gap-1">
                                    {a.specializationOrType && " • "}
                                    <FiMapPin size={10} className="shrink-0" /> {[a.city, a.state].filter(Boolean).join(", ")}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await createSession(c.id, a.providerId, a.providerRole);
                                  const session = res.data;
                                  if (onMessageProvider) {
                                    onMessageProvider({
                                      type: a.providerRole.toLowerCase(),
                                      id: a.providerId,
                                      name: a.providerName,
                                      sessionId: session.id
                                    });
                                  }
                                } catch (err) {
                                  console.error(err);
                                  toast.error("Failed to start chat.");
                                }
                              }}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#D4AF37] text-black hover:bg-[#c5a059] transition-colors text-[10px] font-bold uppercase tracking-wider"
                              title="Send message"
                            >
                              <FiMessageSquare size={14} /> Message
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm("Cancel this counsel’s assignment for this case?")) return;
                                try {
                                  await unassignCase(c.id, { matchId: a.matchId });
                                  toast.success("Assignment cancelled.");
                                  setAssignedByCaseId((prev) => ({
                                    ...prev,
                                    [c.id]: (prev[c.id] || []).filter((x) => x.matchId !== a.matchId)
                                  }));
                                } catch (err) {
                                  toast.error("Failed to cancel.");
                                }
                              }}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                              title="Cancel assignment"
                            >
                              <FiX size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-3">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Show documents to counsel
                      </span>
                      <button
                        onClick={async () => {
                          const next = !(c.documentsSharedWithProviders !== false);
                          try {
                            await updateDocumentsVisibility(c.id, next);
                            setCases((prev) => prev.map((x) => (x.id === c.id ? { ...x, documentsSharedWithProviders: next } : x)));
                            toast.success(next ? "Documents visible to counsel." : "Documents hidden from counsel.");
                          } catch (err) {
                            toast.error("Failed to update.");
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#111] ${c.documentsSharedWithProviders !== false ? "bg-[#D4AF37]" : "bg-gray-300 dark:bg-gray-600"}`}
                        role="switch"
                        aria-checked={c.documentsSharedWithProviders !== false}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${c.documentsSharedWithProviders !== false ? "translate-x-5" : "translate-x-1"}`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Row */}
                <div className="flex flex-wrap items-center justify-between pt-6 border-t border-gray-100 dark:border-[#333] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] dark:shadow-[0_0_8px_rgba(255,255,255,0.2)] ${c.status?.toUpperCase() === "SUBMITTED" ? "bg-blue-500 animate-pulse" :
                      c.status?.toUpperCase() === "IN_PROGRESS" ? "bg-[#D4AF37] animate-pulse" :
                        c.status?.toUpperCase() === "RESOLVED" ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"
                      } transition-colors`}></div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] transition-colors">
                      {c.status?.toUpperCase() === "SUBMITTED" ? "Verification In-Progress" :
                        c.status?.toUpperCase() === "IN_PROGRESS" ? "Active Consultation" :
                          c.status?.toUpperCase() === "RESOLVED" ? "Case Finalized" : "Draft Status"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {c.documentsUrl && (
                      <button
                        onClick={() => downloadPdf(c.documentsUrl.split(",")[0], `case_${c.caseNumber || c.id}_document.pdf`)}
                        className="p-3 bg-[#252525] border border-[#333] text-[#D4AF37] rounded-xl hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] active:scale-95 transition-all cursor-pointer shadow-lg"
                        title="Download Dossier"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => alert(`Priority communication channel for case ${c.caseNumber || c.id}`)}
                      disabled={!c.isSubmitted}
                      className={`p-3 rounded-xl active:scale-95 transition-all shadow-lg ${c.isSubmitted
                        ? "text-blue-400 bg-blue-950/20 border border-blue-900/50 hover:bg-blue-900/40 cursor-pointer"
                        : "text-gray-600 bg-[#1a1a1a] border border-[#333] cursor-not-allowed grayscale opacity-30"
                        }`}
                      title="Direct Consultant Communication"
                    >
                      <FiMessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onViewMatches && onViewMatches(c)}
                      disabled={!c.isSubmitted}
                      className={`px-5 py-3 rounded-xl active:scale-95 transition-all flex items-center gap-3 shadow-lg ${c.isSubmitted
                        ? "text-white bg-indigo-950 border border-indigo-900 hover:bg-indigo-900 cursor-pointer"
                        : "text-gray-600 bg-[#1a1a1a] border border-[#333] cursor-not-allowed grayscale opacity-30"
                        }`}
                    >
                      <FiSearch className="w-4 h-4 text-[#D4AF37]" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Find Counsel</span>
                    </button>
                    <button
                      onClick={() => handleResolveClick(c)}
                      disabled={!c.isSubmitted || c.status === "COMPLETED"}
                      className={`px-5 py-3 rounded-xl active:scale-95 transition-all flex items-center gap-3 shadow-lg ${!c.isSubmitted
                          ? "text-gray-600 bg-[#1a1a1a] border border-[#333] cursor-not-allowed grayscale opacity-30"
                          : c.status === "COMPLETED"
                            ? "text-green-400 bg-green-950/50 border border-green-900 cursor-not-allowed opacity-80"
                            : "text-orange-400 bg-orange-950/20 border border-orange-900/50 hover:bg-orange-900/20 cursor-pointer"
                        }`}
                      title={c.status === "COMPLETED" ? "Case is permanently resolved" : "Mark this case as resolved"}
                    >
                      {c.status === "COMPLETED" ? <FiCheck className="w-4 h-4" /> : <FiRefreshCw className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{c.status === "COMPLETED" ? "Resolved" : "Mark Resolved"}</span>
                    </button>
                    <button
                      onClick={() => handleEditCase(c)}
                      className="px-6 py-3 text-white bg-blue-600 dark:bg-blue-700 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all cursor-pointer shadow-xl flex items-center gap-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit Case
                    </button>
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="px-6 py-3 text-black bg-[#D4AF37] rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#c5a059] active:scale-95 transition-all cursor-pointer shadow-xl shadow-[#D4AF37]/10 flex items-center gap-2"
                    >
                      <FiEye className="w-4 h-4" />
                      View Dossier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
          <div className={`w-full max-w-5xl rounded-2xl border shadow-3xl overflow-hidden max-h-[90vh] flex flex-col relative transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]"></div>

            {/* Modal Header */}
            <div className={`p-8 border-b flex justify-between items-center transition-colors ${isDark ? 'bg-[#111] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-inner transition-colors ${isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                  <FiFileText size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-1 block">Full Case Disclosure</span>
                  <h3 className={`text-3xl font-bold font-serif tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedCase.caseNumber || `RECORD #${selectedCase.id}`}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadCaseAsPDF(selectedCase)}
                  className={`px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${isDark ? 'bg-[#D4AF37] text-black hover:bg-[#c5a059]' : 'bg-[#D4AF37] text-black hover:bg-[#c5a059]'}`}
                >
                  <FiDownload className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className={`p-3 rounded-full transition-all group ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                >
                  <FiX className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className={`p-8 sm:p-12 overflow-y-auto flex-1 custom-scrollbar space-y-12 transition-colors ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
              {/* Status Header */}
              <div className="flex flex-wrap gap-4">
                <div className={`px-6 py-2 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-lg ${getStatusStyles(selectedCase.status)}`}>
                  Status: {selectedCase.status || "DRAFT ARCHIVE"}
                </div>
                <div className={`px-6 py-2 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-lg ${selectedCase.urgency?.toLowerCase() === 'high' ? 'bg-red-950/20 text-red-500 border-red-900/50' : isDark ? 'bg-[#1a1a1a] text-gray-400 border-[#333]' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                  Urgency: {selectedCase.urgency || "STANDARD"}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid md:grid-cols-2 gap-16">
                {/* Section 1 */}
                <div className="space-y-8">
                  <div className={`flex items-center gap-4 border-b pb-4 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <h4 className={`font-bold font-serif text-lg tracking-wide transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Case Framework</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Designation" value={selectedCase.caseTitle} />
                    <DetailRow label="Classification" value={selectedCase.caseType} />
                    <DetailRow label="Judicial Tier" value={selectedCase.courtType} />
                    <DetailRow label="Required Expertise" value={selectedCase.specialization} />
                  </div>
                </div>

                {/* Section 2 */}
                <div className="space-y-8">
                  <div className={`flex items-center gap-4 border-b pb-4 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <h4 className={`font-bold font-serif text-lg tracking-wide transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Subject Profile</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Legal Name" value={selectedCase.victimName} />
                    <DetailRow label="Relationship" value={selectedCase.relation} />
                    <DetailRow label="Gender Profile" value={selectedCase.victimGender} />
                    <DetailRow label="Validated Age" value={selectedCase.victimAge} />
                  </div>
                </div>

                {/* Section 3 */}
                <div className="space-y-8">
                  <div className={`flex items-center gap-4 border-b pb-4 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <h4 className={`font-bold font-serif text-lg tracking-wide transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Incident Log</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Temporal Data" value={formatDate(selectedCase.incidentDate)} />
                    <DetailRow label="Spatial Hub" value={selectedCase.incidentPlace} />
                  </div>
                </div>

                {/* Section 4 */}
                <div className="space-y-8">
                  <div className={`flex items-center gap-4 border-b pb-4 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                    <h4 className={`font-bold font-serif text-lg tracking-wide transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>Petitioner Credentials</h4>
                  </div>
                  <div className="space-y-4">
                    <DetailRow label="Authorized Name" value={selectedCase.applicantName} />
                    <DetailRow label="Digital ID" value={selectedCase.email} />
                    <DetailRow label="Verified Contact" value={selectedCase.mobile} />
                  </div>
                </div>
              </div>

              {/* Narrative Blocks */}
              <div className="space-y-8 pt-6">
                {selectedCase.background && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-[0.3em]">Analytical Background</h4>
                    <p className={`p-6 rounded-2xl border italic leading-relaxed text-sm font-medium transition-colors ${isDark ? 'text-gray-400 bg-[#111] border-[#222]' : 'text-gray-700 bg-gray-100 border-gray-200'}`}>
                      "{selectedCase.background}"
                    </p>
                  </div>
                )}

                {selectedCase.relief && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-[0.3em]">Sought Redress</h4>
                    <p className={`p-6 rounded-2xl border border-[#D4AF37]/20 leading-relaxed text-sm font-bold tracking-wide transition-colors ${isDark ? 'text-white bg-[#1a1a1a]' : 'text-gray-900 bg-white'}`}>
                      {selectedCase.relief}
                    </p>
                  </div>
                )}
              </div>

              {/* Secure Assets */}
              {selectedCase.documentsUrl && (
                <div className="space-y-6 pt-6">
                  <h4 className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-[0.3em]">Encrypted Assets</h4>
                  <div className="flex flex-wrap gap-4">
                    {selectedCase.documentsUrl.split(",").map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => downloadPdf(url.trim(), `case_${selectedCase.caseNumber || selectedCase.id}_document_${idx + 1}.pdf`)}
                        className={`inline-flex items-center gap-3 px-6 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest hover:border-[#D4AF37] transition-all shadow-xl ${isDark ? 'bg-[#252525] border-[#333] text-white hover:bg-[#D4AF37]/5' : 'bg-white border-gray-300 text-gray-900 hover:bg-[#D4AF37]/10'}`}
                      >
                        <FiDownload className="w-4 h-4 text-[#D4AF37]" />
                        Dossier Item {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Log */}
              <div className={`mt-12 pt-8 border-t flex flex-wrap items-center gap-10 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FiClock className="w-4 h-4 text-[#D4AF37]/50" />
                  <span>Petitioner Ingress: {formatDate(selectedCase.createdAt)}</span>
                </div>
                <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FiClock className="w-4 h-4 text-[#D4AF37]/50" />
                  <span>Administrative Sync: {formatDate(selectedCase.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`border-t p-8 flex justify-end transition-colors ${isDark ? 'border-[#333] bg-[#111]' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => setSelectedCase(null)}
                className={`px-10 py-3.5 border rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400 border-[#333] hover:text-white hover:bg-white/10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Exit Secure View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {editingCase && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-500">
          <div className={`w-full max-w-4xl rounded-2xl border shadow-3xl overflow-hidden max-h-[90vh] flex flex-col relative transition-colors ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-[#D4AF37]"></div>

            {/* Modal Header */}
            <div className={`p-8 border-b flex justify-between items-center transition-colors ${isDark ? 'bg-[#111] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-inner transition-colors ${isDark ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                  <FiEdit2 size={32} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] mb-1 block">Case Modification</span>
                  <h3 className={`text-3xl font-bold font-serif tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Edit {editingCase.caseNumber || `Case #${editingCase.id}`}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingCase(null);
                  setEditForm({});
                  setNewDocuments([]);
                  setSelectedState("");
                  setSelectedDistrict("");
                  setSelectedCity("");
                }}
                className={`p-3 rounded-full transition-all group ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <FiX className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Modal Body */}
            <div className={`p-8 sm:p-12 overflow-y-auto flex-1 custom-scrollbar space-y-8 transition-colors ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
              {/* Case Details */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Case Information</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Case Title</label>
                    <input
                      type="text"
                      value={editForm.caseTitle}
                      onChange={(e) => setEditForm({ ...editForm, caseTitle: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="Enter case title"
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Case Type</label>
                    <div className="relative">
                      <select
                        value={editForm.caseType}
                        onChange={(e) => setEditForm({ ...editForm, caseType: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select Case Type</option>
                        <option value="Civil">Civil</option>
                        <option value="Criminal">Criminal</option>
                        <option value="Family">Family</option>
                        <option value="Property">Property</option>
                        <option value="Consumer">Consumer</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Victim Details */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Victim Information</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Victim Name</label>
                    <input
                      type="text"
                      value={editForm.victimName}
                      onChange={(e) => setEditForm({ ...editForm, victimName: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Relation</label>
                    <div className="relative">
                      <select
                        value={editForm.relation}
                        onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select Relationship</option>
                        <option value="Self">Self</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Husband">Husband</option>
                        <option value="Wife">Wife</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Relative">Relative</option>
                        <option value="Friend">Friend</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gender</label>
                    <div className="relative">
                      <select
                        value={editForm.victimGender}
                        onChange={(e) => setEditForm({ ...editForm, victimGender: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Age</label>
                    <input
                      type="number"
                      value={editForm.victimAge}
                      onChange={(e) => setEditForm({ ...editForm, victimAge: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Incident Details</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Incident Date</label>
                    <input
                      type="date"
                      value={editForm.incidentDate}
                      onChange={(e) => setEditForm({ ...editForm, incidentDate: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>State of Incident</label>
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value);
                          setSelectedDistrict("");
                          setSelectedCity("");
                        }}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select State</option>
                        {stateOptions.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>District of Incident</label>
                    <div className="relative">
                      <select
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          setSelectedCity("");
                        }}
                        disabled={!selectedState}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select District</option>
                        {districtOptions.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {cityOptions.length > 0 ? (
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>City of Incident</label>
                      <div className="relative">
                        <select
                          value={selectedCity}
                          onChange={(e) => setSelectedCity(e.target.value)}
                          disabled={!selectedDistrict}
                          className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="">Select City</option>
                          {cityOptions.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>City of Incident</label>
                      <input
                        type="text"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedDistrict}
                        className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors disabled:opacity-50 ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="Enter City / Town"
                      />
                    </div>
                  )}
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Urgency</label>
                    <div className="relative">
                      <select
                        value={editForm.urgency}
                        onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Preference */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Legal Preference</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Specialization</label>
                    <div className="relative">
                      <select
                        value={editForm.specialization}
                        onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select Specialization</option>
                        <option value="Criminal">Criminal</option>
                        <option value="Civil">Civil</option>
                        <option value="Family">Family</option>
                        <option value="Property">Property</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Court Type</label>
                    <div className="relative">
                      <select
                        value={editForm.courtType}
                        onChange={(e) => setEditForm({ ...editForm, courtType: e.target.value })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="">Select Court Type</option>
                        <option value="District Court">District Court</option>
                        <option value="High Court">High Court</option>
                        <option value="Supreme Court">Supreme Court</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Social Support (NGO)</label>
                    <div className="relative">
                      <select
                        value={editForm.seekingNgoHelp}
                        onChange={(e) => setEditForm({ ...editForm, seekingNgoHelp: e.target.value, ngoType: e.target.value === "No" ? "" : editForm.ngoType })}
                        className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                      <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  {editForm.seekingNgoHelp === "Yes" && (
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>NGO Type</label>
                      <div className="relative">
                        <select
                          value={editForm.ngoType}
                          onChange={(e) => setEditForm({ ...editForm, ngoType: e.target.value })}
                          className={`w-full px-4 py-3 pr-10 border rounded-xl focus:border-[#D4AF37] focus:outline-none transition-colors appearance-none cursor-pointer ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        >
                          <option value="">Select NGO Type</option>
                          <option value="Legal Aid">Legal Aid</option>
                          <option value="Women Rights">Women Rights</option>
                          <option value="Child Protection">Child Protection</option>
                          <option value="Senior Citizen Welfare">Senior Citizen Welfare</option>
                          <option value="Human Rights">Human Rights</option>
                          <option value="Education Support">Education Support</option>
                          <option value="Child Rights">Child Rights</option>
                          <option value="Women Welfare">Women Welfare</option>
                          <option value="Community Welfare">Community Welfare</option>
                          <option value="Disaster Relief">Disaster Relief</option>
                        </select>
                        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Explanation */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Case Explanation</h4>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Background</label>
                  <textarea
                    value={editForm.background}
                    onChange={(e) => setEditForm({ ...editForm, background: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors resize-none ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Describe the background of the case..."
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Relief Sought</label>
                  <textarea
                    value={editForm.relief}
                    onChange={(e) => setEditForm({ ...editForm, relief: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none transition-colors resize-none ${isDark ? 'bg-[#111] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="Describe the relief sought..."
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <h4 className={`font-bold font-serif text-lg tracking-wide border-b pb-3 transition-colors ${isDark ? 'text-white border-[#333]' : 'text-gray-900 border-gray-200'}`}>Add Documents</h4>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Upload New Documents (PDF or Images, Max 2MB each)</label>
                  <div className="flex items-center gap-4">
                    <label className="px-6 py-3 bg-[#D4AF37] text-black rounded-xl font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-[#c5a059] transition-colors flex items-center gap-2">
                      <FiUpload className="w-4 h-4" />
                      Choose Files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {newDocuments.length > 0 && (
                      <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{newDocuments.length} file(s) selected</span>
                    )}
                  </div>
                  {newDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {newDocuments.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between px-4 py-2 border rounded-lg transition-colors ${isDark ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-300'}`}>
                          <span className={`text-sm truncate flex-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{file.name}</span>
                          <span className={`text-xs mx-4 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button
                            onClick={() => removeDocument(index)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className={`pt-6 border-t flex flex-wrap items-center gap-6 transition-colors ${isDark ? 'border-[#333]' : 'border-gray-200'}`}>
                <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FiClock className="w-4 h-4 text-[#D4AF37]/50" />
                  <span>Created: {formatDate(editingCase.createdAt)}</span>
                </div>
                <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FiClock className="w-4 h-4 text-[#D4AF37]/50" />
                  <span>Last Updated: {formatDate(editingCase.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`border-t p-8 flex justify-end gap-4 transition-colors ${isDark ? 'border-[#333] bg-[#111]' : 'border-gray-200 bg-gray-50'}`}>
              <button
                onClick={() => {
                  setEditingCase(null);
                  setEditForm({});
                  setNewDocuments([]);
                  setSelectedState("");
                  setSelectedDistrict("");
                  setSelectedCity("");
                }}
                className={`px-10 py-3.5 border rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all active:scale-95 ${isDark ? 'bg-white/5 text-gray-400 border-[#333] hover:text-white hover:bg-white/10' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCase}
                disabled={uploadingDocs}
                className="px-10 py-3.5 bg-[#D4AF37] text-black border border-[#D4AF37] rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#c5a059] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingDocs ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transform transition-all scale-100 ${isDark ? 'bg-[#1a1a1a] border-[#333]' : 'bg-white border-gray-200'}`}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-900/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-6 text-green-500">
                <FiCheck size={32} />
              </div>
              <h3 className={`text-2xl font-bold font-serif mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Resolving Case</h3>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to mark case <span className="font-mono font-bold text-[#D4AF37]">{caseToResolve?.caseNumber || caseToResolve?.id}</span> as resolved?
                <br /><br />
                This indicates that the legal proceedings have concluded or the issue has been addressed. The status will be updated for all assigned counsel.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-[#333] text-gray-300 hover:bg-[#444]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmResolve}
                  className="px-6 py-3 rounded-lg bg-green-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                >
                  <FiCheck /> Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Assignment Confirmation Dialog */}
      {showCancelDialog && cancelData && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-[#333] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-serif text-gray-900 dark:text-white">Cancel Assignment</h3>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelData(null);
                  setCancelReason("");
                }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222] rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Are you sure you want to cancel the assignment for <strong>{cancelData.providerName}</strong> ({cancelData.providerRole})?
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for canceling this assignment..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-colors resize-none"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (!cancelReason.trim()) {
                      toast.error("Please provide a reason for cancellation");
                      return;
                    }
                    try {
                      await unassignCase(cancelData.caseId, {
                        matchId: cancelData.matchId,
                        reason: cancelReason.trim()
                      });
                      toast.success("Assignment cancelled successfully.");
                      setAssignedByCaseId((prev) => ({
                        ...prev,
                        [cancelData.caseId]: (prev[cancelData.caseId] || []).filter((x) => x.matchId !== cancelData.matchId)
                      }));
                      setShowCancelDialog(false);
                      setCancelData(null);
                      setCancelReason("");
                    } catch (err) {
                      toast.error(err.response?.data || "Failed to cancel assignment.");
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Confirm Cancellation
                </button>
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelData(null);
                    setCancelReason("");
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-[#222] hover:bg-gray-300 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Detail Row Component ---------- */
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-[#222] group hover:border-[#D4AF37]/30 transition-all transition-colors text-right">
      <span className="text-gray-400 dark:text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] transition-colors">{label}</span>
      <span className="font-bold text-gray-900 dark:text-gray-300 text-sm tracking-wide group-hover:text-[#D4AF37] dark:group-hover:text-white transition-colors">{value || "DECLINED"}</span>
    </div>
  );
}
