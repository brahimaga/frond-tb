"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

function ProductTransactions() {
  const router = useRouter();
  const params = useParams();
  const variableProductId = params?.variableProductId;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication required");
          setShowLoginPrompt(true);
          return;
        }

        const response = await fetch(
          `http://109.123.252.86:8080/api/variable-products/${variableProductId}/transactions`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("Session expired. Please login again.");
            setShowLoginPrompt(true);
            return;
          }
          throw new Error(`Failed to fetch transactions (Status: ${response.status})`);
        }

        const data = await response.json();
        if (!data?.success || !data?.data) {
          throw new Error("Invalid data format received from server");
        }

        setTransactions(data.data);
      } catch (err) {
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (variableProductId) {
      fetchTransactions();
    }
  }, [variableProductId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <ErrorScreen 
        error={error} 
        showLoginPrompt={showLoginPrompt} 
        onRetry={() => window.location.reload()}
        onBack={() => router.push('/table')}
        onLogin={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <HeaderSection 
          variableProductId={variableProductId} 
          transactionCount={transactions.length} 
          onBack={() => router.push('/table')}
        />
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <label htmlFor="itemsPerPage" className="mr-2 text-sm text-gray-600">
              Items per page:
            </label>
            <select
              id="itemsPerPage"
              value={transactionsPerPage}
              onChange={(e) => {
                setTransactionsPerPage(Number(e.target.value));
              }}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <MainContent 
          transactions={transactions}
          currentTransactions={currentTransactions}
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstTransaction={indexOfFirstTransaction}
          indexOfLastTransaction={indexOfLastTransaction}
          onPageChange={handlePageChange}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
}

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
      <p className="text-lg text-gray-700">Loading transaction history...</p>
    </div>
  </div>
);

const ErrorScreen = ({ error, showLoginPrompt, onRetry, onBack, onLogin }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
      <p className="text-gray-600 mb-6">{error}</p>
      
      <div className="flex flex-col space-y-3">
        {showLoginPrompt ? (
          <button 
            onClick={onLogin}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            Go to Login
          </button>
        ) : (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
          >
            Try Again
          </button>
        )}
        
        <button 
          onClick={onBack}
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
        >
          Back to Product Table
        </button>
      </div>
    </div>
  </div>
);

const HeaderSection = ({ variableProductId, transactionCount, onBack }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transaction History</h1>
      <p className="text-gray-600 mt-1">
        {transactionCount} transactions found for product #{variableProductId}
      </p>
    </div>
    
    <div className="flex space-x-3">
      <button
        onClick={onBack}
        className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Back to Table
      </button>
    </div>
  </div>
);

const MainContent = ({ 
  transactions, 
  currentTransactions,
  currentPage,
  totalPages,
  indexOfFirstTransaction,
  indexOfLastTransaction,
  onPageChange,
  formatDate
}) => (
  <div className="bg-white shadow rounded-lg overflow-hidden">
    {transactions.length === 0 ? (
      <EmptyState />
    ) : (
      <>
        <TransactionTable 
          transactions={currentTransactions} 
          formatDate={formatDate}
        />
        
        {transactions.length > 5 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            indexOfFirstTransaction={indexOfFirstTransaction}
            indexOfLastTransaction={indexOfLastTransaction}
            totalTransactions={transactions.length}
            onPageChange={onPageChange}
          />
        )}
      </>
    )}
  </div>
);

const EmptyState = () => {
  const router = useRouter();
  
  return (
    <div className="text-center py-16">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
      <p className="text-gray-500 mb-6">This product doesn't have any transaction history yet.</p>
      <button
        onClick={() => router.push('/table')}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        View Products
      </button>
    </div>
  );
};

const TransactionTable = ({ transactions, formatDate }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <TableHeader>ID</TableHeader>
          <TableHeader>User</TableHeader>
          <TableHeader>Date & Time</TableHeader>
          <TableHeader>Action</TableHeader>
          <TableHeader>Quantity Change</TableHeader>
          <TableHeader>Before</TableHeader>
          <TableHeader>After</TableHeader>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <TransactionRow 
            key={transaction.id} 
            transaction={transaction}
            formatDate={formatDate}
          />
        ))}
      </tbody>
    </table>
  </div>
);

const TableHeader = ({ children }) => (
  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const TransactionRow = ({ transaction, formatDate }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      #{transaction.id}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {transaction.user_name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {formatDate(transaction.date)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <ActionBadge action={transaction.action} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
      <QuantityChange action={transaction.action} value={transaction.value} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {transaction.q_before}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {transaction.q_after}
    </td>
  </tr>
);

const ActionBadge = ({ action }) => {
  let badgeClass = '';
  let displayText = '';
  
  switch (action) {
    case 'add':
      badgeClass = 'bg-green-100 text-green-800';
      displayText = 'Add';
      break;
    case 'reduce':
      badgeClass = 'bg-red-100 text-red-800';
      displayText = 'Reduce';
      break;
    case 'refund':
      badgeClass = 'bg-green-100 text-green-800';
      displayText = 'Refund';
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-800';
      displayText = action;
  }

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}`}>
      {displayText}
    </span>
  );
};

const QuantityChange = ({ action, value }) => {
  let sign = '';
  let colorClass = '';
  
  switch (action) {
    case 'add':
    case 'refund':
      sign = '+';
      colorClass = 'text-green-600';
      break;
    case 'reduce':
      sign = '-';
      colorClass = 'text-red-600';
      break;
    default:
      sign = '';
      colorClass = 'text-gray-600';
  }

  return (
    <span className={colorClass}>
      {sign}{value}
    </span>
  );
};

const PaginationControls = ({
  currentPage,
  totalPages,
  indexOfFirstTransaction,
  indexOfLastTransaction,
  totalTransactions,
  onPageChange
}) => {
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftOffset = Math.max(1, currentPage - 2);
      const rightOffset = Math.min(totalPages, currentPage + 2);
      
      if (leftOffset > 1) pages.push(1);
      if (leftOffset > 2) pages.push('...');
      
      for (let i = leftOffset; i <= rightOffset; i++) {
        pages.push(i);
      }
      
      if (rightOffset < totalPages - 1) pages.push('...');
      if (rightOffset < totalPages) pages.push(totalPages);
    }
    
    return pages.map((page, index) => (
      <button
        key={index}
        onClick={() => typeof page === 'number' ? onPageChange(page) : null}
        disabled={page === '...'}
        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
          currentPage === page 
            ? 'z-10 bg-green-50 border-green-500 text-green-600' 
            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
        } ${page === '...' ? 'cursor-default' : 'cursor-pointer'}`}
      >
        {page}
      </button>
    ));
  };

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
            currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstTransaction + 1}</span> to{' '}
            <span className="font-medium">{Math.min(indexOfLastTransaction, totalTransactions)}</span> of{' '}
            <span className="font-medium">{totalTransactions}</span> transactions
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>

            {renderPageNumbers()}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default ProductTransactions;