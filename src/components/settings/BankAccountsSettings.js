import React, { useState, useEffect } from 'react';
import {
  FiPlus, FiEdit2, FiTrash2, FiDollarSign,
  FiCreditCard, FiStar, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import AddBankAccountModal from '../AddBankAccountModal';
import EditBankAccountModal from '../EditBankAccountModal';
import ConfirmationDialog from '../ConfirmationDialog';
import { useAuth } from '../../context/AuthContext';
import SummaryApi from '../../common';

const BankAccountsSettings = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(SummaryApi.getBankAccounts.url, {
        method: SummaryApi.getBankAccounts.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.data);
      } else {
        setError(data.message || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBankAccounts();
    }
  }, [user]);

  // Handle add success
  const handleAddSuccess = (newAccount) => {
    setBankAccounts(prev => [newAccount, ...prev]);
  };

  // Handle edit button click
  const handleEditClick = (account) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  // Handle edit success
  const handleEditSuccess = (updatedAccount) => {
    setBankAccounts(prev =>
      prev.map(acc => acc._id === updatedAccount._id ? updatedAccount : acc)
    );
    setShowEditModal(false);
    setEditingAccount(null);
  };

  // Handle delete
  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`${SummaryApi.deleteBankAccount.url}/${accountToDelete._id}`, {
        method: SummaryApi.deleteBankAccount.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(prev => prev.filter(acc => acc._id !== accountToDelete._id));
        setShowDeleteConfirm(false);
        setAccountToDelete(null);
      } else {
        setError(data.message || 'Failed to delete bank account');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error deleting bank account:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle set primary
  const handleSetPrimary = async (account) => {
    if (account.isPrimary) return;

    try {
      const response = await fetch(`${SummaryApi.updateBankAccount.url}/${account._id}`, {
        method: SummaryApi.updateBankAccount.method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...account, isPrimary: true })
      });

      const data = await response.json();

      if (data.success) {
        setBankAccounts(prev =>
          prev.map(acc =>
            acc._id === account._id
              ? { ...acc, isPrimary: true }
              : { ...acc, isPrimary: false }
          )
        );
      } else {
        setError(data.message || 'Failed to set primary account');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
      console.error('Error setting primary account:', err);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access bank account settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiDollarSign className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bank Account Management</h2>
              <p className="text-gray-600 mt-1">Manage your business bank accounts</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchBankAccounts}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Bank Account
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading bank accounts...</span>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-12">
            <FiCreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bank Accounts</h3>
            <p className="text-gray-600 mb-6">You haven't added any bank accounts yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              Add Your First Bank Account
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {bankAccounts.map((account, index) => (
              <BankAccountCard
                key={account._id}
                account={account}
                onEdit={() => handleEditClick(account)}
                onDelete={() => handleDeleteClick(account)}
                onSetPrimary={() => handleSetPrimary(account)}
                isFirst={index === 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Bank Account Modal */}
      <EditBankAccountModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAccount(null);
        }}
        onSuccess={handleEditSuccess}
        account={editingAccount}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Bank Account"
        message={`Are you sure you want to delete the bank account ${accountToDelete?.accountNumber}? This action cannot be undone.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

// Bank Account Card Component
const BankAccountCard = ({ account, onEdit, onDelete, onSetPrimary, isFirst }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${isFirst ? '' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <FiCreditCard className="w-6 h-6 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <h3 className="text-lg font-semibold text-gray-800 truncate">
                {account.bankName}
              </h3>
              {account.isPrimary && (
                <div className="ml-3 flex items-center bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
                  <FiStar className="w-3 h-3 mr-1" />
                  Primary
                </div>
              )}
            </div>
            <p className="text-gray-600 truncate">
              Account: •••• •••• •••• {account.accountNumber.slice(-4)}
            </p>
            <p className="text-sm text-gray-500">
              {account.accountHolderName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {!account.isPrimary && (
            <button
              onClick={onSetPrimary}
              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors duration-200"
              title="Set as Primary"
            >
              <FiStar className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>

        {isExpanded && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Account Number</p>
              <p className="font-medium text-gray-800">{account.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IFSC Code</p>
              <p className="font-medium text-gray-800">{account.ifscCode}</p>
            </div>
            {account.upiId && (
              <div>
                <p className="text-sm text-gray-500">UPI ID</p>
                <p className="font-medium text-gray-800">{account.upiId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Added On</p>
              <p className="font-medium text-gray-800">
                {new Date(account.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankAccountsSettings;