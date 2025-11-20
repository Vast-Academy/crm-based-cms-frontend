import React, { useState, useEffect } from "react";
import { useNotification } from "../context/NotificationContext";

const MarkUpdateForm = ({ onClose }) => {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [updateType, setUpdateType] = useState("frontend");
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Double ESC and double click states
  const [escPressCount, setEscPressCount] = useState(0);
  const [escPressTimer, setEscPressTimer] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);

  useEffect(() => {
    // Fetch customers from API
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ota/customers`);
        const data = await response.json();
        setCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      }
    };
    fetchCustomers();
  }, []);

  // Double ESC handler
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (escPressCount === 0) {
          setEscPressCount(1);
          const timer = setTimeout(() => {
            showNotification('info', 'To close the popup, press ESC twice', 3000);
            setEscPressCount(0);
          }, 800);
          setEscPressTimer(timer);
        } else if (escPressCount === 1) {
          clearTimeout(escPressTimer);
          setEscPressCount(0);
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        }
      }
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      if (escPressTimer) clearTimeout(escPressTimer);
    };
  }, [escPressCount, escPressTimer, onClose, showNotification]);

  // Handle overlay click - requires double click to close
  const handleOverlayClick = (e) => {
    // Only handle if clicked directly on overlay (not on modal content)
    if (e.target === e.currentTarget) {
      if (clickCount === 0) {
        setClickCount(1);
        const timer = setTimeout(() => {
          showNotification('info', 'To close the popup, click twice on the background', 3000);
          setClickCount(0);
        }, 800);
        setClickTimer(timer);
      } else if (clickCount === 1) {
        if (clickTimer) clearTimeout(clickTimer);
        setClickCount(0);
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Selected Customer ID:", customerId);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ota/mark-update-available`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: customerId,
            updateType: updateType,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("checking data:", data);

      // Show success notification and close popup
      showNotification("success", "Update marked as available successfully!");
      if (onClose && typeof onClose === 'function') {
        onClose();
      }

    } catch (err) {
      showNotification("error", `Error: ${err.message}`);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-6 relative">
          <button
            onClick={() => {
              if (onClose && typeof onClose === 'function') {
                onClose();
              }
            }}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Mark Update</h2>
              <p className="text-cyan-100 text-sm mt-1">Deploy updates to customers</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer Select */}
          <div>
            <label htmlFor="customer" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Select Customer
            </label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => {
                console.log("Customer selected:", e.target.value);
                setCustomerId(e.target.value);
              }}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none transition-all duration-200 text-gray-700"
            >
              <option value="">Choose a customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name || customer.githubUsername}
                </option>
              ))}
            </select>
          </div>

          {/* Update Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Update Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Frontend Option */}
              <label className={`relative cursor-pointer group ${updateType === "frontend" ? "ring-2 ring-cyan-500" : ""}`}>
                <input
                  type="radio"
                  name="updateType"
                  value="frontend"
                  checked={updateType === "frontend"}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                  updateType === "frontend"
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
                }`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${updateType === "frontend" ? "text-cyan-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className={`font-semibold ${updateType === "frontend" ? "text-cyan-700" : "text-gray-700"}`}>Frontend</div>
                      <div className="text-xs text-gray-500 mt-1">UI Updates</div>
                    </div>
                  </div>
                </div>
              </label>

              {/* Backend Option */}
              <label className={`relative cursor-pointer group ${updateType === "backend" ? "ring-2 ring-cyan-500" : ""}`}>
                <input
                  type="radio"
                  name="updateType"
                  value="backend"
                  checked={updateType === "backend"}
                  onChange={(e) => setUpdateType(e.target.value)}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                  updateType === "backend"
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-gray-200 hover:border-cyan-300 hover:bg-gray-50"
                }`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${updateType === "backend" ? "text-cyan-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    <div>
                      <div className={`font-semibold ${updateType === "backend" ? "text-cyan-700" : "text-gray-700"}`}>Backend</div>
                      <div className="text-xs text-gray-500 mt-1">API Updates</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Mark Update Available
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MarkUpdateForm;