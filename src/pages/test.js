import React, { useMemo, useState } from "react";

// Mobile Bill Generation Prototype – React + Tailwind
// Focus: Presentation ready heavy UI, mobile first. Products search and separate Services picker. Cart with totals.
// No external data or APIs. Everything mocked. Minimal logic for demo.

// ----------------------------- Helpers -----------------------------
const currency = (n) => `₹${n.toFixed(2)}`;

const Icon = ({ name, className = "w-5 h-5" }) => {
  // Minimal inline icon set to avoid extra deps
  switch (name) {
    case "cube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12l8.73-5.04"/><path d="M12 22V12"/></svg>
      );
    case "wrench":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a4 4 0 1 0-5.66 5.66l7.07 7.07a2 2 0 0 0 2.83-2.83z"/><path d="m5 11 7 7"/></svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      );
    case "trash":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      );
    case "minus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
      );
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
      );
    case "receipt":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3v18l2-1 2 1 2-1 2 1 2-1 2 1 2-1V3z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h6"/></svg>
      );
    case "tag":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41 12 22l-7.59-7.59A2 2 0 0 1 4 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.41.59l6.18 6.18a2 2 0 0 1 0 2.83Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>
      );
    default:
      return null;
  }
};

// ----------------------------- Seed Data -----------------------------
const SEED_PRODUCTS = [
  { id: "p1", name: "Laptop Stand", code: "LS 101", price: 899 },
  { id: "p2", name: "Wireless Mouse", code: "WM 220", price: 1299 },
  { id: "p3", name: "Mechanical Keyboard", code: "KB 330", price: 1799 },
  { id: "p4", name: "USB C Hub", code: "UH 404", price: 1499 },
  { id: "p5", name: "Webcam Full HD", code: "WC 550", price: 2199 },
];

const SEED_SERVICE_CATEGORIES = [
  {
    id: "sgrp1",
    title: "Setup and Installation",
    items: [
      { id: "s1", name: "Installation", description: "Device setup and configuration", price: 499 },
      { id: "s2", name: "Data Migration", description: "Move data to new system", price: 1499 },
    ],
  },
  {
    id: "sgrp2",
    title: "Support and Visit",
    items: [
      { id: "s3", name: "On Site Visit", description: "Per hour visit", price: 799, unit: "hour" },
      { id: "s4", name: "Remote Support", description: "One session support", price: 399 },
    ],
  },
];

// ----------------------------- Main Component -----------------------------
export default function MobileBillPrototype() {
  const [tab, setTab] = useState("products"); // products | services | cart
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]); // {id, refId, kind, name, unitPrice, qty, unit}
  const [globalTax, setGlobalTax] = useState(0.18); // 18 percent
  const [discount, setDiscount] = useState({ type: "percent", value: 0 });
  const [showDiscount, setShowDiscount] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEED_PRODUCTS;
    return SEED_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [query]);

  const addProduct = (p) => {
    const newLine = {
      id: `${p.id}-${Date.now()}`,
      refId: p.id,
      kind: "product",
      name: `${p.name} • ${p.code}`,
      unitPrice: p.price,
      qty: 1,
      unit: "unit",
    };
    setItems((prev) => [...prev, newLine]);
  };

  const addService = (s) => {
    const newLine = {
      id: `${s.id}-${Date.now()}`,
      refId: s.id,
      kind: "service",
      name: s.name,
      unitPrice: s.price,
      qty: 1,
      unit: s.unit || "unit",
    };
    setItems((prev) => [...prev, newLine]);
  };

  const changeQty = (lineId, delta) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === lineId ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const removeLine = (lineId) => setItems((prev) => prev.filter((it) => it.id !== lineId));

  const subtotal = useMemo(() => items.reduce((s, it) => s + it.unitPrice * it.qty, 0), [items]);
  const discountAmount = useMemo(() => {
    if (!discount || discount.value <= 0) return 0;
    return discount.type === "percent" ? (subtotal * discount.value) / 100 : Math.min(discount.value, subtotal);
  }, [discount, subtotal]);
  const taxAmount = useMemo(() => (subtotal - discountAmount) * globalTax, [subtotal, discountAmount, globalTax]);
  const total = useMemo(() => Math.max(0, subtotal - discountAmount + taxAmount), [subtotal, discountAmount, taxAmount]);

  const TabBtn = ({ id, label, icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition shadow-sm border ${
        tab === id
          ? "bg-white/15 border-white/20 text-white shadow-md"
          : "bg-white/5 border-white/10 text-white/80"
      }`}
    >
      <Icon name={icon} className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-900 to-black text-white selection:bg-white/20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-black/40 border-b border-white/10">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 grid place-items-center shadow">
              <Icon name="receipt" className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm text-white/70">Bill Studio</div>
              <div className="text-base font-semibold">Create New Bill</div>
            </div>
          </div>
          <button
            onClick={() => setShowCustomer(true)}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 shadow"
          >
            <div className="flex items-center gap-2">
              <Icon name="user" className="w-4 h-4" />
              <span className="text-sm">Customer</span>
            </div>
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-md px-4 pb-3">
          <div className="flex gap-2">
            <TabBtn id="products" label="Products" icon="cube" />
            <TabBtn id="services" label="Services" icon="wrench" />
            <TabBtn id="cart" label="Cart" icon="receipt" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 pt-4 pb-40">
        {tab === "products" && (
          <section className="space-y-4">
            {/* Search */}
            <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Icon name="search" className="w-5 h-5 text-white/60" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or code"
                  className="w-full bg-transparent outline-none placeholder-white/50 text-sm"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 shadow-md hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center border border-white/15">
                        <Icon name="cube" className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="text-xs text-white/60">Code {p.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{currency(p.price)}</div>
                      <button
                        onClick={() => addProduct(p)}
                        className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/20 border border-white/15 text-xs"
                      >
                        <Icon name="plus" className="w-4 h-4" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="text-center text-white/60 text-sm py-10">No results. Try different words.</div>
              )}
            </div>
          </section>
        )}

        {tab === "services" && (
          <section className="space-y-4">
            {SEED_SERVICE_CATEGORIES.map((grp) => (
              <div key={grp.id} className="space-y-2">
                <div className="text-sm font-semibold text-white/80 px-1">{grp.title}</div>
                {grp.items.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 shadow-md hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center border border-white/15">
                          <Icon name="wrench" className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-white/60 line-clamp-1">{s.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{currency(s.price)}</div>
                        <button
                          onClick={() => addService(s)}
                          className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/20 border border-white/15 text-xs"
                        >
                          <Icon name="plus" className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {tab === "cart" && (
          <section className="space-y-3">
            {items.length === 0 && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center text-white/70">
                Start adding products or services to see them here.
              </div>
            )}

            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-3 shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center border border-white/15">
                      <Icon name={it.kind === "product" ? "cube" : "wrench"} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {it.name} <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/15 ml-1">{it.kind}</span>
                      </div>
                      <div className="text-xs text-white/60">{currency(it.unitPrice)} per {it.unit}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeQty(it.id, -1)}
                      className="p-2 rounded-lg bg-white/10 border border-white/15"
                      title="Decrease"
                    >
                      <Icon name="minus" className="w-4 h-4" />
                    </button>
                    <div className="w-8 text-center text-sm font-semibold">{it.qty}</div>
                    <button
                      onClick={() => changeQty(it.id, 1)}
                      className="p-2 rounded-lg bg-white/10 border border-white/15"
                      title="Increase"
                    >
                      <Icon name="plus" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeLine(it.id)}
                      className="p-2 rounded-lg bg-white/10 border border-white/15 ml-1"
                      title="Remove"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-right text-sm font-semibold">{currency(it.unitPrice * it.qty)}</div>
              </div>
            ))}

            {/* Controls for discount and tax */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Global tax</span>
                <select
                  value={globalTax}
                  onChange={(e) => setGlobalTax(parseFloat(e.target.value))}
                  className="bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-white text-sm"
                >
                  <option value={0}>0 percent</option>
                  <option value={0.05}>5 percent</option>
                  <option value={0.12}>12 percent</option>
                  <option value={0.18}>18 percent</option>
                  <option value={0.28}>28 percent</option>
                </select>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Discount</span>
                <button
                  onClick={() => setShowDiscount(true)}
                  className="px-2 py-1 rounded-lg bg-white/10 border border-white/15 text-xs"
                >
                  {discount.value > 0 ? `${discount.value}${discount.type === "percent" ? "%" : ""}` : "Set"}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Sticky Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="mx-auto max-w-md px-4 pb-4">
          <div className="rounded-2xl bg-black/70 backdrop-blur border border-white/15 shadow-2xl p-3">
            <div className="flex items-end justify-between text-sm">
              <div className="space-y-1 text-white/80">
                <div className="flex justify-between gap-6"><span>Subtotal</span><span className="font-semibold">{currency(subtotal)}</span></div>
                <div className="flex justify-between gap-6"><span>Discount</span><span className="font-semibold">{currency(discountAmount)}</span></div>
                <div className="flex justify-between gap-6"><span>Tax</span><span className="font-semibold">{currency(taxAmount)}</span></div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/70">Total</div>
                <div className="text-2xl font-bold">{currency(total)}</div>
                <div className="text-[10px] text-white/60 mt-1">Customer {customer.name || "not set"}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={() => setShowCustomer(true)} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/15 text-xs font-medium flex items-center justify-center gap-2"><Icon name="user" className="w-4 h-4"/>Customer</button>
              <button onClick={() => setShowDiscount(true)} className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 border border-white/15 text-xs font-medium flex items-center justify-center gap-2"><Icon name="tag" className="w-4 h-4"/>Discount</button>
              <button onClick={() => setTab("cart")} className="px-3 py-2 rounded-xl bg-white text-black font-semibold shadow-lg active:scale-95">Pay</button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Sheet */}
      {showCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md p-4">
            <div className="rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl p-4 space-y-3">
              <div className="text-sm font-semibold">Customer details</div>
              <input
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                placeholder="Name"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm outline-none"
              />
              <input
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => setShowCustomer(false)} className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm">Close</button>
                <button onClick={() => setShowCustomer(false)} className="px-3 py-2 rounded-xl bg-white text-black font-semibold text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Sheet */}
      {showDiscount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md p-4">
            <div className="rounded-2xl bg-zinc-900 border border-white/15 shadow-2xl p-4 space-y-3">
              <div className="text-sm font-semibold">Discount</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  className={`px-3 py-2 rounded-xl border ${discount.type === "percent" ? "bg-white text-black border-white" : "bg-white/10 border-white/15"}`}
                  onClick={() => setDiscount({ type: "percent", value: discount.type === "percent" ? discount.value : 0 })}
                >Percent</button>
                <button
                  className={`px-3 py-2 rounded-xl border ${discount.type === "amount" ? "bg-white text-black border-white" : "bg-white/10 border-white/15"}`}
                  onClick={() => setDiscount({ type: "amount", value: discount.type === "amount" ? discount.value : 0 })}
                >Amount</button>
              </div>
              <input
                type="number"
                value={discount.value}
                onChange={(e) => setDiscount((d) => ({ ...d, value: Math.max(0, Number(e.target.value || 0)) }))}
                placeholder={discount.type === "percent" ? "Percent" : "Amount"}
                className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button onClick={() => setShowDiscount(false)} className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-sm">Close</button>
                <button onClick={() => setShowDiscount(false)} className="px-3 py-2 rounded-xl bg-white text-black font-semibold text-sm">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
