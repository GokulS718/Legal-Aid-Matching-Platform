import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateNGO, submitRegistration } from "../../Redux/registerSlice";
import { toast } from "react-toastify";
import {
  INDIAN_STATES_AND_UT_ARRAY,
  STATES_OBJECT,
  STATE_WISE_CITIES,
} from "indian-states-cities-list";

// Reusable input component - moved outside to prevent recreation on each render
const InputField = ({ label, id, type = "text", placeholder, value, onChange, onBlur, disabled = false, error, touched, required = false }) => {
  // If onChange is provided, it's a controlled component; otherwise, use defaultValue (uncontrolled)
  const inputProps = onChange
    ? { value: value || "", onChange, onBlur }
    : { defaultValue: value || "" };

  const showError = touched && error;

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        {...inputProps}
        disabled={disabled}
        className={`block w-full rounded-md border px-3 py-2.5 sm:text-sm focus:outline-none focus:ring-1 shadow-sm ${disabled
          ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-300"
          : showError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
      />
      {showError && (
        <span className="text-red-500 text-sm mt-1">{error}</span>
      )}
    </div>
  );
};

const NGOForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollPositionRef = useRef(0);

  // Store file in ref instead of Redux (files are not serializable)
  const registrationCertFileRef = useRef(null);

  // Get NGO data from Redux store
  const ngo = useSelector((state) => state.register.ngo);
  const isLoading = useSelector((state) => state.register.loading);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // State management for location dropdowns
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedNgoType, setSelectedNgoType] = useState("");

  // State management for latitude and longitude
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Validation functions
  const validateNgoName = (name) => {
    if (!name || name.trim() === "") {
      return "NGO Name is required";
    }
    if (name.trim().length < 2) {
      return "NGO Name must be at least 2 characters";
    }
    return "";
  };

  const validateNgoType = (type) => {
    if (!type || type.trim() === "") {
      return "NGO Type is required";
    }
    return "";
  };

  const validateRegistrationNumber = (regNo) => {
    if (!regNo || regNo.trim() === "") {
      return "Registration Number is required";
    }
    if (regNo.trim().length < 3) {
      return "Registration Number must be at least 3 characters";
    }
    return "";
  };

  const validateContact = (contact) => {
    if (!contact || contact.trim() === "") {
      return "Contact number is required";
    }
    if (!/^\d{10}$/.test(contact.trim())) {
      return "Contact number must be exactly 10 digits";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validateAddress = (address) => {
    if (!address || address.trim() === "") {
      return "Address is required";
    }
    if (address.trim().length < 10) {
      return "Address must be at least 10 characters";
    }
    return "";
  };

  const validateState = (state) => {
    if (!state || state.trim() === "") {
      return "State is required";
    }
    return "";
  };

  const validateDistrict = (district) => {
    if (!district || district.trim() === "") {
      return "District is required";
    }
    return "";
  };

  const validateCity = (city) => {
    if (!city || city.trim() === "") {
      return "City is required";
    }
    if (city.trim().length < 2) {
      return "City must be at least 2 characters";
    }
    return "";
  };

  const validatePincode = (pincode) => {
    if (!pincode || pincode.trim() === "") {
      return "Pincode is required";
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      return "Pincode must be exactly 6 digits";
    }
    return "";
  };

  // Validate latitude - returns error string or empty string
  const validateLatitude = (lat) => {
    if (!lat || lat.trim() === "") {
      return "Latitude is required";
    }
    const num = parseFloat(lat);
    if (isNaN(num)) {
      return "Latitude must be a valid number";
    }
    if (num < -90 || num > 90) {
      return "Latitude must be between -90 and 90";
    }
    return "";
  };

  // Check if latitude is valid (returns boolean)
  const isLatitudeValid = (lat) => {
    if (!lat || lat.trim() === "") return false;
    const num = parseFloat(lat);
    if (isNaN(num)) return false;
    return num >= -90 && num <= 90;
  };

  // Validate longitude - returns error string or empty string
  const validateLongitude = (lng) => {
    if (!lng || lng.trim() === "") {
      return "Longitude is required";
    }
    const num = parseFloat(lng);
    if (isNaN(num)) {
      return "Longitude must be a valid number";
    }
    if (num < -180 || num > 180) {
      return "Longitude must be between -180 and 180";
    }
    return "";
  };

  // Check if longitude is valid (returns boolean)
  const isLongitudeValid = (lng) => {
    if (!lng || lng.trim() === "") return false;
    const num = parseFloat(lng);
    if (isNaN(num)) return false;
    return num >= -180 && num <= 180;
  };

  const validatePassword = (password) => {
    if (!password || password.trim() === "") {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters and special char";
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return "Password must be at least 8 characters and special char";
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword || confirmPassword.trim() === "") {
      return "Please confirm your password";
    }
    if (confirmPassword !== password) {
      return "Passwords do not match";
    }
    return "";
  };

  const validateRegistrationCertificate = () => {
    if (!registrationCertFileRef.current) {
      return "Registration Certificate (PDF) is required";
    }
    return "";
  };

  // Validate a single field
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "ngoName":
        error = validateNgoName(value);
        break;
      case "ngoType":
        error = validateNgoType(value);
        break;
      case "registrationNumber":
        error = validateRegistrationNumber(value);
        break;
      case "contact":
        error = validateContact(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "address":
        error = validateAddress(value);
        break;
      case "state":
        error = validateState(value);
        break;
      case "district":
        error = validateDistrict(value);
        break;
      case "city":
        error = validateCity(value);
        break;
      case "pincode":
        error = validatePincode(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value, ngo.password || "");
        break;
      default:
        break;
    }
    return error;
  };

  // Handle field blur - validate on blur
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Handle latitude and longitude from local state
    if (field === "latitude") {
      const value = latitude || ngo.latitude || "";
      const error = validateLatitude(value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else if (field === "longitude") {
      const value = longitude || ngo.longitude || "";
      const error = validateLongitude(value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      const value = ngo[field] || "";
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Get current location from browser with retry mechanism
  const handleGetCurrentLocation = (retryCount = 0) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    // First try with high accuracy (slower but more accurate)
    // If that fails, retry with lower accuracy (faster)
    const options = {
      enableHighAccuracy: retryCount === 0, // High accuracy only on first try
      timeout: retryCount === 0 ? 20000 : 30000, // Longer timeout on retry
      maximumAge: retryCount === 0 ? 0 : 60000, // Allow cached location on retry (1 minute old)
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        setLatitude(latStr);
        setLongitude(lngStr);
        // Also update Redux state
        dispatch(updateNGO({ field: "latitude", value: latStr }));
        dispatch(updateNGO({ field: "longitude", value: lngStr }));
        setIsGettingLocation(false);
        setLocationError("");
        // Clear any validation errors for latitude/longitude
        setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
      },
      (error) => {
        setIsGettingLocation(false);

        // Retry once with lower accuracy settings if timeout occurs
        if (error.code === error.TIMEOUT && retryCount === 0) {
          console.log("First attempt timed out, retrying with lower accuracy...");
          setTimeout(() => {
            handleGetCurrentLocation(1);
          }, 500);
          return;
        }

        // Handle errors
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location permissions in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable. Please try entering coordinates manually.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please check your GPS/WiFi connection or enter coordinates manually.");
            break;
          default:
            setLocationError("Unable to get location. Please enter coordinates manually.");
            break;
        }
      },
      options
    );
  };

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

    // Convert array of district objects to options
    return Array.isArray(districts)
      ? districts.map((district) => ({
        label: district.label || district.value,
        value: district.value,
      }))
      : [];
  }, [selectedState, selectedStateObj]);

  // Save scroll position before state changes
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle state change - prevent scroll
  const handleStateChange = (state) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;

    setSelectedState(state);
    setSelectedDistrict(""); // Reset district when state changes
    setSelectedCity(""); // Reset city when state changes

    // Restore scroll position after state update
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: "instant",
      });
    }, 0);
  };

  // Handle district change - prevent scroll
  const handleDistrictChange = (district) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;

    setSelectedDistrict(district);
    setSelectedCity(""); // Reset city when district changes

    // Restore scroll position after district update
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: "instant",
      });
    }, 0);
  };

  // Update Redux state when form fields change - memoized to prevent re-renders
  const handleChange = useCallback((field, value) => {
    dispatch(updateNGO({ field, value }));

    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  }, [dispatch, touched]);

  // Handle file uploads - store files in refs, only store filename in Redux
  const handleFileChange = useCallback((field, file) => {
    // Validate file type - only PDF allowed
    if (file && file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed. Please select a PDF file.");
      return;
    }

    // Store file in ref
    if (field === "registrationCertificate") {
      registrationCertFileRef.current = file;
      // Only store filename in Redux (serializable)
      dispatch(updateNGO({ field: "registrationCertificateFilename", value: file ? file.name : "" }));
    }
  }, [dispatch]);

  // Validate all fields before submission
  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = [
      "ngoName",
      "ngoType",
      "registrationNumber",
      "contact",
      "email",
      "address",
      "state",
      "district",
      "city",
      "pincode",
      "password",
      "confirmPassword",
    ];

    fieldsToValidate.forEach((field) => {
      const value = ngo[field] || "";
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate latitude and longitude from local state
    const latValue = latitude || ngo.latitude || "";
    const latError = validateLatitude(latValue);
    if (latError) {
      newErrors.latitude = latError;
    }

    const lonValue = longitude || ngo.longitude || "";
    const lonError = validateLongitude(lonValue);
    if (lonError) {
      newErrors.longitude = lonError;
    }

    // Validate file uploads
    const regCertError = validateRegistrationCertificate();
    if (regCertError) {
      newErrors.registrationCertificate = regCertError;
    }

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {
        latitude: true,
        longitude: true,
        registrationCertificate: true,
      })
    );

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  // 3. Create the submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const validationResult = validateAll();
    if (!validationResult.isValid) {
      toast.error("Please fix all validation errors before submitting");
      // Scroll to first error after state update
      setTimeout(() => {
        const firstErrorField = Object.keys(validationResult.errors)[0];
        if (firstErrorField) {
          const element = document.querySelector(`[id*="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus();
          }
        }
      }, 100);
      return;
    }

    // Prepare form data with all fields including latitude and longitude
    const formData = {
      ...ngo,
      latitude: latitude || ngo.latitude || "",
      longitude: longitude || ngo.longitude || "",
      // Add file from ref (not from Redux)
      registrationCertificate: registrationCertFileRef.current,
    };

    // Update Redux with latest latitude/longitude if they exist
    if (latitude) {
      dispatch(updateNGO({ field: "latitude", value: latitude }));
    }
    if (longitude) {
      dispatch(updateNGO({ field: "longitude", value: longitude }));
    }

    // Send to backend through Redux thunk
    const result = await dispatch(
      submitRegistration({ role: "NGO", data: formData })
    );

    if (submitRegistration.fulfilled.match(result)) {
      const successMessage =
        result.payload?.message ||
        result.payload?.data?.message ||
        "Registration successful! Redirecting to login...";
      toast.success(successMessage);

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } else {
      const errorPayload = result.payload;
      let errorMessage = "Registration failed";

      if (errorPayload) {
        if (typeof errorPayload === "string") {
          errorMessage = errorPayload;
        } else if (errorPayload.message) {
          errorMessage = errorPayload.message;
        } else if (errorPayload.error) {
          errorMessage = errorPayload.error;
        }
      }

      toast.error(errorMessage);
    }
  };
  // Reusable component for file upload fields - PDF only
  const FileUploadField = ({ label, id, field, disabled = false, errors, touched }) => {
    const fileInputRef = useRef(null);

    const handleFileInputChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file type
        if (file.type !== "application/pdf") {
          toast.error("Only PDF files are allowed. Please select a PDF file.");
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the input
          }
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          toast.error("File size must be less than 5MB. Please select a smaller file.");
          if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the input
          }
          return;
        }

        if (field) {
          handleFileChange(field, file);
          toast.success(`File selected: ${file.name}`);
        }
      } else {
        // Clear file from ref if input is cleared
        if (field === "registrationCertificate") {
          registrationCertFileRef.current = null;
          dispatch(updateNGO({ field: "registrationCertificateFilename", value: "" }));
        }
      }
    };

    // Get filename from Redux for display
    const filename = ngo.registrationCertificateFilename || "";

    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
          {label} <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(PDF only, max 5MB)</span>
        </label>
        <div className="relative">
          <input
            type="file"
            id={id}
            ref={fileInputRef}
            onChange={handleFileInputChange}
            disabled={disabled || isLoading}
            accept=".pdf,application/pdf"
            className={`block w-full text-sm text-gray-500 
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 border border-gray-300 rounded-md shadow-sm ${disabled || isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
          />
        </div>
        {filename ? (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-green-600 font-medium">✓ Selected:</span>
            <span className="text-xs text-green-700">{filename}</span>
          </div>
        ) : (
          <div className="mt-1">
            <span className="text-xs text-gray-400">No file chosen</span>
          </div>
        )}
        {touched && errors && (
          <span className="text-red-500 text-sm mt-1">{errors}</span>
        )}
      </div>
    );
  };

  // Reusable component for select dropdowns
  const SelectField = ({ label, id, options, value, onChange, onBlur, disabled = false }) => {
    const selectRef = useRef(null);

    const handleChange = (e) => {
      // Save scroll position before change
      scrollPositionRef.current = window.scrollY;

      if (onChange) {
        onChange(e.target.value);
      }

      // Restore scroll position after change
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: "instant",
        });
        // Maintain focus on select
        if (selectRef.current) {
          selectRef.current.focus({ preventScroll: true });
        }
      }, 0);
    };

    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <div className="relative">
          <select
            ref={selectRef}
            id={id}
            value={value || ""}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled || isLoading}
            onFocus={(e) => {
              // Prevent scroll on focus
              e.target.scrollIntoView({ behavior: "instant", block: "nearest" });
            }}
            className={`block w-full pl-3 pr-10 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-1 rounded-md shadow-sm border appearance-none ${disabled || isLoading
              ? "bg-gray-100 cursor-not-allowed opacity-60"
              : "cursor-pointer focus:ring-blue-500 focus:border-blue-500"
              }`}
          >
            <option value="">{`Select ${label.split(" ")[0]}`}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const ngoTypeOptions = [
    { label: "Legal Aid", value: "Legal Aid" },
    { label: "Women Rights", value: "Women Rights" },
    { label: "Child Protection", value: "Child Protection" },
    { label: "Senior Citizen Welfare", value: "Senior Citizen Welfare" },
    { label: "Human Rights", value: "Human Rights" },
    { label: "Education Support", value: "Education Support" },
    { label: "Child Rights", value: "Child Rights" },
    { label: "Women Welfare", value: "Women Welfare" },
    { label: "Community Welfare", value: "Community Welfare" },
    { label: "Disaster Relief", value: "Disaster Relief" },
  ];

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="NGO Name"
          id="ngo-name"
          placeholder="NGO Name"
          value={ngo.ngoName}
          onChange={(e) => handleChange("ngoName", e.target.value)}
          onBlur={() => handleBlur("ngoName")}
          error={errors.ngoName}
          touched={touched.ngoName}
          required
          disabled={isLoading}
        />
        <div className="flex flex-col">
          <SelectField
            label="Type of NGO"
            id="ngo-type"
            options={ngoTypeOptions}
            value={selectedNgoType || ngo.ngoType || ""}
            onChange={(value) => {
              setSelectedNgoType(value);
              handleChange("ngoType", value);
              if (touched.ngoType) {
                const error = validateNgoType(value);
                setErrors((prev) => ({ ...prev, ngoType: error }));
              }
            }}
            onBlur={() => handleBlur("ngoType")}
          />
          {touched.ngoType && errors.ngoType && (
            <span className="text-red-500 text-sm mt-1">{errors.ngoType}</span>
          )}
        </div>

        <InputField
          label="Registration Number (Enrollment ID)"
          id="reg-number"
          placeholder="Registration Number (Enrollment ID)"
          value={ngo.registrationNumber}
          onChange={(e) => handleChange("registrationNumber", e.target.value)}
          onBlur={() => handleBlur("registrationNumber")}
          error={errors.registrationNumber}
          touched={touched.registrationNumber}
          required
          disabled={isLoading}
        />
        <FileUploadField
          label="Registration Certificate"
          id="reg-certificate"
          field="registrationCertificate"
          errors={touched.registrationCertificate ? errors.registrationCertificate : null}
          touched={touched.registrationCertificate}
        />

        <InputField
          label="Contact (10 Digits)"
          id="ngo-contact"
          type="tel"
          placeholder="Contact (10 Digits)"
          value={ngo.contact}
          onChange={(e) => handleChange("contact", e.target.value)}
          onBlur={() => handleBlur("contact")}
          error={errors.contact}
          touched={touched.contact}
          required
          disabled={isLoading}
        />
        <InputField
          label="Official Email"
          id="ngo-email"
          type="email"
          placeholder="Official Email"
          value={ngo.email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email")}
          error={errors.email}
          touched={touched.email}
          required
          disabled={isLoading}
        />

        <InputField
          label="Address"
          id="ngo-address"
          placeholder="Address"
          value={ngo.address}
          onChange={(e) => handleChange("address", e.target.value)}
          onBlur={() => handleBlur("address")}
          error={errors.address}
          touched={touched.address}
          required
          disabled={isLoading}
        />

        {/* State, District, City - Cascading dropdowns */}
        <div className="flex flex-col">
          <SelectField
            label="State"
            id="ngo-state"
            options={stateOptions}
            value={selectedState || ngo.state || ""}
            onChange={(value) => {
              handleStateChange(value);
              handleChange("state", value);
              if (touched.state) {
                const error = validateState(value);
                setErrors((prev) => ({ ...prev, state: error }));
              }
            }}
            onBlur={() => handleBlur("state")}
          />
          {touched.state && errors.state && (
            <span className="text-red-500 text-sm mt-1">{errors.state}</span>
          )}
        </div>
        <div className="flex flex-col">
          <SelectField
            label="District"
            id="ngo-district"
            options={districtOptions}
            value={selectedDistrict || ngo.district || ""}
            onChange={(value) => {
              handleDistrictChange(value);
              handleChange("district", value);
              if (touched.district) {
                const error = validateDistrict(value);
                setErrors((prev) => ({ ...prev, district: error }));
              }
            }}
            onBlur={() => handleBlur("district")}
            disabled={!selectedState}
          />
          {touched.district && errors.district && (
            <span className="text-red-500 text-sm mt-1">{errors.district}</span>
          )}
        </div>
        <InputField
          label="City"
          id="ngo-city"
          placeholder="Enter city name"
          value={selectedCity || ngo.city || ""}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            handleChange("city", e.target.value);
          }}
          onBlur={() => handleBlur("city")}
          error={errors.city}
          touched={touched.city}
          required
          disabled={isLoading}
        />

        <InputField
          label="Pincode (6 Digits)"
          id="ngo-pincode"
          placeholder="Pincode (6 Digits)"
          value={ngo.pincode}
          onChange={(e) => handleChange("pincode", e.target.value)}
          onBlur={() => handleBlur("pincode")}
          error={errors.pincode}
          touched={touched.pincode}
          required
          disabled={isLoading}
        />

        {/* Latitude and Longitude Section */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Location Coordinates
            </label>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGettingLocation ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>Get Current Location</span>
                </>
              )}
            </button>
          </div>
          {locationError && (
            <div className="mb-2 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {locationError}
            </div>
          )}
          {!locationError && !isGettingLocation && (
            <div className="mb-2 p-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded">
              💡 Tip: Make sure location/GPS is enabled on your device. If it times out, enter coordinates manually.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="latitude"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="latitude"
                step="any"
                placeholder="e.g., 19.0760"
                value={latitude || ngo.latitude || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setLatitude(value);
                  handleChange("latitude", value);
                  if (touched.latitude) {
                    const error = validateLatitude(value);
                    setErrors((prev) => ({ ...prev, latitude: error }));
                  }
                  if (value && !isLatitudeValid(value)) {
                    setLocationError("Latitude must be between -90 and 90");
                  } else {
                    setLocationError("");
                  }
                }}
                onBlur={() => handleBlur("latitude")}
                disabled={isLoading}
                className={`block w-full rounded-md border px-3 py-2.5 sm:text-sm focus:outline-none focus:ring-1 shadow-sm ${isLoading
                  ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-300"
                  : touched.latitude && errors.latitude
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
              />
              {touched.latitude && errors.latitude && (
                <span className="text-red-500 text-sm mt-1">{errors.latitude}</span>
              )}
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="longitude"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="longitude"
                step="any"
                placeholder="e.g., 72.8777"
                value={longitude || ngo.longitude || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setLongitude(value);
                  handleChange("longitude", value);
                  if (touched.longitude) {
                    const error = validateLongitude(value);
                    setErrors((prev) => ({ ...prev, longitude: error }));
                  }
                  if (value && !isLongitudeValid(value)) {
                    setLocationError("Longitude must be between -180 and 180");
                  } else {
                    setLocationError("");
                  }
                }}
                onBlur={() => handleBlur("longitude")}
                disabled={isLoading}
                className={`block w-full rounded-md border px-3 py-2.5 sm:text-sm focus:outline-none focus:ring-1 shadow-sm ${isLoading
                  ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-300"
                  : touched.longitude && errors.longitude
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
              />
              {touched.longitude && errors.longitude && (
                <span className="text-red-500 text-sm mt-1">{errors.longitude}</span>
              )}
            </div>
          </div>

          {/* Google Maps Preview */}
          {latitude && longitude && isLatitudeValid(latitude) && isLongitudeValid(longitude) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Location Preview
                </label>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Open in Google Maps</span>
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
              <div className="w-full h-64 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${latitude},${longitude}&output=embed&z=15`}
                  title="Location Preview"
                ></iframe>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {latitude}, {longitude}
              </p>
            </div>
          )}
        </div>

        <InputField
          label="Password (Min 8 Chars, Special Char Required)"
          id="ngo-password"
          type="password"
          placeholder="Password"
          value={ngo.password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password")}
          error={errors.password}
          touched={touched.password}
          required
          disabled={isLoading}
        />

        <InputField
          label="Confirm Password"
          id="ngo-confirm-password"
          type="password"
          placeholder="Confirm Password"
          value={ngo.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={() => handleBlur("confirmPassword")}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
          required
          disabled={isLoading}
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Creating Account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </div>
    </form>
  );
};

export default NGOForm;
