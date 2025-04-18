import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';

const InvoiceGenerator = ({ bill, company, customer }) => {
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true); // Show the content while generating
    
    // Use setTimeout to allow the content to be rendered and visible
    setTimeout(() => {
      const element = document.getElementById('invoice-content');
      
      const opt = {
        margin: 10,
        filename: `Invoice-${bill.billNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().from(element).set(opt).save().then(() => {
        setGenerating(false); // Hide the content after generation
      });
    }, 100);
  };

  return (
    <div>
      <button 
      onClick={generatePDF}
      className="mt-2 px-3 py-1 bg-green-50 text-green-600 rounded border border-green-200 text-sm flex items-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
      Download Invoice
    </button>

      {/* Important: Use style display instead of className="hidden" */}
      <div id="invoice-content" style={{ display: generating ? 'block' : 'none', backgroundColor: 'white', padding: '20px' }}>
        <div className="invoice-container" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px', border: '1px solid #eee' }}>
          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', padding: '10px 0' }}>
            <div>
              <h1 style={{ margin: '0', fontSize: '24px' }}>BILL OF SUPPLY</h1>
              <span style={{ display: 'inline-block', padding: '2px 8px', border: '1px solid #ccc', fontSize: '12px' }}>ORIGINAL FOR RECIPIENT</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0', fontSize: '14px' }}>M.D. {company.ownerName || 'Company Owner'}</p>
            </div>
          </div>

          {/* Rest of the invoice content remains the same... */}
          {/* Company Info */}
          <div style={{ display: 'flex', padding: '10px 0', borderBottom: '2px solid #000' }}>
            {/* <div style={{ width: '100px', height: '100px', marginRight: '15px' }}>
              <div style={{ background: '#333', color: 'white', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '5px' }}>
                <div>
                  <span style={{ fontSize: '30px', fontWeight: 'bold' }}>{company.logo || 'VA'}</span>
                  <div style={{ fontSize: '12px' }}>COMPUTERS</div>
                </div>
              </div>
            </div> */}
            <div>
              <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{company.name || 'VA Computers'}</h2>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>{company.address || 'Company Address'}</p>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                <strong>Mobile:</strong> {company.mobile || 'N/A'} &nbsp;&nbsp;
                <strong>PAN Number:</strong> {company.panNumber || 'N/A'}
              </p>
              <p style={{ margin: '0', fontSize: '14px' }}>
                <strong>Email:</strong> {company.email || 'N/A'}
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#eee' }}>
            <div>
              <strong>Invoice No.:</strong> {bill.billNumber}
            </div>
            <div>
              <strong>Invoice Date:</strong> {new Date(bill.createdAt).toLocaleDateString('en-GB')}
            </div>
          </div>

          {/* Bill To Section */}
          <div style={{ padding: '10px 0', borderBottom: '1px solid #000' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>BILL TO</h3>
            <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>{customer.name}</p>
            <p style={{ margin: '0', fontSize: '14px' }}>Mobile: {customer.phoneNumber}</p>
          </div>

          {/* Services Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>SERVICES</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>QTY.</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>RATE</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {bill.items && bill.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    {item.name}
                    {item.serialNumber && <div style={{ fontSize: '12px', color: '#666' }}>S/N: {item.serialNumber}</div>}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{item.price}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>


          {/* Summary Section */}
          <div style={{ marginTop: '30px', borderTop: '1px solid #000', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ fontWeight: 'bold' }}>SUBTOTAL</div>
              <div style={{ textAlign: 'right' }}>-</div>
              <div style={{ width: '100px', textAlign: 'right' }}>₹ {bill.totalAmount}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>TAXABLE AMOUNT</div>
              <div style={{ width: '100px', textAlign: 'right' }}>₹ {bill.totalAmount}</div>
            </div>
            {bill.discount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ textAlign: 'right', flex: 1 }}>Discount</div>
                <div style={{ width: '100px', textAlign: 'right' }}>- ₹ {bill.discount}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>TOTAL AMOUNT</div>
              <div style={{ width: '100px', textAlign: 'right' }}>₹ {bill.totalAmount - (bill.discount || 0)}</div>
            </div>
            
            {/* Payment Method - NEW SECTION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>Payment Method</div>
              <div style={{ width: '100px', textAlign: 'right' }}>
                {bill.paymentMethod === 'online' ? 'Online Payment' : 
                 bill.paymentMethod === 'cash' ? 'Cash Payment' : 'Pending'}
              </div>
            </div>
            
            {/* Transaction ID - Show only for online payments */}
            {bill.paymentMethod === 'online' && bill.transactionId && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div style={{ textAlign: 'right', flex: 1 }}>Transaction ID</div>
                <div style={{ width: '200px', textAlign: 'right', overflowWrap: 'break-word' }}>{bill.transactionId}</div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>Received Amount</div>
              <div style={{ width: '100px', textAlign: 'right' }}>
                {bill.paymentStatus === 'paid' ? `₹ ${bill.totalAmount - (bill.discount || 0)}` : '₹ 0'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>Balance</div>
              <div style={{ width: '100px', textAlign: 'right' }}>
                {bill.paymentStatus === 'paid' ? '₹ 0' : `₹ ${bill.totalAmount - (bill.discount || 0)}`}
              </div>
            </div>
            
            {/* Amount in Words */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <div style={{ textAlign: 'right', flex: 1 }}>Total Amount (in words)</div>
              <div style={{ width: '400px', textAlign: 'right' }}>{numberToWords(bill.totalAmount - (bill.discount || 0))}</div>
            </div>
            
            {/* Payment Date - Show only if paid */}
            {bill.paymentStatus === 'paid' && bill.paidAt && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ textAlign: 'right', flex: 1 }}>Payment Date</div>
                <div style={{ width: '200px', textAlign: 'right' }}>{new Date(bill.paidAt).toLocaleDateString('en-GB')}</div>
              </div>
            )}
            
            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '50px' }}>
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '5px' }}>
                  <img src="/signature.png" alt="Signature" style={{ maxHeight: '60px', maxWidth: '150px' }} />
                </div>
                <div style={{ fontSize: '12px' }}>
                  AUTHORISED SIGNATORY FOR<br />
                  {company.name || 'VA Computers'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert number to words
function numberToWords(num) {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTens = (num) => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + single[num % 10] : '');
  };

  if (num === 0) return 'Zero Rupees';
  
  let words = '';
  
  if (Math.floor(num / 100000) > 0) {
    words += formatTens(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  if (Math.floor(num / 1000) > 0) {
    words += formatTens(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  if (Math.floor(num / 100) > 0) {
    words += single[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num > 0) {
    words += formatTens(num);
  }
  
  return words.trim() + ' Rupees';
}

export default InvoiceGenerator;