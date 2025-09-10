import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function DynamicLeadFormV2() {
  const [form, setForm] = useState({
    customerName: "",
    companyName: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: false,
    address: "",
    leadType: "", // Lead | Customer
    customerStatus: "", // New | Existing
    installDate: "",
    projectType: "",
    installedBy: "", // only for Existing customers
    remarks: "",
  });

  // Sync WhatsApp with phone if checkbox is ON
  useEffect(() => {
    if (form.sameAsPhone) {
      setForm((f) => ({ ...f, whatsapp: f.phone }));
    }
  }, [form.sameAsPhone, form.phone]);

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const services = useMemo(
    () => [
      { value: "cctv_installation", label: "CCTV Installation" },
      { value: "attendance_system", label: "Attendance System" },
      { value: "access_control", label: "Access Control" },
      { value: "video_intercom", label: "Video & Voice Intercom" },
      { value: "fire_alarm", label: "Fire & Safety (Alarm)" },
      { value: "networking", label: "Networking & Cabling" },
    ],
    []
  );

  const installedByOptions = [
    { value: "", label: "Choose..." },
    { value: "3g_digital", label: "3G Digital" },
    { value: "self", label: "Customer Self" },
    { value: "other_vendor", label: "Other Vendor" },
  ];

  function update(key, value) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "leadType" ? { customerStatus: "", installDate: "", installedBy: "" } : {}),
      ...(key === "customerStatus" && value !== "Existing" ? { installDate: "", installedBy: "" } : {}),
      ...(key === "sameAsPhone" && value === true ? { whatsapp: f.phone } : {}),
    }));
  }

  function validate() {
    const e = {};
    if (!form.customerName.trim()) e.customerName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (form.phone && !/^\+?[0-9\s-]{7,15}$/.test(form.phone)) e.phone = "Invalid";
    if (form.whatsapp && !/^\+?[0-9\s-]{7,15}$/.test(form.whatsapp)) e.whatsapp = "Invalid";

    if (!form.leadType) e.leadType = "Select one";
    if (form.leadType === "Customer" && !form.customerStatus) e.customerStatus = "Select one";
    if (form.leadType === "Customer" && form.customerStatus === "Existing" && !form.installDate) e.installDate = "Required";

    if (!form.projectType) e.projectType = "Select a project";
    if (form.leadType === "Customer" && form.customerStatus === "Existing" && !form.installedBy) e.installedBy = "Select who installed";

    return e;
  }

  function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length === 0) {
      console.log("Submitted payload:", form);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }
  }

  const fieldVariants = {
    hidden: { opacity: 0, y: -6, height: 0 },
    show: { opacity: 1, y: 0, height: "auto" },
    exit: { opacity: 0, y: -6, height: 0 },
  };

  const isExisting = form.leadType === "Customer" && form.customerStatus === "Existing";
  const isLead = form.leadType === "Lead";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Lead / Customer Intake Form</h1>
          <p className="text-sm text-gray-500">Clean white design • Dynamic fields • Smooth animations</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white shadow-sm ring-1 ring-gray-200 rounded-2xl p-6 md:p-8">
          {/* Basic Details */}
          <SectionTitle title="Basic Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Customer Name" placeholder="Enter full name" value={form.customerName} onChange={(v) => update("customerName", v)} error={errors.customerName} />
            <TextField label="Company Name" placeholder="Optional" value={form.companyName} onChange={(v) => update("companyName", v)} />

            <TextField label="Phone Number" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(v) => update("phone", v)} error={errors.phone} />

            {/* WhatsApp with checkbox */}
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</span>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  className={`flex-1 rounded-xl border ${errors.whatsapp ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-400 transition p-3 text-gray-900 placeholder:text-gray-400`}
                  placeholder="e.g. +91 98765 43210"
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  disabled={form.sameAsPhone}
                />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={form.sameAsPhone}
                    onChange={(e) => update("sameAsPhone", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Same as Phone
                </label>
              </div>
              {errors.whatsapp && <span className="text-xs text-red-600 mt-1 inline-block">{errors.whatsapp}</span>}
            </label>

            <TextField label="Address" placeholder="House / Street / City" value={form.address} onChange={(v) => update("address", v)} />
          </div>

          {/* Lead / Customer */}
          <div className="mt-8">
            <SectionTitle title="Lead / Customer" subtle />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Select Type" value={form.leadType} onChange={(v) => update("leadType", v)} options={[{ value: "", label: "Choose..." }, { value: "Lead", label: "Lead" }, { value: "Customer", label: "Customer" }]} error={errors.leadType} />

              <AnimatePresence initial={false}>
                {form.leadType === "Customer" && (
                  <motion.div key="customerStatus" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }}>
                    <SelectField label="Customer Status" value={form.customerStatus} onChange={(v) => update("customerStatus", v)} options={[{ value: "", label: "Choose..." }, { value: "New", label: "New" }, { value: "Existing", label: "Existing" }]} error={errors.customerStatus} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Existing -> Installation Date */}
            <AnimatePresence initial={false}>
              {isExisting && (
                <motion.div key="installDate" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="mt-4 md:w-1/2">
                  <DateField label="Installation Date" value={form.installDate} onChange={(v) => update("installDate", v)} error={errors.installDate} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Project Type / Inquire For */}
          <div className="mt-8">
            <SectionTitle title={isLead ? "Inquire For" : "Project Type"} subtle />
            <div className="md:w-2/3">
              <SelectField label={isLead ? "Inquire For" : "Choose Service"} value={form.projectType} onChange={(v) => update("projectType", v)} options={[{ value: "", label: "Choose..." }, ...services]} error={errors.projectType} />
            </div>
          </div>

          {/* Installed By (only when Existing Customer) */}
          <AnimatePresence initial={false}>
            {isExisting && (
              <motion.div key="installedBy" variants={fieldVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="mt-4 md:w-2/3">
                <SelectField label="Installed By" value={form.installedBy} onChange={(v) => update("installedBy", v)} options={installedByOptions} error={errors.installedBy} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remarks */}
          <div className="mt-8">
            <SectionTitle title="Remarks" subtle />
            <textarea className="w-full rounded-xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-400 transition p-3 text-gray-900 placeholder:text-gray-400 min-h-[110px]" placeholder="Add any notes or special instructions..." value={form.remarks} onChange={(e) => update("remarks", e.target.value)} />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button type="submit" className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white px-5 py-3 text-sm font-medium shadow-sm hover:opacity-95 active:opacity-90 focus:outline-none focus:ring-4 focus:ring-gray-200 transition">Submit</button>
            <button type="button" onClick={() => { setForm({ customerName: "", companyName: "", phone: "", whatsapp: "", sameAsPhone: false, address: "", leadType: "", customerStatus: "", installDate: "", projectType: "", installedBy: "", remarks: "" }); setErrors({}); }} className="inline-flex items-center justify-center rounded-xl bg-white text-gray-700 px-5 py-3 text-sm font-medium shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition">Reset</button>
          </div>
        </form>

        <AnimatePresence>
          {submitted && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.25 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-gray-900 shadow-lg ring-1 ring-gray-200 px-4 py-3 rounded-xl">Form submitted successfully ✅</motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtle }) {
  return (
    <div className="mb-3">
      <h2 className={`text-sm font-medium ${subtle ? "text-gray-500" : "text-gray-800"}`}>{title}</h2>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, error }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <input type="text" className={`w-full rounded-xl border ${error ? "border-red-400" : "border-gray-300"} focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-400 transition p-3 text-gray-900 placeholder:text-gray-400`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, error }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <select className={`w-full rounded-xl border ${error ? "border-red-400" : "border-gray-300"} bg-white focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-400 transition p-3 text-gray-900`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}

function DateField({ label, value, onChange, error }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <input type="date" className={`w-full rounded-xl border ${error ? "border-red-400" : "border-gray-300"} bg-white focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-gray-400 transition p-3 text-gray-900`} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <span className="text-xs text-red-600 mt-1 inline-block">{error}</span>}
    </label>
  );
}
