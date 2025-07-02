"use client";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

const GreenProductTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [quantityChange, setQuantityChange] = useState(0);
  const [isAdding, setIsAdding] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://192.168.1.109:8002/api/products', {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please login to view products");
            setShowLoginPrompt(true);
          } else {
            throw new Error(`Failed to fetch products (Status: ${response.status})`);
          }
          return;
        }

        const data = await response.json();
        setProducts(data.data || []);
      } catch (err) {
        if (!err.message.includes("401")) {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://192.168.1.109:8002/api/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const filteredProducts = products.filter(product => {
    if (searchTerm === '') return true;
    const searchTermLower = searchTerm.toLowerCase();
    
    if (product.nom?.toLowerCase().includes(searchTermLower)) return true;
    if (product.category?.nom?.toLowerCase().includes(searchTermLower)) return true;
    
    return product.variable_products?.some(vp => 
      vp.color?.toLowerCase().includes(searchTermLower) ||
      vp.quantity?.toString().includes(searchTerm)
    );
  });

  const handleHistoryClick = (variableProductId) => {
    router.push(`/table/history/${variableProductId}`);
  };

  // Pagination calculations
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const openQuantityModal = (product, variableProduct, isAdd) => {
    setCurrentProduct({
      productId: product.id,
      variableProductId: variableProduct.id,
      currentQuantity: variableProduct.quantity
    });
    setIsAdding(isAdd);
    setQuantityChange(0);
    setShowQuantityModal(true);
  };

  const applyQuantityChange = async () => {
    if (!currentProduct || quantityChange <= 0) {
      setShowQuantityModal(false);
      return;
    }

    try {
      const change = isAdding ? quantityChange : -quantityChange;
      const newQuantity = Math.max(0, currentProduct.currentQuantity + change);

      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === currentProduct.productId
            ? {
                ...product,
                variable_products: product.variable_products.map(vp =>
                  vp.id === currentProduct.variableProductId
                    ? { ...vp, quantity: newQuantity }
                    : vp
                )
              }
            : product
        )
      );

      // API call
      const endpoint = isAdding 
        ? `http://192.168.1.109:8002/api/${currentProduct.variableProductId}/add-quantity`
        : `http://192.168.1.109:8002/api/${currentProduct.variableProductId}/reduce-quantity`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({
          quantity: Math.abs(quantityChange)
        })
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      setShowQuantityModal(false);
    } catch (err) {
      setError(err.message);
      // Revert local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === currentProduct.productId
            ? {
                ...product,
                variable_products: product.variable_products.map(vp =>
                  vp.id === currentProduct.variableProductId
                    ? { ...vp, quantity: currentProduct.currentQuantity }
                    : vp
                )
              }
            : product
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
        <div className="text-green-600 text-xl">Loading stock products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="flex flex-col space-y-3">
            {showLoginPrompt ? (
              <button 
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                Go to Login
              </button>
            ) : (
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                Retry
              </button>
            )}
            
            <button 
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-md"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-green-50 to-green-100">
      {/* Quantity Change Modal */}
      {showQuantityModal && currentProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              {isAdding ? 'Increase Quantity' : 'Decrease Quantity'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAdding ? 'Amount to Add' : 'Amount to Remove'}
              </label>
              <input
                type="number"
                min="1"
                value={quantityChange}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setQuantityChange(Math.max(1, value));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Current quantity: <span className="font-medium">{currentProduct.currentQuantity}</span>
              </p>
              {!isAdding && currentProduct.currentQuantity < quantityChange && (
                <p className="text-sm text-red-500 mt-1">
                  Warning: You're trying to remove more than available
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQuantityModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={applyQuantityChange}
                disabled={!isAdding && currentProduct.currentQuantity < quantityChange}
                className={`px-4 py-2 text-white rounded-md shadow-sm transition-colors ${
                  !isAdding && currentProduct.currentQuantity < quantityChange 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : isAdding 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isAdding ? 'Add' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          
          <button 
            onClick={() => router.push('/')}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </button>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold text-green-800 text-center">Product Inventory</h1>
        
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/70 backdrop-blur-sm shadow-sm"
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-green-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">History</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.length > 0 ? (
                currentProducts.flatMap(product =>
                  product.variable_products?.map(variableProduct => (
                    <tr 
                      key={`${product.id}-${variableProduct.id}`}
                      className={`hover:bg-green-50 ${variableProduct.quantity < 10 ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category?.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span 
                            className="w-4 h-4 rounded-full mr-2 border border-gray-300 shadow-inner"
                            style={{ 
                              backgroundColor: 
                                variableProduct.color.toLowerCase() === 'red' ? '#ef4444' : 
                                variableProduct.color.toLowerCase() === 'black' ? '#000000' :
                                variableProduct.color.toLowerCase() === 'green' ? '#10b981' :
                                variableProduct.color.toLowerCase() === 'laser' ? '#ec4899' : '#ffffff'
                            }}
                          ></span>
                          <span className="text-sm text-gray-700 capitalize">{variableProduct.color}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          variableProduct.quantity < 10 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {variableProduct.quantity}
                          {variableProduct.quantity < 10 && ' (Low)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openQuantityModal(product, variableProduct, true)}
                            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
                            title="Add stock"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openQuantityModal(product, variableProduct, false)}
                            disabled={variableProduct.quantity <= 0}
                            className={`flex items-center px-3 py-1 rounded-md shadow-sm transition-colors ${
                              variableProduct.quantity <= 0 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                            title="Remove stock"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleHistoryClick(variableProduct.id)}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                          title="View transaction history"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 mr-1.5" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                            />
                          </svg>
                          History
                        </button>    
                      </td>
                    </tr>
                  ))
                )
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center py-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-lg">No products found matching your search</p>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > productsPerPage && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-xl">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstProduct + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(indexOfLastProduct, filteredProducts.length)}</span> of{' '}
                  <span className="font-medium">{filteredProducts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
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

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber 
                            ? 'z-10 bg-green-50 border-green-500 text-green-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => paginate(totalPages)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'z-10 bg-green-50 border-green-500 text-green-600' 
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
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
        )}
      </div>
    </div>
  );
};

export default GreenProductTable;