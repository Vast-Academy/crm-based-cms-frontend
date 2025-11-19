import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCreditCard, FiArrowLeft, FiDatabase } from 'react-icons/fi';
import UserSettingsModal from './users/UserSettingsModal';
import BankAccountsSettings from '../components/settings/BankAccountsSettings';
import SoftwareBackupSettings from '../components/settings/SoftwareBackupSettings';

const SettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);

  // Set default active section when user loads
  useEffect(() => {
    if (user?.role === 'admin' && !activeSection) {
      setActiveSection('bank-accounts'); // Admin ke liye Bank Accounts by default
    }
  }, [user, activeSection]);

  const handleUserInfoClick = () => {
    setActiveSection('user-info');
    setShowUserSettingsModal(true);
  };

  const handleBankAccountsClick = () => {
    setActiveSection('bank-accounts');
  };

  const handleSoftwareBackupClick = () => {
    setActiveSection('software-backup');
  };

  const settingsOptions = [
    {
      id: 'user-info',
      name: 'User Info',
      icon: FiUser,
      onClick: handleUserInfoClick,
      availableFor: ['admin', 'manager', 'technician'] // Available for all roles
    },
    {
      id: 'bank-accounts',
      name: 'Bank Accounts',
      icon: FiCreditCard,
      onClick: handleBankAccountsClick,
      availableFor: ['admin'] // Only for admin
    },
    {
      id: 'software-backup',
      name: 'Software Backup',
      icon: FiDatabase,
      onClick: handleSoftwareBackupClick,
      availableFor: ['admin'] // Only for admin
    }
  ];

  const filteredOptions = settingsOptions.filter(option =>
    option.availableFor.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <div className="text-sm text-gray-500">
            {user?.firstName} {user?.lastName} ({user?.role})
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Settings Menu</h2>
            <nav className="space-y-2">
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200 ${
                    activeSection === option.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <option.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{option.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl h-full">
            {activeSection === 'bank-accounts' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-full">
                <BankAccountsSettings />
              </div>
            ) : activeSection === 'software-backup' ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-full overflow-y-auto">
                <SoftwareBackupSettings />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FiUser className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Settings Option
                  </h3>
                  <p className="text-gray-500">
                    Choose an option from the left sidebar to configure your settings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={showUserSettingsModal}
        onClose={() => {
          setShowUserSettingsModal(false);
          setActiveSection(null);
        }}
      />
    </div>
  );
};

export default SettingsPage;