import { Phone, Mail, Building, Users, ClipboardList, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function ManagerDetailPage() {
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manager Details</h1>
        
        {/* Manager Profile Card with Branch Performance */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Left side - Manager details */}
            <div className="md:w-1/3">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-blue-500 text-white text-2xl font-bold rounded-full w-16 h-16 flex items-center justify-center">
                    R
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h2 className="text-xl font-bold">Rajesh Kumar</h2>
                  <p className="text-gray-600 flex items-center gap-1 text-sm">
                    <Building className="w-4 h-4" /> Manager at Amritsar Branch
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    Active
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h3>
                <p className="flex items-center gap-1 text-gray-700 text-sm mb-1">
                  <Mail className="w-4 h-4 text-gray-500" /> 
                  <span>Email: </span>
                  <a href="mailto:rajesh@example.com" className="text-blue-600 hover:underline">rajesh@example.com</a>
                </p>
                <p className="flex items-center gap-1 text-gray-700 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" /> 
                  <span>Phone: </span>
                  <a href="tel:9876543210" className="text-blue-600 hover:underline">9876543210</a>
                </p>
              </div>
            </div>
            
            {/* Right side - Branch Performance */}
            <div className="md:w-2/3">
              <h3 className="text-lg font-semibold mb-3">Branch Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-blue-600 text-xs font-medium mb-1">Team Size</div>
                  <div className="text-xl font-bold flex items-center">
                    <Users className="w-4 h-4 mr-1" /> 4
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-600 text-xs font-medium mb-1">Work Orders</div>
                  <div className="text-xl font-bold flex items-center">
                    <ClipboardList className="w-4 h-4 mr-1" /> 10
                  </div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-indigo-600 text-xs font-medium mb-1">Assigned</div>
                  <div className="text-xl font-bold flex items-center">
                    <ArrowRight className="w-4 h-4 mr-1" /> 12
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-yellow-600 text-xs font-medium mb-1">Pending Approval</div>
                  <div className="text-xl font-bold flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" /> 4
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-600 text-xs font-medium mb-1">Completed</div>
                  <div className="text-xl font-bold flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> 3
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-orange-600 text-xs font-medium mb-1">Transferring</div>
                  <div className="text-xl font-bold flex items-center">
                    <ArrowRight className="w-4 h-4 mr-1" /> 2
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-purple-600 text-xs font-medium mb-1">Transferred</div>
                  <div className="text-xl font-bold flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" /> 0
                  </div>
                </div>
                {/* Empty cell for grid balance */}
                <div className="invisible"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team Overview */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Team Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Progress
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Approval
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferring
                  </th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transferred
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900">Amrit Singh</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">0</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">0</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900">Sunita Verma</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">3</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">0</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="font-medium text-gray-900">Prakash Joshi</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">5</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">3</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">1</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">0</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">0</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">10</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">2</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">5</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">0</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">3</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Branch Summary */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3">Branch Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600 text-xs">Team Size</p>
              <p className="font-semibold">4 technicians</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600 text-xs">Work Orders</p>
              <p className="font-semibold">10</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600 text-xs">Completed Projects</p>
              <p className="font-semibold">125</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600 text-xs">Ongoing Projects</p>
              <p className="font-semibold">15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}