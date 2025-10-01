import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RegisterUser from "../../backend/authentication/register";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    aadhaarFront: "",
    aadhaarBack: "",
  });
  const [errors, setErrors] = useState({});
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack] = useState(null);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const phone = localStorage.getItem("userPhone");

  // Focus trap for accessibility
  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;

    const focusableElements = formElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    formElement.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => formElement.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));
      const previewUrl = URL.createObjectURL(file);
      if (name === "aadhaarFront") setPreviewFront(previewUrl);
      if (name === "aadhaarBack") setPreviewBack(previewUrl);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/))
      newErrors.email = "Valid email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    // if (!formData.aadhaarFront)
    //   newErrors.aadhaarFront = "Aadhaar front image is required";
    // if (!formData.aadhaarBack)
    //   newErrors.aadhaarBack = "Aadhaar back image is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    try {
      const result = await RegisterUser(
        formData.name,
        formData.email,
        phone,
        "",
        formData.address,
        "",
        ""
      );

      console.log("Register API Response:", result);

      if (result) {
        alert("Registered successfully!");
        navigate("/"); // Redirect after success
      } else {
        alert("Registration failed, please try again.");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("An error occurred during registration.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 font-sans flex items-center justify-center">
      <div
        className="relative w-full max-w-lg p-6 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-200"
        ref={formRef}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Register
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-indigo-600">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-indigo-600">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-indigo-600">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="4"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>

          {/* Aadhaar Front */}
          <div>
            <label className="block text-sm font-medium text-indigo-600">
              Aadhaar Front Image
            </label>
            <input
              type="file"
              name="aadhaarFront"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none"
            />
            {previewFront && (
              <img
                src={previewFront}
                alt="Aadhaar Front"
                className="mt-2 h-32 w-auto rounded object-cover"
              />
            )}
            {errors.aadhaarFront && (
              <p className="mt-1 text-sm text-red-600">{errors.aadhaarFront}</p>
            )}
          </div>

          {/* Aadhaar Back */}
          <div>
            <label className="block text-sm font-medium text-indigo-600">
              Aadhaar Back Image
            </label>
            <input
              type="file"
              name="aadhaarBack"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none"
            />
            {previewBack && (
              <img
                src={previewBack}
                alt="Aadhaar Back"
                className="mt-2 h-32 w-auto rounded object-cover"
              />
            )}
            {errors.aadhaarBack && (
              <p className="mt-1 text-sm text-red-600">{errors.aadhaarBack}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
