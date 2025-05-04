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
    <div className="p-6 max-w-md bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Mark Update as Available</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Customer ID</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold">Update Message (optional)</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Mark Update Available
        </button>
      </form>
      {success && <p className="mt-4 text-green-600">{success}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default MarkUpdateForm;
