import React, { useState, useEffect } from 'react';
import { FiSmartphone, FiCopy, FiCheck, FiClock, FiRefreshCw } from 'react-icons/fi';

export default function QRCodeDisplay({ qrData, amount, onPaymentConfirmed, colors }) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [qrCodeImage, setQrCodeImage] = useState(null);

  // Generate QR code image on component mount
  useEffect(() => {
    generateQRCodeImage();
  }, [qrData]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const generateQRCodeImage = () => {
    // Create a simple QR code placeholder - in production, use proper QR code library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    // Simple QR code-like pattern
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    ctx.fillStyle = '#000000';
    const size = 10;
    for (let i = 0; i < 200; i += size) {
      for (let j = 0; j < 200; j += size) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, size, size);
        }
      }
    }
    
    // Add corner markers
    const markerSize = 30;
    ctx.fillStyle = '#000000';
    // Top-left
    ctx.fillRect(0, 0, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, markerSize-10, markerSize-10);
    
    // Top-right
    ctx.fillStyle = '#000000';
    ctx.fillRect(200-markerSize, 0, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200-markerSize+5, 5, markerSize-10, markerSize-10);
    
    // Bottom-left
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 200-markerSize, markerSize, markerSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 200-markerSize+5, markerSize-10, markerSize-10);
    
    setQrCodeImage(canvas.toDataURL());
  };

  const copyUPILink = async () => {
    try {
      await navigator.clipboard.writeText(qrData.upiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy UPI link:', err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Scan QR Code to Pay</h4>
        <p className="text-gray-600">Amount: ₹{amount}</p>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <FiClock size={16} />
        <span>Valid for: {formatTime(timeLeft)}</span>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-lg">
          {qrCodeImage ? (
            <img 
              src={qrCodeImage} 
              alt="Payment QR Code" 
              className="w-48 h-48"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FiRefreshCw className="mx-auto mb-2" size={24} />
                <p className="text-sm">Generating QR Code...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FiSmartphone className="text-blue-600 mt-1" size={20} />
          <div className="text-sm text-blue-800">
            <h5 className="font-semibold mb-2">How to Pay:</h5>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open your UPI app (PhonePe, GPay, Paytm, etc.)</li>
              <li>Scan the QR code shown above</li>
              <li>Verify the amount (₹{amount}) and merchant details</li>
              <li>Complete the payment</li>
              <li>Click "Payment Done" below once completed</li>
            </ol>
          </div>
        </div>
      </div>

      {/* UPI Link (Alternative) */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600 text-center">Or copy the UPI payment link:</p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={qrData.upiUrl}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-600"
          />
          <button
            onClick={copyUPILink}
            className={`px-4 py-2 ${colors.buttonLight} rounded-lg font-medium flex items-center space-x-2`}
          >
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />}
            <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Payment Status Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onPaymentConfirmed}
          className={`flex-1 py-3 ${colors.button} text-white rounded-lg font-medium flex items-center justify-center space-x-2`}
        >
          <FiCheck size={18} />
          <span>Payment Done</span>
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
        >
          <FiRefreshCw size={18} />
        </button>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800">
          <strong>Important:</strong> Only click "Payment Done" after successful payment completion. 
          Your payment will be verified and the bill will be updated accordingly.
        </p>
      </div>
    </div>
  );
}