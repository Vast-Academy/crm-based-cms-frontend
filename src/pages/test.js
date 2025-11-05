import React from 'react';
import { Home, Users, Wrench, Package, Settings, DollarSign, TrendingUp, AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';

const branches = [
  {
    id: 1,
    name: 'Amritsar Branch Office',
    engineers: 3,
    expenses: 1250000,
    avgCollectionDays: 26,
  },
  {
    id: 2,
    name: 'Delhi Branch Office',
    engineers: 2,
    expenses: 1500000,
    avgCollectionDays: 21,
  },
  {
    id: 3,
    name: 'Mumbai Branch Office',
    engineers: 2,
    expenses: 1900000,
    avgCollectionDays: 17,
  },
];

const customerBalances = [
  {
    id: 'AM-C01',
    branchId: 1,
    branchName: 'Amritsar Branch Office',
    name: 'City Hospital',
    billed: 600000,
    collected: 600000,
    status: 'Settled',
    statusClasses: 'bg-green-100 text-green-700',
  },
  {
    id: 'AM-C02',
    branchId: 1,
    branchName: 'Amritsar Branch Office',
    name: 'Star Diagnostics',
    billed: 680000,
    collected: 480000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'AM-C03',
    branchId: 1,
    branchName: 'Amritsar Branch Office',
    name: 'Sunrise Clinics',
    billed: 550000,
    collected: 390000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'AM-C04',
    branchId: 1,
    branchName: 'Amritsar Branch Office',
    name: 'Maple Pharma',
    billed: 500000,
    collected: 260000,
    status: 'High Balance',
    statusClasses: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'AM-C05',
    branchId: 1,
    branchName: 'Amritsar Branch Office',
    name: 'North Labs',
    billed: 450000,
    collected: 0,
    status: 'Awaiting Payment',
    statusClasses: 'bg-red-100 text-red-700',
  },
  {
    id: 'DL-C01',
    branchId: 2,
    branchName: 'Delhi Branch Office',
    name: 'Global Hospitals',
    billed: 820000,
    collected: 700000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'DL-C02',
    branchId: 2,
    branchName: 'Delhi Branch Office',
    name: 'Nexus Labs',
    billed: 600000,
    collected: 420000,
    status: 'High Balance',
    statusClasses: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'DL-C03',
    branchId: 2,
    branchName: 'Delhi Branch Office',
    name: 'Premier Clinics',
    billed: 760000,
    collected: 680000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'DL-C04',
    branchId: 2,
    branchName: 'Delhi Branch Office',
    name: 'Sunrise Enterprises',
    billed: 540000,
    collected: 540000,
    status: 'Settled',
    statusClasses: 'bg-green-100 text-green-700',
  },
  {
    id: 'DL-C05',
    branchId: 2,
    branchName: 'Delhi Branch Office',
    name: 'Trident Pharma',
    billed: 480000,
    collected: 360000,
    status: 'High Balance',
    statusClasses: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'MB-C01',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Metro Hospitals',
    billed: 780000,
    collected: 660000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'MB-C02',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Skyline Diagnostics',
    billed: 690000,
    collected: 690000,
    status: 'Settled',
    statusClasses: 'bg-green-100 text-green-700',
  },
  {
    id: 'MB-C03',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Coastal Labs',
    billed: 640000,
    collected: 500000,
    status: 'Partial Balance',
    statusClasses: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'MB-C04',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Apex Pharma',
    billed: 560000,
    collected: 430000,
    status: 'High Balance',
    statusClasses: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'MB-C05',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Horizon Clinics',
    billed: 720000,
    collected: 720000,
    status: 'Settled',
    statusClasses: 'bg-green-100 text-green-700',
  },
  {
    id: 'MB-C06',
    branchId: 3,
    branchName: 'Mumbai Branch Office',
    name: 'Vertex Industries',
    billed: 760000,
    collected: 480000,
    status: 'High Balance',
    statusClasses: 'bg-orange-100 text-orange-700',
  },
];

export default function ERPDashboard() {
  const branchSummaries = branches.map((branch) => {
    const branchCustomers = customerBalances.filter((customer) => customer.branchId === branch.id);
    const billed = branchCustomers.reduce((sum, customer) => sum + customer.billed, 0);
    const collected = branchCustomers.reduce((sum, customer) => sum + customer.collected, 0);
    const outstanding = billed - collected;
    const netProfit = collected - branch.expenses;
    const collectionRate = billed ? Number(((collected / billed) * 100).toFixed(1)) : 0;
    const settledCustomers = branchCustomers.filter((customer) => customer.status === 'Settled').length;
    const customersWithOutstanding = branchCustomers.length - settledCustomers;

    return {
      ...branch,
      customers: branchCustomers.length,
      billed,
      collected,
      outstanding,
      netProfit,
      collectionRate,
      settledCustomers,
      customersWithOutstanding,
    };
  });

  const totalBilled = branchSummaries.reduce((sum, branch) => sum + branch.billed, 0);
  const totalCollected = branchSummaries.reduce((sum, branch) => sum + branch.collected, 0);
  const totalOutstanding = branchSummaries.reduce((sum, branch) => sum + branch.outstanding, 0);
  const totalExpenses = branchSummaries.reduce((sum, branch) => sum + branch.expenses, 0);
  const totalProfit = branchSummaries.reduce((sum, branch) => sum + branch.netProfit, 0);
  const overallCollectionRate = totalBilled ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0.0';
  const totalCustomers = branchSummaries.reduce((sum, branch) => sum + branch.customers, 0);
  const settledCustomers = branchSummaries.reduce((sum, branch) => sum + branch.settledCustomers, 0);
  const customersWithOutstanding = totalCustomers - settledCustomers;
  const averageCollectionTime = branchSummaries.length
    ? Math.round(branchSummaries.reduce((sum, branch) => sum + branch.avgCollectionDays, 0) / branchSummaries.length)
    : 0;

  const customerRows = [...customerBalances].sort(
    (a, b) => (b.billed - b.collected) - (a.billed - a.collected)
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const collectionBadgeClass = (rate) => {
    if (rate >= 80) return 'bg-green-100 text-green-700';
    if (rate >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-56 bg-slate-800 text-white">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">CMS Panel</h1>
        </div>
        <nav className="p-4">
          <div className="mb-2 px-4 py-3 bg-blue-600 rounded flex items-center gap-3">
            <Home size={20} />
            <span>Dashboard</span>
          </div>
          <div className="mb-2 px-4 py-3 hover:bg-slate-700 rounded flex items-center gap-3 cursor-pointer">
            <Package size={20} />
            <span>Branches</span>
          </div>
          <div className="mb-2 px-4 py-3 hover:bg-slate-700 rounded flex items-center gap-3 cursor-pointer">
            <Users size={20} />
            <span>Managers</span>
          </div>
          <div className="mb-2 px-4 py-3 hover:bg-slate-700 rounded flex items-center gap-3 cursor-pointer">
            <Wrench size={20} />
            <span>Engineers</span>
          </div>
          <div className="mb-2 px-4 py-3 hover:bg-slate-700 rounded flex items-center gap-3 cursor-pointer">
            <Package size={20} />
            <span>Inventory</span>
          </div>
          <div className="mb-2 px-4 py-3 hover:bg-slate-700 rounded flex items-center gap-3 cursor-pointer">
            <Settings size={20} />
            <span>Services</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-500 text-sm">Welcome back to your ERP dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <RefreshCw size={16} />
              Mark Update Available
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">A</span>
              </div>
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Billed Amount</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalBilled)}</p>
                </div>
                <DollarSign size={40} className="text-blue-200" />
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span>Across {totalCustomers} customer accounts</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-100 text-sm mb-1">Amount Collected</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalCollected)}</p>
                </div>
                <CheckCircle size={40} className="text-green-200" />
              </div>
              <div className="flex items-center gap-2 text-sm text-green-100">
                <TrendingUp size={16} />
                <span>{overallCollectionRate}% overall collection</span>
              </div>
              <div className="text-sm text-green-100 mt-1">
                Settled for {settledCustomers} customers
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">Outstanding Amount</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalOutstanding)}</p>
                </div>
                <Clock size={40} className="text-orange-200" />
              </div>
              <div className="text-sm text-orange-100">
                Due from {customersWithOutstanding} customers
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-red-100 text-sm mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <AlertCircle size={40} className="text-red-200" />
              </div>
              <div className="text-sm text-red-100">
                Operational costs
              </div>
            </div>
          </div>

          {/* Net Profit & Collection Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Net Profit (After Collection)</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalProfit)}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Profit Margin: {totalCollected ? ((totalProfit / totalCollected) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Customer Accounts Summary</p>
                  <p className="text-3xl font-bold text-indigo-600">{totalCustomers}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Settled: {settledCustomers} | Pending Balance: {customersWithOutstanding}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Users size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Average Collection Time</p>
                  <p className="text-3xl font-bold text-teal-600">
                    {averageCollectionTime} days
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Payment cycle duration
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Clock size={24} className="text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Branch Financial Details Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Branch-wise Customer Balance Snapshot</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">Branch</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Billed</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Collected</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Outstanding</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Expenses</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-700">Net Profit</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700">Collection %</th>
                  </tr>
                </thead>
                <tbody>
                  {branchSummaries.map((branch) => (
                    <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-800">{branch.name}</div>
                          <div className="text-sm text-gray-500">
                            {branch.engineers} Engineers | {branch.customers} Customers
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-blue-600 font-semibold">{formatCurrency(branch.billed)}</div>
                        <div className="text-xs text-gray-500">Across {branch.customers} accounts</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-green-600 font-semibold">{formatCurrency(branch.collected)}</div>
                        <div className="text-xs text-gray-500">Settled for {branch.settledCustomers} customers</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-orange-600 font-semibold">{formatCurrency(branch.outstanding)}</div>
                        <div className="text-xs text-gray-500">Pending with {branch.customersWithOutstanding} customers</div>
                      </td>
                      <td className="py-4 px-4 text-right text-red-600 font-semibold">
                        {formatCurrency(branch.expenses)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="text-purple-600 font-semibold">{formatCurrency(branch.netProfit)}</div>
                        <div className="text-xs text-gray-500">
                          {branch.collected ? ((branch.netProfit / branch.collected) * 100).toFixed(1) : '0.0'}% margin
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${collectionBadgeClass(branch.collectionRate)}`}>
                          {branch.collectionRate}%
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {branch.avgCollectionDays} days avg
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="py-4 px-4 text-gray-800">Total</td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-blue-600">{formatCurrency(totalBilled)}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        {totalCustomers} customers
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-green-600">{formatCurrency(totalCollected)}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        Settled: {settledCustomers}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-orange-600">{formatCurrency(totalOutstanding)}</div>
                      <div className="text-xs text-gray-500 font-normal">
                        Pending: {customersWithOutstanding}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-red-600">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td className="py-4 px-4 text-right text-purple-600">
                      {formatCurrency(totalProfit)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${collectionBadgeClass(Number(overallCollectionRate))}`}>
                        {overallCollectionRate}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Balance Overview */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Customer Balance Overview</h3>
                <p className="text-sm text-gray-500">
                  Monthly billing versus collection by customer
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Showing {customerBalances.length} customers
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Billed This Month</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Collected</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Outstanding</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerRows.map((customer) => {
                    const outstanding = customer.billed - customer.collected;
                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-800">{customer.name}</div>
                          <div className="text-xs text-gray-500">Customer ID: {customer.id}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{customer.branchName}</td>
                        <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                          {formatCurrency(customer.billed)}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 font-semibold">
                          {formatCurrency(customer.collected)}
                        </td>
                        <td className="py-3 px-4 text-right text-orange-600 font-semibold">
                          {formatCurrency(outstanding)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${customer.statusClasses}`}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Collection Performance Visualization */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Branch Collection Performance</h3>
            <div className="space-y-6">
              {branchSummaries.map((branch) => {
                const collectedPercent = branch.billed ? (branch.collected / branch.billed) * 100 : 0;
                const outstandingPercent = branch.billed ? (branch.outstanding / branch.billed) * 100 : 0;

                return (
                  <div key={branch.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{branch.name}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600 font-semibold">
                          Collected {formatCurrency(branch.collected)}
                        </span>
                        <span className="text-orange-600 font-semibold">
                          Outstanding {formatCurrency(branch.outstanding)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-6 flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${collectedPercent}%` }}
                      >
                        {collectedPercent > 12 && `${collectedPercent.toFixed(0)}% Collected`}
                      </div>
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-6 flex items-center justify-center text-white text-xs font-semibold"
                        style={{ width: `${outstandingPercent}%` }}
                      >
                        {outstandingPercent > 12 && `${outstandingPercent.toFixed(0)}% Outstanding`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Original Stats Grid */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-sm mb-1">Total Engineers</p>
                  <p className="text-4xl font-bold">
                    {branchSummaries.reduce((sum, branch) => sum + branch.engineers, 0)}
                  </p>
                </div>
                <Users size={40} className="text-indigo-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Inventory Items</p>
                  <p className="text-4xl font-bold">330</p>
                </div>
                <Package size={40} className="text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-emerald-100 text-sm mb-1">Total Customers</p>
                  <p className="text-4xl font-bold">{totalCustomers}</p>
                </div>
                <Users size={40} className="text-emerald-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-pink-100 text-sm mb-1">Pending Approvals</p>
                  <p className="text-4xl font-bold">10</p>
                </div>
                <AlertCircle size={40} className="text-pink-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
