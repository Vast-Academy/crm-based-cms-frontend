import React, { useState, useRef } from 'react';
import { Eye, Printer, Download, ArrowLeft, FileText, Calendar, DollarSign, Clock } from 'lucide-react';

const BillManagementSystem = () => {
  const [currentView, setCurrentView] = useState('summary');
  const [selectedBill, setSelectedBill] = useState(null);
  const printRef = useRef();

  // Sample bill data
  const bills = [
    {
      id: 'INV-2024-001',
      customerName: 'John Doe',
      customerAddress: '123 Main Street, New York, NY 10001',
      customerPhone: '+1 (555) 123-4567',
      customerEmail: 'john.doe@email.com',
      date: '2024-09-15',
      dueDate: '2024-10-15',
      items: [
        { name: 'Laptop Computer', quantity: 1, price: 999.99, discount: 50 },
        { name: 'Wireless Mouse', quantity: 2, price: 29.99, discount: 5 },
        { name: 'USB Cable', quantity: 3, price: 12.99, discount: 0 }
      ],
      paid: 850,
      tax: 89.25,
      status: 'Partially Paid'
    },
    {
      id: 'INV-2024-002',
      customerName: 'Jane Smith',
      customerAddress: '456 Oak Avenue, Los Angeles, CA 90210',
      customerPhone: '+1 (555) 987-6543',
      customerEmail: 'jane.smith@email.com',
      date: '2024-09-14',
      dueDate: '2024-10-14',
      items: [
        { name: 'Office Chair', quantity: 2, price: 199.99, discount: 20 },
        { name: 'Desk Lamp', quantity: 1, price: 79.99, discount: 10 }
      ],
      paid: 449.97,
      tax: 35.60,
      status: 'Paid'
    },
    {
      id: 'INV-2024-003',
      customerName: 'Bob Johnson',
      customerAddress: '789 Pine Road, Chicago, IL 60601',
      customerPhone: '+1 (555) 246-8135',
      customerEmail: 'bob.johnson@email.com',
      date: '2024-09-13',
      dueDate: '2024-10-13',
      items: [
        { name: 'Monitor', quantity: 1, price: 299.99, discount: 0 },
        { name: 'Keyboard', quantity: 1, price: 89.99, discount: 15 },
        { name: 'Headphones', quantity: 1, price: 149.99, discount: 25 }
      ],
      paid: 0,
      tax: 42.98,
      status: 'Pending'
    }
  ];

  const calculateBillTotals = (bill) => {
    const subtotal = bill.items.reduce((sum, item) => {
      const itemTotal = (item.quantity * item.price) - item.discount;
      return sum + itemTotal;
    }, 0);
    
    const total = subtotal + bill.tax;
    const pending = total - bill.paid;
    
    return { subtotal, total, pending };
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
    setCurrentView('detail');
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const WinPrint = window.open('', '', 'width=900,height=650');
    WinPrint.document.write(`
      <html>
        <head>
          <title>Invoice ${selectedBill.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .print-content { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .bill-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .invoice-details { width: 45%; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #374151; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .final-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  const handleDownloadPDF = async () => {
    // Create a simplified HTML version for PDF generation
    const billTotals = calculateBillTotals(selectedBill);
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Your Company Name</h1>
          <p>123 Business Street, City, State 12345</p>
          <p>Phone: (555) 000-0000 | Email: info@company.com</p>
        </div>
        
        <h2 style="text-align: center; margin-bottom: 30px;">INVOICE</h2>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3>Bill To:</h3>
            <p><strong>${selectedBill.customerName}</strong></p>
            <p>${selectedBill.customerAddress}</p>
            <p>${selectedBill.customerPhone}</p>
            <p>${selectedBill.customerEmail}</p>
          </div>
          <div>
            <p><strong>Invoice #:</strong> ${selectedBill.id}</p>
            <p><strong>Date:</strong> ${selectedBill.date}</p>
            <p><strong>Due Date:</strong> ${selectedBill.dueDate}</p>
            <p><strong>Status:</strong> ${selectedBill.status}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 12px; border-bottom: 1px solid #ddd;">Item</th>
              <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">Qty</th>
              <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Price</th>
              <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Discount</th>
              <th style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${selectedBill.items.map(item => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">$${item.discount.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">$${((item.quantity * item.price) - item.discount).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 30px; text-align: right;">
          <p><strong>Subtotal: $${billTotals.subtotal.toFixed(2)}</strong></p>
          <p><strong>Tax: $${selectedBill.tax.toFixed(2)}</strong></p>
          <p style="font-size: 18px; border-top: 2px solid #333; padding-top: 10px;"><strong>Total: $${billTotals.total.toFixed(2)}</strong></p>
          <p><strong>Paid: $${selectedBill.paid.toFixed(2)}</strong></p>
          <p style="color: ${billTotals.pending > 0 ? '#dc2626' : '#16a34a'};"><strong>Pending: $${billTotals.pending.toFixed(2)}</strong></p>
        </div>
      </div>
    `;

    // Create a blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${selectedBill.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Invoice downloaded as HTML file. You can open it in a browser and print to PDF.');
  };

  if (currentView === 'detail' && selectedBill) {
    const billTotals = calculateBillTotals(selectedBill);
    
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Actions */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setCurrentView('summary')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Summary
            </button>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer size={20} />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Download PDF
              </button>
            </div>
          </div>

          {/* Bill Detail */}
          <div ref={printRef} className="print-content bg-white rounded-lg shadow-lg p-8">
            {/* Company Header */}
            <div className="header text-center mb-8 border-b-2 border-gray-800 pb-6">
              <h1 className="company-name text-3xl font-bold text-blue-600 mb-2">Your Company Name</h1>
              <p className="text-gray-600">123 Business Street, City, State 12345</p>
              <p className="text-gray-600">Phone: (555) 000-0000 | Email: info@company.com</p>
            </div>

            <h2 className="invoice-title text-2xl font-bold text-center mb-8">INVOICE</h2>

            {/* Bill Info */}
            <div className="bill-info flex justify-between mb-8">
              <div className="customer-info">
                <h3 className="section-title text-lg font-semibold text-gray-700 mb-3">Bill To:</h3>
                <p className="font-semibold text-lg">{selectedBill.customerName}</p>
                <p className="text-gray-600">{selectedBill.customerAddress}</p>
                <p className="text-gray-600">{selectedBill.customerPhone}</p>
                <p className="text-gray-600">{selectedBill.customerEmail}</p>
              </div>
              <div className="invoice-details text-right">
                <p className="mb-2"><span className="font-semibold">Invoice #:</span> {selectedBill.id}</p>
                <p className="mb-2"><span className="font-semibold">Date:</span> {selectedBill.date}</p>
                <p className="mb-2"><span className="font-semibold">Due Date:</span> {selectedBill.dueDate}</p>
                <p className="mb-2">
                  <span className="font-semibold">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    selectedBill.status === 'Paid' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedBill.status === 'Partially Paid'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedBill.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border-b border-gray-300 font-semibold">Item</th>
                  <th className="text-center p-3 border-b border-gray-300 font-semibold">Qty</th>
                  <th className="text-right p-3 border-b border-gray-300 font-semibold">Price</th>
                  <th className="text-right p-3 border-b border-gray-300 font-semibold">Discount</th>
                  <th className="text-right p-3 border-b border-gray-300 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3">{item.name}</td>
                    <td className="text-center p-3">{item.quantity}</td>
                    <td className="text-right p-3">${item.price.toFixed(2)}</td>
                    <td className="text-right p-3">${item.discount.toFixed(2)}</td>
                    <td className="text-right p-3">${((item.quantity * item.price) - item.discount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals text-right max-w-sm ml-auto">
              <div className="total-row flex justify-between py-2">
                <span className="font-semibold">Subtotal:</span>
                <span>${billTotals.subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row flex justify-between py-2">
                <span className="font-semibold">Tax:</span>
                <span>${selectedBill.tax.toFixed(2)}</span>
              </div>
              <div className="final-total flex justify-between py-3 border-t-2 border-gray-800 text-lg font-bold">
                <span>Total:</span>
                <span>${billTotals.total.toFixed(2)}</span>
              </div>
              <div className="total-row flex justify-between py-2">
                <span className="font-semibold">Paid:</span>
                <span className="text-green-600">${selectedBill.paid.toFixed(2)}</span>
              </div>
              <div className="total-row flex justify-between py-2">
                <span className="font-semibold">Pending:</span>
                <span className={billTotals.pending > 0 ? 'text-red-600' : 'text-green-600'}>
                  ${billTotals.pending.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Summary View
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bill Management System</h1>
          <p className="text-gray-600">Manage and view all your invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900">{bills.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Bills</p>
                <p className="text-3xl font-bold text-green-600">
                  {bills.filter(bill => bill.status === 'Paid').length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                <p className="text-3xl font-bold text-red-600">
                  {bills.filter(bill => bill.status === 'Pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${bills.reduce((sum, bill) => sum + calculateBillTotals(bill).total, 0).toFixed(2)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Bills</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-700">Total</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-700">Paid</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-700">Pending</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => {
                  const totals = calculateBillTotals(bill);
                  return (
                    <tr key={bill.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-blue-600">{bill.id}</td>
                      <td className="py-4 px-6">{bill.customerName}</td>
                      <td className="py-4 px-6">{bill.date}</td>
                      <td className="py-4 px-6 text-right font-semibold">${totals.total.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right text-green-600 font-semibold">${bill.paid.toFixed(2)}</td>
                      <td className={`py-4 px-6 text-right font-semibold ${
                        totals.pending > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${totals.pending.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.status === 'Paid' 
                            ? 'bg-green-100 text-green-800' 
                            : bill.status === 'Partially Paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleViewBill(bill)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillManagementSystem;