import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchDraftCase,
  saveStepData,
  submitCaseData,
  startNewCaseAction,
  updateForm,
  setStep as setStepAction,
  setSaveStatus
} from "../../Redux/caseSlice";
import { FiFileText, FiCheck, FiX, FiCalendar } from "react-icons/fi";
import {
  INDIAN_STATES_AND_UT_ARRAY,
  STATES_OBJECT,
  STATE_WISE_CITIES,
} from "indian-states-cities-list";

/* ---------------- STEPS ---------------- */

const STEPS = [
  "Applicant",
  "Victim",
  "Case Details",
  "Incident",
  "Legal Preference",
  "Explanation",
  "Documents",
];
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile); // Indian mobile numbers
const isValidName = (name) => /^[A-Za-z ]+$/.test(name.trim());

export default function CaseFilingForm() {
  const dispatch = useDispatch();
  const { caseId, step, form, isLoading: loading, saveStatus, error } = useSelector((state) => state.case);

  const [victimNameError, setVictimNameError] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const handle = (k, v) => dispatch(updateForm({ [k]: v }));

  const stateOptions = INDIAN_STATES_AND_UT_ARRAY;

  const selectedStateObj = React.useMemo(() => {
    return STATES_OBJECT.find((s) => s.value === selectedState);
  }, [selectedState]);

  const districtOptions = React.useMemo(() => {
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

  const cityOptions = React.useMemo(() => {
    if (!selectedState || !selectedStateObj || !selectedDistrict) return [];
    const stateKey = selectedStateObj.name;
    const cities = STATE_WISE_CITIES[stateKey];
    if (!cities) return [];

    // Filter cities by selected district
    return cities
      .filter(c => c.district === selectedDistrict)
      .map(c => c.name || c.value)
      .sort();
  }, [selectedState, selectedStateObj, selectedDistrict]);

  // Update incidentPlace whenever state, district or city changes
  useEffect(() => {
    if (selectedState && selectedDistrict && selectedCity) {
      handle("incidentPlace", `${selectedCity}, ${selectedDistrict}, ${selectedState}`);
    } else if (selectedState && selectedDistrict) {
      handle("incidentPlace", `${selectedDistrict}, ${selectedState}`);
    } else if (selectedState) {
      handle("incidentPlace", selectedState);
    }
  }, [selectedState, selectedDistrict, selectedCity]);

  // Initialize state/district/city from form if available
  useEffect(() => {
    if (form.incidentPlace && !selectedState) {
      const parts = form.incidentPlace.split(", ");
      if (parts.length === 3) {
        setSelectedCity(parts[0]);
        setSelectedDistrict(parts[1]);
        setSelectedState(parts[2]);
      } else if (parts.length === 2) {
        setSelectedDistrict(parts[0]);
        setSelectedState(parts[1]);
      } else if (parts.length === 1) {
        setSelectedState(parts[0]);
      }
    }
  }, [form.incidentPlace]);

  // Load draft case on mount
  useEffect(() => {
    dispatch(fetchDraftCase());
  }, [dispatch]);

  // Clear save status after 2 seconds
  useEffect(() => {
    if (saveStatus === "Saved!" || saveStatus === "Submitted!") {
      const timer = setTimeout(() => dispatch(setSaveStatus("")), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, dispatch]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const requiredFields = {
    0: ["applicantName", "email", "mobile", "aadhaar"],
    1: ["victimName", "relation", "victimGender", "victimAge"],
    2: ["caseTitle", "caseType"],
    3: ["incidentDate", "incidentPlace", "urgency"],
    4: ["specialization", "courtType", "seekingNgoHelp"],
    5: ["background", "relief"],
    6: ["confirm"],
  };

  const getStepData = (stepNum) => {
    switch (stepNum) {
      case 0:
        return {
          applicantName: form.applicantName,
          email: form.email,
          mobile: form.mobile,
          aadhaar: form.aadhaar,
        };
      case 1:
        return {
          victimName: form.victimName,
          relation: form.relation,
          victimGender: form.victimGender,
          victimAge: form.victimAge,
        };
      case 2:
        return {
          caseTitle: form.caseTitle,
          caseType: form.caseType,
        };
      case 3:
        return {
          incidentDate: form.incidentDate,
          incidentPlace: form.incidentPlace,
          urgency: form.urgency,
        };
      case 4:
        return {
          specialization: form.specialization,
          courtType: form.courtType,
          seekingNgoHelp: form.seekingNgoHelp,
          ngoType: form.ngoType,
        };
      case 5:
        return {
          background: form.background,
          relief: form.relief,
        };
      case 6:
        return {};
      default:
        return {};
    }
  };

  const validateStep = () => {
    const fields = requiredFields[step] || [];

    // Basic required check
    for (let field of fields) {
      if (!form[field]) {
        toast.error("Please fill all required fields.");
        return false;
      }
    }

    // STEP 0: Email & Mobile validation
    if (step === 0) {
      if (!isValidName(form.applicantName)) {
        toast.error("Name should contain only letters and spaces.");
        return false;
      }
      if (!isValidEmail(form.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }

      if (!isValidMobile(form.mobile)) {
        toast.error("Please enter a valid 10-digit mobile number.");
        return false;
      }
      if (form.mobile.length !== 10) {
        toast.error("Your number should be 10-digits only.");
        return false;
      }

      if (form.aadhaar.length !== 12) {
        toast.error("Aadhaar number must be exactly 12 digits.");
        return false;
      }
    }

    // STEP 4: NGO conditional validation
    if (step === 4 && form.seekingNgoHelp === "Yes" && !form.ngoType) {
      toast.error("Please select type of NGO.");
      return false;
    }

    return true;
  };

  const next = async () => {
    if (!validateStep()) {
      return;
    }

    const stepData = getStepData(step);
    console.log("DEBUG: saving step", step, "data:", stepData, "caseId:", caseId);
    const result = await dispatch(saveStepData({ step, stepData, caseId }));

    if (saveStepData.fulfilled.match(result)) {
      toast.success("Step saved successfully!");
    }
  };

  const back = () => dispatch(setStepAction(step - 1));

  const handleSubmit = async () => {
    if (!form.confirm) {
      toast.error("Please confirm the information is correct.");
      return;
    }

    const result = await dispatch(submitCaseData({ caseId, documents: form.documents }));

    if (submitCaseData.fulfilled.match(result)) {
      if (result.payload.uploadErrors && result.payload.uploadErrors.length > 0) {
        toast.warn("Some files failed to upload: " + result.payload.uploadErrors.join(", "));
      }
      toast.success("Case submitted successfully!");
      // Dispatch event to trigger cases refetch and navigate to My Cases
      window.dispatchEvent(new CustomEvent('caseSubmitted'));
      window.dispatchEvent(new CustomEvent('navigateDashboard', { detail: { page: 'cases' } }));
    } else if (submitCaseData.rejected.match(result)) {
      toast.error(result.payload || "Failed to submit case. Please try again.");
    }
  };

  const handleStartNewCase = () => {
    dispatch(startNewCaseAction());
  };

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#0a0a0a] p-4 sm:p-10 font-sans transition-colors duration-300">
      {/* HEADER */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 sm:p-12 mb-10 relative overflow-hidden group transition-colors">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-all">
          <h2 className="text-9xl font-serif text-[#D4AF37] italic select-none">Justice</h2>
        </div>
        <div className="relative z-10">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">Case Registration Portal</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white font-serif mb-4 tracking-tight transition-colors">Add Your Case</h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg max-w-3xl leading-relaxed transition-colors">
            Share precise documentation to enable high-priority legal matching.
            Our professionals review cases based on complexity, location, and urgency.
          </p>
        </div>
        {saveStatus && (
          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <p className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">{saveStatus}</p>
          </div>
        )}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleStartNewCase}
            className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2 group/btn"
          >
            <FiFileText className="w-3 h-3 text-[#D4AF37] group-hover/btn:scale-110 transition-transform" /> Start New Case Record
          </button>
        </div>
      </div>

      {/* STEPPER */}
      <div className="flex flex-wrap justify-between gap-4 mb-12 max-w-6xl mx-auto px-4 overflow-x-auto pb-4 custom-scrollbar">
        {STEPS.map((s, i) => (
          <div key={i} className="flex flex-col items-center min-w-[80px] flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 font-bold text-sm ${i <= step
                ? "bg-[#D4AF37] border-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                : "border-gray-200 dark:border-[#333] text-gray-300 dark:text-gray-600 bg-transparent transition-colors"
                }`}
            >
              {i + 1}
            </div>
            <p className={`mt-3 text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${i <= step ? "text-[#D4AF37]" : "text-gray-400 dark:text-gray-600"}`}>{s}</p>
            {i < STEPS.length - 1 && (
              <div className={`h-[1px] w-full hidden md:block absolute top-5 -right-1/2 transition-colors ${i < step ? "bg-[#D4AF37]" : "bg-gray-200 dark:bg-[#333]"}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* FORM CARD */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] max-w-6xl mx-auto rounded-2xl shadow-2xl p-6 sm:p-12 relative transition-colors">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#D4AF37]"></div>

        {/* STEP 1 */}
        {step === 0 && (
          <Section title="Applicant Credentials">
            <div className="md:col-span-2 mb-6">
              <div className="bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#333] p-4 rounded-xl flex items-start gap-4 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed italic transition-colors">
                  Authentication protocol: Enter personal identification exactly as listed on official government documentation for successful verification.
                </p>
              </div>
            </div>

            <Input
              label="Full Name"
              required
              maxLength={50}
              value={form.applicantName}
              placeholder="As per Identity Proof"
              hint="Only alphabetical characters are permissible"
              onChange={(v) =>
                handle("applicantName", v.replace(/[^A-Za-z ]/g, ""))
              }
            />

            <Input
              label="Digital Address"
              type="email"
              required
              value={form.email}
              placeholder="verified.email@domain.com"
              hint="Primary channel for high-priority correspondence"
              onChange={(v) => handle("email", v)}
            />

            <Input
              label="Contact Number"
              type="tel"
              required
              maxLength={10}
              value={form.mobile}
              placeholder="Primary Mobile Number"
              hint="10-digit Indian standard (exclude +91)"
              onChange={(v) => handle("mobile", v)}
            />

            <Input
              label="Aadhaar ID"
              type="text"
              required
              value={form.aadhaar}
              placeholder="12-digit Unique Identification"
              hint="Encrypted for secure verification"
              maxLength={12}
              pattern="\d{12}"
              onChange={(v) =>
                handle("aadhaar", v.replace(/\D/g, "").slice(0, 12))
              }
            />
          </Section>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <Section title="Subject/Victim Data">
            <div className="md:col-span-2 mb-6">
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium italic border-l-2 border-[#D4AF37]/30 pl-4 transition-colors">
                Provide details of the individual requiring immediate legal intervention.
              </p>
            </div>

            <Input
              label="Subject Name"
              required
              value={form.victimName}
              placeholder="Full Name"
              hint={victimNameError || "Alphabetical characters only"}
              error={!!victimNameError}
              onChange={(v) => {
                if (/[^A-Za-z ]/.test(v)) {
                  setVictimNameError(
                    "Standard alphabet protocol required."
                  );
                } else {
                  setVictimNameError("");
                }
                handle("victimName", v.replace(/[^A-Za-z ]/g, ""));
              }}
            />

            <Select
              label="Legal Relationship"
              required
              value={form.relation}
              hint="Relationship of petitioner to the subject"
              options={[
                "Self", "Father", "Mother", "Son", "Daughter", "Husband", "Wife", "Brother", "Sister", "Grandfather", "Grandmother", "Legal Guardian", "Relative", "Friend", "Other",
              ]}
              onChange={(v) => handle("relation", v)}
            />

            <Select
              label="Biological Gender"
              required
              value={form.victimGender}
              hint="Official gender classification"
              options={["Male", "Female", "Other"]}
              onChange={(v) => handle("victimGender", v)}
            />

            <Input
              label="Certified Age"
              type="number"
              required
              value={form.victimAge}
              placeholder="Age in years"
              hint="Subject must be between 1-100"
              minLength={1}
              maxLength={3}
              onChange={(v) => handle("victimAge", v)}
            />
          </Section>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <Section title="Primary Case Metadata">
            <Input
              label="Case Designation"
              required
              value={form.caseTitle}
              placeholder="Short title for your matter"
              onChange={(v) => handle("caseTitle", v)}
            />
            <Select
              label="Jurisdiction Type"
              required
              value={form.caseType}
              options={["Civil", "Criminal", "Family", "Property", "Consumer"]}
              onChange={(v) => handle("caseType", v)}
            />
          </Section>
        )}

        {/* STEP 4 */}
        {step === 3 && (
          <Section title="Temporal & Spatial Data">
            <Input
              label="Date of Incident"
              type="date"
              required
              value={form.incidentDate}
              onChange={(v) => handle("incidentDate", v)}
              style={{ colorScheme: "dark" }}
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
            />
            <Select
              label="State of Incident"
              required
              value={selectedState}
              options={stateOptions}
              onChange={(v) => {
                setSelectedState(v);
                setSelectedDistrict("");
                setSelectedCity("");
              }}
            />
            <Select
              label="District of Incident"
              required
              value={selectedDistrict}
              options={districtOptions}
              disabled={!selectedState}
              onChange={(v) => {
                setSelectedDistrict(v);
                setSelectedCity("");
              }}
            />
            {cityOptions.length > 0 ? (
              <Select
                label="City of Incident"
                required
                value={selectedCity}
                options={cityOptions}
                disabled={!selectedDistrict}
                onChange={(v) => setSelectedCity(v)}
              />
            ) : (
              <Input
                label="City of Incident"
                required
                value={selectedCity}
                placeholder="Enter City / Town"
                onChange={(v) => setSelectedCity(v)}
              />
            )}
            <Select
              label="Urgency Protocol"
              required
              value={form.urgency}
              options={["Low", "Medium", "High"]}
              onChange={(v) => handle("urgency", v)}
            />
          </Section>
        )}

        {/* STEP 5 */}
        {step === 4 && (
          <Section title="Professional Requirement">
            <Select
              label="Required Specialization"
              required
              value={form.specialization}
              options={["Criminal", "Civil", "Family", "Property"]}
              onChange={(v) => handle("specialization", v)}
            />
            <Select
              label="Target Judicial Tiers"
              required
              value={form.courtType}
              options={["District Court", "High Court", "Supreme Court"]}
              onChange={(v) => handle("courtType", v)}
            />
            <Select
              label="Social Support (NGO)"
              required
              value={form.seekingNgoHelp}
              hint="Enable multidisciplinary support"
              options={["Yes", "No"]}
              onChange={(v) => handle("seekingNgoHelp", v)}
            />

            {form.seekingNgoHelp === "Yes" && (
              <Select
                label="Organization Pillar"
                required
                value={form.ngoType}
                options={[
                  "Legal Aid", "Women Rights", "Child Protection", "Senior Citizen Welfare", "Human Rights", "Education Support", "Child Rights", "Women Welfare", "Community Welfare", "Disaster Relief",
                ]}
                onChange={(v) => handle("ngoType", v)}
              />
            )}
          </Section>
        )}

        {/* STEP 6 */}
        {step === 5 && (
          <Section title="Case Narrative">
            <p className="md:col-span-2 mb-8 text-sm text-gray-400 dark:text-gray-500 leading-relaxed font-serif italic transition-colors">
              "Precision in narrative accelerates the intake process. Outline key events chronologically to assist our legal reviewers."
            </p>

            <div className="md:col-span-2">
              <Textarea
                label="Historical Background"
                required
                rows={4}
                value={form.background}
                placeholder="Detailed chronological sequence of events..."
                onChange={(v) => handle("background", v)}
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <Textarea
                label="Desired Outcome (Relief)"
                required
                rows={3}
                value={form.relief}
                placeholder="Specific relief sought (e.g., Mandatory Injunction, Pecuniary Damages, Bail)..."
                onChange={(v) => handle("relief", v)}
              />
            </div>
          </Section>
        )}

        {/* STEP 7 */}
        {step === 6 && (
          <Section title="Evidence & Affirmation">
            <div className="md:col-span-2 bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#333] p-8 rounded-2xl mb-8 transition-colors">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 dark:text-blue-400 transition-colors">
                  <FiFileText size={24} />
                </div>
                <div>
                  <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-tight uppercase tracking-widest transition-colors">Document Depository</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Digital Evidence Standards</p>
                </div>
              </div>

              <ul className="text-[11px] font-bold text-gray-400 dark:text-gray-500 grid grid-cols-2 gap-x-8 gap-y-2 mb-8 uppercase tracking-widest list-disc pl-5 transition-colors">
                <li>FIR DOCUMENTATION</li>
                <li>LEGAL NOTICES</li>
                <li>STATUTORY SUMMONS</li>
                <li>CONTRACTUAL AGREEMENTS</li>
                <li>MEDICAL EVIDENCE</li>
                <li>JUDICIAL ORDERS</li>
              </ul>

              <div className="relative group">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const files = [...e.target.files];
                    const maxSize = 2 * 1024 * 1024; // 2MB
                    const validFiles = [];
                    const errors = [];

                    files.forEach(file => {
                      if (file.type !== "application/pdf") {
                        errors.push(`${file.name}: Protocol requires PDF`);
                      } else if (file.size > maxSize) {
                        errors.push(`${file.name}: Exceeds 2MB threshold`);
                      } else if (form.documents.some(d => d.name === file.name && d.size === file.size)) {
                        errors.push(`${file.name}: Redundant entry`);
                      } else {
                        validFiles.push(file);
                      }
                    });

                    if (errors.length > 0) {
                      toast.error(errors[0]);
                    }

                    if (validFiles.length > 0) {
                      handle("documents", [...form.documents, ...validFiles]);
                    }
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-2xl cursor-pointer hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all group-active:scale-95 transition-colors"
                >
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-700 group-hover:text-[#D4AF37] transition-colors mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-1 transition-colors">Upload Dossier Items</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-[0.2em] transition-colors">MAX 2.0MB • PDF STANDARD ONLY</p>
                </label>
              </div>

              {form.documents.length > 0 && (
                <div className="mt-8 space-y-3">
                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-4">Ingested Assets:</p>
                  {form.documents.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-[#1a1a1a] p-4 rounded-xl border border-gray-100 dark:border-[#333] group hover:border-[#D4AF37]/50 transition-all transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <FiFileText className="text-[#D4AF37] shrink-0" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate lowercase tracking-wider transition-colors">{file.name}</span>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase transition-colors">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button
                        onClick={() => {
                          const newDocs = form.documents.filter((_, i) => i !== idx);
                          handle("documents", newDocs);
                        }}
                        className="text-gray-600 hover:text-red-500 transition-colors p-2"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 pt-4">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    required
                    className="sr-only peer"
                    checked={form.confirm}
                    onChange={(e) => handle("confirm", e.target.checked)}
                  />
                  <div className="w-5 h-5 border-2 border-gray-200 dark:border-[#333] rounded group-hover:border-[#D4AF37] transition-all peer-checked:bg-[#D4AF37] peer-checked:border-[#D4AF37]"></div>
                  <FiCheck size={12} className="absolute inset-0 m-auto text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none transition-colors">I solemnly affirm the veracity of the information provided herein.</span>
              </label>
            </div>
          </Section>
        )}

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-4 mt-12 sm:flex-row sm:justify-between items-center bg-gray-50 dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#333] transition-colors">
          {step > 0 && (
            <button
              onClick={back}
              className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 dark:border-[#333] rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 transition-all text-center transition-colors"
            >
              ← Previous Phase
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              disabled={loading}
              className="w-full sm:w-auto px-10 py-3.5 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase tracking-widest sm:ml-auto disabled:opacity-30 disabled:grayscale transition-all hover:bg-[#c5a059] shadow-xl shadow-[#D4AF37]/10 text-center"
            >
              {loading ? "Encrypting..." : "Commit & Proceed →"}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-10 py-3.5 bg-[#D4AF37] text-black rounded-xl text-xs font-bold uppercase tracking-widest sm:ml-auto disabled:opacity-30 disabled:grayscale transition-all hover:bg-[#c5a059] shadow-xl shadow-[#D4AF37]/10 text-center"
            >
              {loading ? "Transmitting..." : "Execute Case Submission"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI COMPONENTS ---------------- */

const Section = ({ title, children }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-8 tracking-tight transition-colors">{title}</h2>
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">{children}</div>
  </div>
);

const Input = ({
  label,
  type = "text",
  required,
  placeholder,
  hint,
  onChange,
  maxLength,
  pattern,
  value = "",
  ...props
}) => (
  <div className="group">
    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">
      {label} {required && <span className="opacity-50 text-red-500">*</span>}
    </label>

    <div className="relative">
      <input
        {...props}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:border-[#D4AF37] outline-none text-sm transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.05)] ${type === "date" ? "pr-10" : ""}`}
      />
      {type === "date" && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]/50 group-focus-within:text-[#D4AF37]">
          <FiCalendar size={18} />
        </div>
      )}
    </div>

    {hint && <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-400 transition-colors italic">{hint}</p>}
  </div>
);

const Select = ({ label, options, required, onChange, value = "", hint, disabled }) => (
  <div className="group">
    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">
      {label} {required && <span className="opacity-50 text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        required={required}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-[#D4AF37] outline-none text-sm cursor-pointer appearance-none transition-all transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" className="bg-white dark:bg-[#1a1a1a]">Select Configuration</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-white dark:bg-[#1a1a1a]">{o}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]/50 group-focus-within:text-[#D4AF37]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
    {hint && <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-400 transition-colors italic">{hint}</p>}
  </div>
);

const Textarea = ({ label, required, onChange, rows = 3, placeholder, value = "" }) => (
  <div className="group">
    <label className="block text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">
      {label} {required && <span className="opacity-50 text-red-500">*</span>}
    </label>

    <textarea
      required={required}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-700 focus:border-[#D4AF37] outline-none text-sm transition-all focus:shadow-[0_0_15px_rgba(212,175,55,0.05)] resize-none"
    />
  </div>
);
