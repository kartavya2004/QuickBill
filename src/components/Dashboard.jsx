import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const Dashboard = () => {
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  
  // Get enterprise data from localStorage
  const enterpriseData = JSON.parse(localStorage.getItem('enterprise') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('enterprise');
    localStorage.removeItem('isLoggedIn');
    enqueueSnackbar('Logged out successfully', { variant: 'success' });
    history.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">QuickBill</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{enterpriseData.enterpriseName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Invoice Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Create Invoice</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate new invoices for your customers
                </p>
                <div className="mt-4">
                  <Link
                    to="/invoice"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Create New Invoice
                  </Link>
                </div>
              </div>
            </div>

            {/* Customer List Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Customer Transactions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  View and manage your customer transactions
                </p>
                <div className="mt-4">
                  <Link
                    to="/customers"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Customers
                  </Link>
                </div>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Business Profile</h3>
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Name: {enterpriseData.enterpriseName}</p>
                  <p className="text-sm text-gray-500">Email: {enterpriseData.email}</p>
                  <p className="text-sm text-gray-500">Phone: {enterpriseData.phone}</p>
                  <p className="text-sm text-gray-500">Address: {enterpriseData.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;