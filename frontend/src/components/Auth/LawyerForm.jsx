import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateLawyer, submitRegistration } from "../../Redux/registerSlice";
import { API_BASE } from "../../api/axiosClient.js";
import { toast } from "react-toastify";
import {
  INDIAN_STATES_AND_UT_ARRAY,
  STATES_OBJECT,
  STATE_WISE_CITIES,
} from "indian-states-cities-list";

// Reusable input component - moved outside to prevent recreation on each render
const InputField = ({
  label,
  id,
  type = "text",
  placeholder,
  field,
  value,
  onChange,
  onBlur,
  disabled = false,
  lawyer,
  isLoading,
  handleChange,
  error,
  touched,
  required = false,
}) => {
  const fieldValue = value !== undefined ? value : lawyer?.[field] || "";
  const handleInputChange = (e) => {
    if (onChange) {
      onChange(e);
    } else if (field && handleChange) {
      handleChange(field, e.target.value);
    }
  };

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
        value={fieldValue}
        onChange={handleInputChange}
        onBlur={onBlur}
        disabled={disabled || isLoading}
        className={`block w-full rounded-md border px-3 py-2.5 sm:text-sm focus:outline-none focus:ring-1 shadow-sm ${disabled || isLoading
          ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-300"
          : showError
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
      />
      {showError && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

const LawyerForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollPositionRef = useRef(0);

  // Store files in refs instead of Redux (files are not serializable)
  const aadharProofFileRef = useRef(null);
  const barCertFileRef = useRef(null);

  // Get lawyer data from Redux store
  const lawyer = useSelector((state) => state.register.lawyer);
  const isLoading = useSelector((state) => state.register.loading);

  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // State management for location dropdowns
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarState, setSelectedBarState] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");

  // State management for latitude and longitude
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // State management for address
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState("");

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

  // Get cities - if not available in library, use text input
  // For now, we'll use a text input for city since the library structure doesn't clearly provide cities
  const cityOptions = [];

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
        dispatch(updateLawyer({ field: "latitude", value: latStr }));
        dispatch(updateLawyer({ field: "longitude", value: lngStr }));
        setIsGettingLocation(false);
        setLocationError("");
        // Clear any validation errors for latitude/longitude
        setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
      },
      (error) => {
        setIsGettingLocation(false);

        // Retry once with lower accuracy settings if timeout occurs
        if (error.code === error.TIMEOUT && retryCount === 0) {
          console.log(
            "First attempt timed out, retrying with lower accuracy..."
          );
          setTimeout(() => {
            handleGetCurrentLocation(1);
          }, 500);
          return;
        }

        // Handle errors
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access denied. Please enable location permissions in your browser settings."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information unavailable. Please try entering coordinates manually or use the address geocoding feature."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Location request timed out. Please check your GPS/WiFi connection or enter coordinates manually."
            );
            break;
          default:
            setLocationError(
              "Unable to get location. Please enter coordinates manually or use the address geocoding feature."
            );
            break;
        }
      },
      options
    );
  };

  // Validation functions
  const validateFullName = (name) => {
    if (!name || name.trim() === "") {
      return "Full Name is required";
    }
    if (name.trim().length < 2) {
      return "Full Name must be at least 2 characters";
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return "Full Name should only contain letters and spaces";
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

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required";
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      return "Phone number must be exactly 10 digits";
    }
    return "";
  };

  const validateAadhar = (aadhar) => {
    if (!aadhar || aadhar.trim() === "") {
      return "Aadhar number is required";
    }
    if (!/^\d{12}$/.test(aadhar.trim())) {
      return "Aadhar must be exactly 12 digits";
    }
    return "";
  };

  const validateBarCouncilId = (barId) => {
    if (!barId) {
      return "Enrollment number is required.";
    }

    const enrollmentRegex = /^[A-Z]{2,3}\/\d{1,5}\/(19|20)\d{2}$/;

    if (!enrollmentRegex.test(barId)) {
      return "Invalid enrollment number format. Example: MAH/1234/2012";
    }

    const year = parseInt(barId.split("/")[2], 10);
    const currentYear = new Date().getFullYear();

    if (year > currentYear) {
      return "Enrollment year cannot be in the future.";
    }

    return ""; // ✅ VALID
  };

  const validateBarState = (barState) => {
    if (!barState || barState.trim() === "") {
      return "Bar State is required";
    }
    return "";
  };

  const validateSpecialization = (specialization) => {
    if (!specialization || specialization.trim() === "") {
      return "Specialization is required";
    }
    return "";
  };

  const validateExperience = (experience) => {
    if (!experience || experience.trim() === "") {
      return "Experience is required";
    }
    const exp = parseInt(experience);
    if (isNaN(exp) || exp < 0) {
      return "Experience must be a valid number (0 or greater)";
    }
    if (exp > 50) {
      return "Experience cannot exceed 50 years";
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

  // Validate latitude
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

  // Validate longitude
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
    if (password.length < 6) {
      return "Password must be at least 6 characters";
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

  const validateAadharProof = () => {
    if (!aadharProofFileRef.current) {
      return "Aadhar Proof (PDF) is required";
    }
    return "";
  };

  const validateBarCert = () => {
    if (!barCertFileRef.current) {
      return "Bar Certificate (PDF) is required";
    }
    return "";
  };

  // Validate a single field
  const validateField = (field, value) => {
    let error = "";
    switch (field) {
      case "fullName":
        error = validateFullName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "phone":
        error = validatePhone(value);
        break;
      case "aadhar":
        error = validateAadhar(value);
        break;
      case "barId":
        error = validateBarCouncilId(value);
        break;
      case "barState":
        error = validateBarState(value);
        break;
      case "specialization":
        error = validateSpecialization(value);
        break;
      case "experience":
        error = validateExperience(value);
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
      case "latitude":
        error = validateLatitude(value);
        break;
      case "longitude":
        error = validateLongitude(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value, lawyer.password || "");
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
      const value = latitude || lawyer.latitude || "";
      const error = validateLatitude(value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else if (field === "longitude") {
      const value = longitude || lawyer.longitude || "";
      const error = validateLongitude(value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      const value = lawyer[field] || "";
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Geocode address to get latitude and longitude
  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      setGeocodingError("Please enter an address");
      return;
    }

    // Build full address with state, district, city if available
    // Format: Address, City, District, State, India
    let addressParts = [];

    if (address.trim()) {
      addressParts.push(address.trim());
    }
    if (selectedCity) {
      addressParts.push(selectedCity);
    }
    if (selectedDistrict) {
      addressParts.push(selectedDistrict);
    }
    if (selectedState) {
      addressParts.push(selectedState);
    }
    addressParts.push("India");

    const fullAddress = addressParts.join(", ");

    setIsGeocoding(true);
    setGeocodingError("");
    setLocationError("");

    try {
      // Using backend endpoint to avoid CORS issues
      const response = await fetch(
        `${API_BASE}/geocoding/geocode?address=${encodeURIComponent(
          fullAddress
        )}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      // Get response text first to handle both JSON and text responses
      const responseText = await response.text();
      let data;

      try {
        // Try to parse as JSON
        data = JSON.parse(responseText);
      } catch (e) {
        // If not JSON, it's a plain text error
        setGeocodingError(
          responseText || `Geocoding request failed: ${response.status}`
        );
        return;
      }

      if (!response.ok) {
        // Handle error response (which should be JSON now)
        const errorMessage =
          data?.error || data?.message || "Address not found";
        setGeocodingError(errorMessage);
        return;
      }

      if (data && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        setLatitude(lat.toFixed(6));
        setLongitude(lon.toFixed(6));
        setGeocodingError("");
      } else if (data && data.error) {
        setGeocodingError(data.error);
      } else {
        setGeocodingError(
          "Address not found. Please try a more specific address or enter coordinates manually."
        );
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setGeocodingError(
        "Failed to geocode address. Please try again or enter coordinates manually."
      );
    } finally {
      setIsGeocoding(false);
    }
  };
  // Update Redux state when form fields change - memoized to prevent re-renders
  const handleChange = useCallback(
    (field, value) => {
      dispatch(updateLawyer({ field, value }));

      // Validate on change if field has been touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [dispatch, touched]
  );

  // Handle file uploads - store files in refs, only store filename in Redux
  const handleFileChange = useCallback(
    (field, file) => {
      // Validate file type - only PDF allowed
      if (file && file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed. Please select a PDF file.");
        return;
      }

      // Store file in ref
      if (field === "aadharProof") {
        aadharProofFileRef.current = file;
        // Only store filename in Redux (serializable)
        dispatch(
          updateLawyer({
            field: "aadharProofFilename",
            value: file ? file.name : "",
          })
        );
      } else if (field === "barCert") {
        barCertFileRef.current = file;
        // Only store filename in Redux (serializable)
        dispatch(
          updateLawyer({
            field: "barCertFilename",
            value: file ? file.name : "",
          })
        );
      }
    },
    [dispatch]
  );

  // Validate all fields before submission
  const validateAll = () => {
    const newErrors = {};
    const fieldsToValidate = [
      "fullName",
      "email",
      "phone",
      "aadhar",
      "barId",
      "barState",
      "specialization",
      "experience",
      "address",
      "state",
      "district",
      "city",
      "password",
      "confirmPassword",
    ];

    fieldsToValidate.forEach((field) => {
      const value = lawyer[field] || "";
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validate latitude and longitude from local state (not from Redux)
    const latValue = latitude || lawyer.latitude || "";
    const latError = validateLatitude(latValue);
    if (latError) {
      newErrors.latitude = latError;
    }

    const lonValue = longitude || lawyer.longitude || "";
    const lonError = validateLongitude(lonValue);
    if (lonError) {
      newErrors.longitude = lonError;
    }

    // Validate file uploads
    const aadharError = validateAadharProof();
    if (aadharError) {
      newErrors.aadharProof = aadharError;
    }

    const barCertError = validateBarCert();
    if (barCertError) {
      newErrors.barCert = barCertError;
    }

    setErrors(newErrors);
    setTouched(
      fieldsToValidate.reduce((acc, field) => ({ ...acc, [field]: true }), {
        latitude: true,
        longitude: true,
        aadharProof: true,
        barCert: true,
      })
    );

    return Object.keys(newErrors).length === 0;
  };

  // 3. Create the submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    if (!validateAll()) {
      toast.error("Please fix all validation errors before submitting");
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[id*="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    // Prepare form data with all fields including latitude and longitude
    const formData = {
      ...lawyer,
      latitude: latitude || lawyer.latitude || "",
      longitude: longitude || lawyer.longitude || "",
      // Add files from refs (not from Redux)
      aadharProof: aadharProofFileRef.current,
      barCert: barCertFileRef.current,
    };

    // Update Redux with latest latitude/longitude if they exist
    if (latitude) {
      dispatch(updateLawyer({ field: "latitude", value: latitude }));
    }
    if (longitude) {
      dispatch(updateLawyer({ field: "longitude", value: longitude }));
    }

    // Send to backend through Redux thunk
    const result = await dispatch(
      submitRegistration({ role: "Lawyer", data: formData })
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
  const FileUploadField = ({
    label,
    id,
    field,
    disabled = false,
    errors,
    touched,
  }) => {
    // Use ref to maintain file input state across re-renders
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
          toast.error(
            "File size must be less than 5MB. Please select a smaller file."
          );
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
        if (field === "aadharProof") {
          aadharProofFileRef.current = null;
          dispatch(updateLawyer({ field: "aadharProofFilename", value: "" }));
        } else if (field === "barCert") {
          barCertFileRef.current = null;
          dispatch(updateLawyer({ field: "barCertFilename", value: "" }));
        }
      }
    };

    // Get filename from Redux for display
    const filename = lawyer[`${field}Filename`] || "";
    return (
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1">
          {label} <span className="text-red-500">*</span>{" "}
          <span className="text-xs text-gray-500">(PDF only, max 5MB)</span>
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
              hover:file:bg-blue-100 border border-gray-300 rounded-md shadow-sm ${disabled || isLoading
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
              }`}
          />
        </div>
        {filename ? (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-xs text-green-600 font-medium">
              ✓ Selected:
            </span>
            <span className="text-xs text-green-700">{filename}</span>
          </div>
        ) : (
          <div className="mt-1">
            <span className="text-xs text-gray-400">No file chosen</span>
          </div>
        )}
        {touched[field] && errors[`${field}Filename`] && (
          <span className="text-red-500 text-sm mt-1">
            {errors[`${field}Filename`]}
          </span>
        )}
      </div>
    );
  };

  // Reusable component for select dropdowns
  const SelectField = ({
    label,
    id,
    options,
    value,
    onChange,
    onBlur,
    disabled = false,
  }) => {
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
              e.target.scrollIntoView({
                behavior: "instant",
                block: "nearest",
              });
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

  const specializationOptions = [
    { label: "Criminal Law", value: "Criminal" },
    { label: "Civil Law", value: "Civil" },
    { label: "Corporate Law", value: "Corporate" },
    { label: "Family Law", value: "Family" },
    { label: "Property Law", value: "Property" },
  ];

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Full Name"
          id="lawyer-full-name"
          placeholder="Full Name"
          field="fullName"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("fullName")}
          error={errors.fullName}
          touched={touched.fullName}
          required
        />
        <InputField
          label="Email"
          id="lawyer-email"
          type="email"
          placeholder="Email"
          field="email"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("email")}
          error={errors.email}
          touched={touched.email}
          required
        />
        <InputField
          label="Phone (10 Digits)"
          id="lawyer-phone"
          type="tel"
          placeholder="Phone (10 Digits)"
          field="phone"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("phone")}
          error={errors.phone}
          touched={touched.phone}
          required
        />
        <InputField
          label="Aadhar (12 Digits)"
          id="lawyer-aadhar"
          placeholder="Aadhar (12 Digits)"
          field="aadhar"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("aadhar")}
          error={errors.aadhar}
          touched={touched.aadhar}
          required
        />

        <FileUploadField
          label="Aadhar Proof"
          id="aadhar-proof"
          field="aadharProof"
          errors={errors}
          touched={touched}
        />
        <InputField
          label="Bar Council ID (Enrollment Number/ID)"
          id="bar-council-id"
          placeholder="Bar Council ID (Enrollment Number/ID)"
          field="barId"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("barId")}
          error={errors.barId}
          touched={touched.barId}
          required
        />

        <div className="flex flex-col">
          <SelectField
            label="Bar State"
            id="bar-state"
            options={stateOptions}
            value={selectedBarState || lawyer.barState || ""}
            onChange={(value) => {
              setSelectedBarState(value);
              handleChange("barState", value);
              if (touched.barState) {
                const error = validateBarState(value);
                setErrors((prev) => ({ ...prev, barState: error }));
              }
            }}
            onBlur={() => handleBlur("barState")}
          />
          {touched.barState && errors.barState && (
            <span className="text-red-500 text-sm mt-1">{errors.barState}</span>
          )}
        </div>
        <div className="flex flex-col">
          <SelectField
            label="Specialization"
            id="specialization"
            options={specializationOptions}
            value={selectedSpecialization || lawyer.specialization || ""}
            onChange={(value) => {
              setSelectedSpecialization(value);
              handleChange("specialization", value);
              if (touched.specialization) {
                const error = validateSpecialization(value);
                setErrors((prev) => ({ ...prev, specialization: error }));
              }
            }}
            onBlur={() => handleBlur("specialization")}
          />
          {touched.specialization && errors.specialization && (
            <span className="text-red-500 text-sm mt-1">
              {errors.specialization}
            </span>
          )}
        </div>

        <FileUploadField
          label="Bar Certificate"
          id="bar-certificate"
          field="barCert"
          errors={errors}
          touched={touched}
        />
        <InputField
          label="Experience (Years)"
          id="experience"
          type="number"
          placeholder="Experience (Years)"
          field="experience"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("experience")}
          error={errors.experience}
          touched={touched.experience}
          required
        />

        {/* Address Field with Geocode Button */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="address"
              className="text-sm font-medium text-gray-700"
            >
              Address <span className="text-red-500">*</span>
            </label>
            {/* <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={isGeocoding || !address.trim()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeocoding ? (
                <>
                  <svg
                    className="animate-spin h-3 w-3"
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
                  <span>Finding...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Get Coordinates</span>
                </>
              )}
            </button> */}
          </div>
          <input
            type="text"
            id="address"
            placeholder="Enter your full address"
            value={address || lawyer.address || ""}
            onChange={(e) => {
              setAddress(e.target.value);
              handleChange("address", e.target.value);
            }}
            onBlur={() => handleBlur("address")}
            disabled={isLoading}
            className={`block w-full rounded-md border px-3 py-2.5 sm:text-sm focus:outline-none focus:ring-1 shadow-sm ${isLoading
              ? "bg-gray-100 cursor-not-allowed opacity-60 border-gray-300"
              : touched.address && errors.address
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
          />
          {touched.address && errors.address && (
            <span className="text-red-500 text-sm mt-1 block">
              {errors.address}
            </span>
          )}
          {geocodingError && (
            <span className="text-red-500 text-xs mt-1 block">
              {geocodingError}
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <SelectField
            label="State"
            id="lawyer-state"
            options={stateOptions}
            value={selectedState || lawyer.state || ""}
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
            id="district"
            options={districtOptions}
            value={selectedDistrict || lawyer.district || ""}
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
          id="city"
          placeholder="Enter city name"
          field="city"
          value={selectedCity || lawyer.city || ""}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            handleChange("city", e.target.value);
          }}
          onBlur={() => handleBlur("city")}
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          error={errors.city}
          touched={touched.city}
          required
        />

        {/* Latitude and Longitude Section */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700"></label>
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
              💡 Tip: Make sure location/GPS is enabled on your device. If it
              times out, try using the "Get Coordinates from Address" button
              below or enter coordinates manually.
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
                value={latitude || lawyer.latitude || ""}
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
                <span className="text-red-500 text-sm mt-1">
                  {errors.latitude}
                </span>
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
                value={longitude || lawyer.longitude || ""}
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
                <span className="text-red-500 text-sm mt-1">
                  {errors.longitude}
                </span>
              )}
            </div>
          </div>

          {/* Google Maps Preview */}
          {latitude &&
            longitude &&
            isLatitudeValid(latitude) &&
            isLongitudeValid(longitude) && (
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
          label="Password (Min 6 Chars)"
          id="lawyer-password"
          type="password"
          placeholder="Password"
          field="password"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("password")}
          error={errors.password}
          touched={touched.password}
          required
        />
        <InputField
          label="Confirm Password"
          id="lawyer-confirm-password"
          type="password"
          placeholder="Confirm Password"
          field="confirmPassword"
          lawyer={lawyer}
          isLoading={isLoading}
          handleChange={handleChange}
          onBlur={() => handleBlur("confirmPassword")}
          error={errors.confirmPassword}
          touched={touched.confirmPassword}
          required
        />
      </div>

      <div className="pt-4">
        <button
          onClick={(e) => {
            handleSubmit(e);
          }}
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

export default LawyerForm;
