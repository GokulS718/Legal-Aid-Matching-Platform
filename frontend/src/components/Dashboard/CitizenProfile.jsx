import React, { useRef, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../../Redux/authSlice.js";
import { updateProfile } from "../../api/auth.js";
import { toast } from "react-toastify";
import { FiUser, FiCamera, FiEdit3, FiSave, FiX, FiMail, FiPhone, FiMapPin, FiCalendar, FiLock, FiCheck, FiShield } from "react-icons/fi";
import {
  INDIAN_STATES_AND_UT_ARRAY,
  STATES_OBJECT,
  STATE_WISE_CITIES,
} from "indian-states-cities-list";

export default function CitizenProfile({
  profile,
  setProfile,
  isEditingProfile,
  setIsEditingProfile,
}) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollPositionRef = useRef(0);

  // State management for location dropdowns
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // State to track validation errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get auth state from Redux
  const { profile: reduxProfile, isLoading: isFetchingProfile, isAuthenticated } = useSelector((state) => state.auth);

  // Get all states
  const stateOptions = INDIAN_STATES_AND_UT_ARRAY.map((state) => ({
    label: state,
    value: state,
  }));

  // Find state object to get the key for STATE_WISE_CITIES
  const selectedStateObj = useMemo(() => {
    return STATES_OBJECT.find((state) => state.value === selectedState);
  }, [selectedState]);

  // Get districts based on selected state
  const districtOptions = useMemo(() => {
    if (!selectedState || !selectedStateObj) return [];

    const stateKey = selectedStateObj.name;
    const districts = STATE_WISE_CITIES[stateKey];

    if (!districts) return [];

    const districtsSet = new Set();
    if (Array.isArray(districts)) {
      districts.forEach((item) => {
        if (item.district) districtsSet.add(item.district);
        else if (item.value) districtsSet.add(item.value);
      });
    } else if (typeof districts === 'object') {
      Object.values(districts).forEach((cityList) => {
        if (Array.isArray(cityList)) {
          cityList.forEach((city) => {
            if (city.district) districtsSet.add(city.district);
            else if (city.name) districtsSet.add(city.name);
          });
        }
      });
    }

    return Array.from(districtsSet).sort().map((district) => ({
      label: district,
      value: district,
    }));
  }, [selectedState, selectedStateObj]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!reduxProfile.email && !reduxProfile.fullName) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated, reduxProfile]);

  useEffect(() => {
    if (reduxProfile && (reduxProfile.email || reduxProfile.fullName)) {
      setProfile({
        shortName: reduxProfile.shortName || reduxProfile.fullName || "",
        fullName: reduxProfile.fullName || "",
        role: reduxProfile.role || "CITIZEN",
        aadhaar: reduxProfile.aadhaar || "",
        email: reduxProfile.email || "",
        mobile: reduxProfile.mobile || "",
        dob: reduxProfile.dob || "",
        state: reduxProfile.state || "",
        district: reduxProfile.district || "",
        city: reduxProfile.city || "",
        address: reduxProfile.address || "",
        password: "",
        photo: null,
        photoUrl: reduxProfile.photoUrl || null,
      });
      if (reduxProfile.state) setSelectedState(reduxProfile.state);
      if (reduxProfile.district) setSelectedDistrict(reduxProfile.district);
    }
  }, [reduxProfile, setProfile]);

  const validateField = (field, value) => {
    if (!value && field !== 'password') return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    if (field === 'aadhaar' && !/^\d{12}$/.test(value)) return "Invalid Aadhaar (12 digits required)";
    if (field === 'mobile' && !/^\d{10}$/.test(value)) return "Invalid Mobile (10 digits required)";
    return "";
  };

  const handleProfileChange = (field, value) => {
    setProfile(p => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, profile[field]) }));
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      const response = await updateProfile(profile, profile.photo);
      toast.success("Identity verified and updated.");
      setIsEditingProfile(false);
      dispatch(fetchUserProfile());
    } catch (err) {
      toast.error("Protocol failure: Unable to sync data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen p-4 sm:p-10 font-sans transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
        <div>
          <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Citizen Personnel File</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Identity Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg mt-2 font-medium tracking-wide transition-colors">Manage your authenticated credentials and regional correspondence data.</p>
        </div>

        <div className="flex gap-4">
          {!isEditingProfile ? (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#D4AF37] px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-3 shadow-xl"
            >
              <FiEdit3 className="w-4 h-4" /> Edit Credentials
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="bg-transparent border border-gray-200 dark:border-[#333] text-gray-500 px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:text-[#D4AF37] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="bg-[#D4AF37] text-black px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#c5a059] transition-all flex items-center gap-3 shadow-xl shadow-[#D4AF37]/20"
              >
                {isLoading ? "Syncing..." : <><FiCheck className="w-4 h-4" /> Commit Changes</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Bio Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiUser size={100} className="text-[#D4AF37]" />
            </div>

            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gray-50 dark:bg-[#0a0a0a] border-2 border-[#D4AF37]/30 p-1 group-hover:border-[#D4AF37] transition-all overflow-hidden shadow-2xl">
                  {profile.photoUrl ? (
                    <img src={profile.photoUrl} alt="Subject" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-serif text-[#D4AF37] bg-white dark:bg-[#1a1a1a] transition-colors">
                      {profile.fullName?.charAt(0) || "C"}
                    </div>
                  )}
                </div>
                {isEditingProfile && (
                  <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#D4AF37] text-black rounded-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-xl">
                    <FiCamera size={18} />
                    <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setProfile(p => ({ ...p, photo: file, photoUrl: URL.createObjectURL(file) }));
                    }} />
                  </label>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight mb-1 transition-colors">{profile.fullName}</h3>
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] bg-[#D4AF37]/10 px-3 py-1 rounded-full mb-6">Validated Citizen</span>

              <div className="w-full space-y-3 pt-6 border-t border-gray-100 dark:border-[#333] transition-colors">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Records ID</span>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors">#CZ-{(profile.aadhaar || '0000').slice(-4)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  <span>Auth Channel</span>
                  <span className="text-gray-700 dark:text-gray-300 transition-colors">Biometric/OIDC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Fields */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 sm:p-12 shadow-2xl space-y-12 transition-colors">

            {/* Sector: Personal */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Biographical Data</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Legal Full Name"
                  value={profile.fullName}
                  disabled={!isEditingProfile}
                  icon={<FiUser />}
                  onChange={v => handleProfileChange("fullName", v)}
                  onBlur={() => handleBlur("fullName")}
                  error={errors.fullName}
                />
                <Input
                  label="Aadhaar ID"
                  value={profile.aadhaar}
                  disabled={!isEditingProfile}
                  icon={<FiShield />}
                  onChange={v => handleProfileChange("aadhaar", v.replace(/\D/g, ""))}
                  onBlur={() => handleBlur("aadhaar")}
                  error={errors.aadhaar}
                />
                <Input
                  label="Temporal Reference (DOB)"
                  type="date"
                  value={profile.dob}
                  disabled={!isEditingProfile}
                  icon={<FiCalendar />}
                  onChange={v => handleProfileChange("dob", v)}
                  onBlur={() => handleBlur("dob")}
                  error={errors.dob}
                />
                <Input
                  label="Digital Address (Read Only)"
                  value={profile.email}
                  disabled={true}
                  icon={<FiMail />}
                  hint="Encrypted Primary Identifier"
                />
              </div>
            </section>

            {/* Sector: Communication */}
            <section className="space-y-8 pt-8 border-t border-gray-100 dark:border-[#222] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Regional Hub & Contact</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Input
                  label="Contact Threshold"
                  value={profile.mobile}
                  disabled={!isEditingProfile}
                  icon={<FiPhone />}
                  onChange={v => handleProfileChange("mobile", v)}
                  onBlur={() => handleBlur("mobile")}
                  error={errors.mobile}
                />
                <Select
                  label="Jurisdiction: State"
                  value={profile.state}
                  options={stateOptions}
                  disabled={!isEditingProfile}
                  icon={<FiMapPin />}
                  onChange={v => {
                    setSelectedState(v);
                    handleProfileChange("state", v);
                    handleProfileChange("district", "");
                  }}
                />
                <Select
                  label="Administrative: District"
                  value={profile.district}
                  options={districtOptions}
                  disabled={!isEditingProfile}
                  icon={<FiMapPin />}
                  onChange={v => {
                    setSelectedDistrict(v);
                    handleProfileChange("district", v);
                  }}
                />
                <Input
                  label="Urban Hub (City)"
                  value={profile.city}
                  disabled={!isEditingProfile}
                  icon={<FiMapPin />}
                  onChange={v => handleProfileChange("city", v)}
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Physical Coordinates (Address)"
                    value={profile.address}
                    disabled={!isEditingProfile}
                    onChange={v => handleProfileChange("address", v)}
                    rows={3}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI HELPERS */

const Input = ({ label, value, icon, disabled, type = "text", onChange, onBlur, error, hint }) => (
  <div className="group">
    <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors">{icon}</div>
      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full bg-gray-50 dark:bg-[#111] border ${error ? 'border-red-500' : 'border-gray-200 dark:border-[#333]'} rounded-xl pl-12 pr-4 py-3.5 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all disabled:opacity-50 disabled:grayscale transition-colors`}
      />
    </div>
    {error ? <p className="mt-2 text-[9px] font-bold text-red-500 uppercase tracking-widest">{error}</p> : hint ? <p className="mt-2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">{hint}</p> : null}
  </div>
);

const Select = ({ label, value, options, icon, disabled, onChange }) => (
  <div className="group">
    <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors">{icon}</div>
      <select
        value={value || ""}
        disabled={disabled}
        onChange={e => onChange && onChange(e.target.value)}
        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl pl-12 pr-4 py-3.5 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all appearance-none disabled:opacity-50 disabled:grayscale transition-colors"
      >
        <option value="">Select Option</option>
        {options.map(o => <option key={o.value} value={o.value} className="bg-white dark:bg-[#1a1a1a]">{o.label}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]/30">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

const Textarea = ({ label, value, disabled, onChange, rows }) => (
  <div className="group">
    <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-2 group-focus-within:text-white transition-colors">{label}</label>
    <textarea
      value={value || ""}
      disabled={disabled}
      onChange={e => onChange && onChange(e.target.value)}
      rows={rows}
      className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl px-4 py-4 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all resize-none disabled:opacity-50 disabled:grayscale transition-colors"
    />
  </div>
);
