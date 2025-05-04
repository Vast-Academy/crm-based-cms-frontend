import React, { useState } from "react";

const MarkUpdateForm = () => {
  const [customerId, setCustomerId] = useState("");
  const [projectType, setProjectType] = useState("frontend");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/ota/mark-update-available`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId, projectType, message }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, error: "Request failed" });
    }

    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Mark Update as Available</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          Customer ID:
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            className="w-full border p-2 mt-1 rounded"
          />
        </label>
        <label className="block mb-2">
          Project Type:
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full border p-2 mt-1 rounded"
          >
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
          </select>
        </label>
        <label className="block mb-4">
          Update Message (optional):
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border p-2 mt-1 rounded"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Marking..." : "Mark Update"}
        </button>
      </form>

      {response && (
        <div className={`mt-4 p-3 rounded ${response.success ? "bg-green-100" : "bg-red-100"}`}>
          {response.success ? "Update marked successfully." : `Error: ${response.error}`}
        </div>
      )}
    </div>
  );
};

export default MarkUpdateForm;