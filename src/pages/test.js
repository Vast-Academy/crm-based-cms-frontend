import React from 'react';

const DirectorSection = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50">
      {/* Main Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Message from the Principal</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Side - Director Image and Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1494790108755-2616c05e5892?w=250&h=300&fit=crop&crop=face" 
              alt="Principal"
              className="w-48 h-56 mx-auto rounded-lg object-cover mb-4"
            />
            <h3 className="text-xl font-bold text-gray-800">Dr. Minaxi Arora</h3>
            <p className="text-gray-600 font-medium">Principal</p>
          </div>
        </div>

        {/* Right Side - Message and Details */}
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-lg text-red-600 font-bold mb-2">"</p>
            <p className="text-gray-700 italic leading-relaxed">
              Welcome to Shree Lakshmi Narayan Ayurvedic College & Hospital. Our institution is dedicated to excellence in education and healthcare. We strive to provide our students with the best possible learning experience and prepare them for a successful career in Ayurveda.
            </p>
          </div>

          {/* Details */}
          <div className="bg-white p-6 rounded-lg shadow-md space-y-3">
            <div>
              <span className="font-semibold text-gray-700">Qualification:</span>
              <span className="text-gray-600 ml-2">BAMS, M.D. (Dravyaguna), Ph.D</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Unique Teacher Code:</span>
              <span className="text-gray-600 ml-2">AYDG00401</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Registration No.:</span>
              <span className="text-gray-600 ml-2">9975 (Punjab)</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Date of Birth:</span>
              <span className="text-gray-600 ml-2">September 26, 1974</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Date of Joining:</span>
              <span className="text-gray-600 ml-2">August 11, 2005</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Address:</span>
              <span className="text-gray-600 ml-2">F-7/126, Kashmir Avenue, Amritsar</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Phone:</span>
              <span className="text-gray-600 ml-2">7009670235, 6239764882</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Email:</span>
              <span className="text-red-600 ml-2">minaxim74@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorSection;