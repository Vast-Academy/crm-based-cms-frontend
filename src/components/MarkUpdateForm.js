import React, { useState } from "react";

const MarkUpdateForm = () => {
  const [customerId, setCustomerId] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ota/mark-update-available`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Update marked as available!");
        setCustomerId("");
        setMessage("");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Server error.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Mark Update as Available
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">
            Customer ID
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-md p-2"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">
            Update Message (optional)
          </label>
          <textarea
            className="border border-gray-300 rounded-md p-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Mark Update Available
        </button>
      </form>

      {success && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default MarkUpdateForm;