"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const ProductDisplay = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const userDataString = localStorage.getItem("user");

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUsername(userData.username || "");
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [paymentInput, setPaymentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [changeDue, setChangeDue] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'all', name: 'All Products' },
    { id: 1, name: 'SHISHA' },
    { id: 2, name: 'VAPE' },
    { id: 3, name: 'TUYAU' }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  // Helper function for API requests
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthError(true);
      throw new Error('No authentication token found');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (response.status === 401 || response.status === 403) {
        setAuthError(true);
        throw new Error('Authentication failed (403 Forbidden)');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchWithAuth('http://109.123.252.86:8080/api/categories');
        
        const transformedCategories = [
          { id: 'all', name: 'All Products' },
          ...(Array.isArray(data) ? data : []).map(category => ({
            id: category.id,
            name: category.nom || category.name || 'Unnamed Category'
          }))
        ];
        
        setCategories(transformedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchWithAuth('http://109.123.252.86:8080/api/products');
        
        // Handle different response formats
        let productsData = [];
        if (Array.isArray(data)) {
          productsData = data;
        } else if (data && Array.isArray(data.products)) {
          productsData = data.products;
        } else if (data && Array.isArray(data.data)) {
          productsData = data.data;
        } else {
          throw new Error('Invalid products data format');
        }

        // Transform products data
        const transformedProducts = productsData.map(product => ({
          id: product.id,
          name: product.nom || product.name || 'Unnamed Product',
          category: product.catogry_id || product.category_id || 1,
          categoryName: product.category?.nom || product.category?.name || 'Uncategorized',
          variableProducts: (product.variable_products || []).map(vp => ({
            id: vp.id,
            productId: product.id,
            color: vp.color || 'N/A',
            quantity: vp.quantity || 0,
            price: parseFloat(vp.price) || 0,
            name: `${product.nom || product.name || 'Product'} (${vp.color || 'N/A'})`
          }))
        }));

        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate order totals
  const { subtotal, total } = useMemo(() => {
    const subtotal = currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
    const total = subtotal;
    return { subtotal, total };
  }, [currentOrder]);

  // Filter products based on category, search query, and stock availability
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    return products.filter(product => {
      const productName = product?.name?.toString()?.toLowerCase() || '';
      const productCategory = product?.category;
      
      const categoryMatch = activeTab === 'all' || productCategory == activeTab;
      const searchMatch = productName.includes(searchQuery.toLowerCase());
      const hasStock = product.variableProducts.some(vp => vp.quantity > 0);
      
      return categoryMatch && searchMatch && hasStock;
    });
  }, [activeTab, searchQuery, products]);

  // Calculate payment balance
  useEffect(() => {
    const paymentValue = parseFloat(paymentAmount) || 0;
    if (paymentValue > total) {
      setChangeDue(paymentValue - total);
      setRemainingBalance(0);
    } else {
      setChangeDue(0);
      setRemainingBalance(Math.max(0, total - paymentValue));
    }
  }, [paymentAmount, total]);

  // Payment button handler
  const handlePaymentButton = (value) => {
    if (value === '☑') {
      handlePayment();
    } else if (value === 'C') {
      setPaymentInput('');
      setPaymentAmount(0);
    } else if (value === '⌫') {
      setPaymentInput(prev => prev.slice(0, -1));
      setPaymentAmount(prev => {
        const str = prev.toString();
        return parseFloat(str.slice(0, -1)) || 0;
      });
    } else {
      setPaymentInput(prev => prev + value);
      setPaymentAmount(prev => {
        const newValue = parseFloat(prev.toString() + value) || 0;
        return newValue;
      });
    }
  };

  // Process payment
  const handlePayment = () => {
    const paymentValue = parseFloat(paymentAmount) || 0;
    
    if (paymentValue <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      if (paymentValue > total) {
        alert(`Payment processed. Change due: ${formatCurrency(paymentValue - total)}`);
      } else {
        alert(`Payment of ${formatCurrency(paymentValue)} processed. Remaining balance: ${formatCurrency(total - paymentValue)}`);
      }
      
      setPaymentInput('');
      setPaymentAmount(0);
      setIsProcessing(false);
    }, 1000);
  };

  // Submit order to API
  const submitOrder = async () => {
    if (currentOrder.length === 0) {
      alert('No items in order');
      return;
    }

    setIsProcessing(true);

    try {
      const userDataString = localStorage.getItem('user');

      if (!userDataString) {
        throw new Error('User not found in localStorage');
      }
      const userData = JSON.parse(userDataString);
      const userId = userData.id;

      const orderData = {
        user_id: userId,
        client_id: 1,
        total: total,
        detail_orders: currentOrder.map(item => ({
          quantity: item.quantity,
          variable_products_id: item.id
        }))
      };

      await fetchWithAuth('http://109.123.252.86:8080/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });

      alert('Order submitted successfully!');
      setCurrentOrder([]);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`Failed to submit order: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add product to order
  const addToOrder = (product, variant) => {
    // Check if variant is out of stock
    if (variant.quantity <= 0) {
      alert('This product is out of stock');
      return;
    }
    
    // Check if adding would exceed available stock
    const existingItem = currentOrder.find(item => item.id === variant.id);
    if (existingItem && (existingItem.quantity >= variant.quantity)) {
      alert('Not enough stock available');
      return;
    }

    setCurrentOrder(prev => {
      if (existingItem) {
        return prev.map(item =>
          item.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { 
          ...variant,
          name: variant.name,
          quantity: 1,
          price: variant.price || 0
        }];
      }
    });
  };

  // Remove product from order
  const removeFromOrder = (idToRemove) => {
    setCurrentOrder(prev => prev.filter(item => item.id !== idToRemove));
  };

  // Update product quantity in order
  const updateItemQuantity = (idToUpdate, newQuantity) => {
    const safeNewQuantity = Math.max(1, parseInt(newQuantity) || 1);
    
    // Find the product variant to check stock
    const variant = products
      .flatMap(p => p.variableProducts)
      .find(vp => vp.id === idToUpdate);
    
    if (variant && safeNewQuantity > variant.quantity) {
      alert(`Only ${variant.quantity} items available in stock`);
      return;
    }

    setCurrentOrder(prev => {
      return prev.map(item =>
        item.id === idToUpdate
          ? { ...item, quantity: safeNewQuantity }
          : item
      );
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="Loading spinner"
        ></div>
        <span className="text-lg font-medium text-green-600 tracking-wide">
          Loading...
        </span>
      </div>
    </div>
    
    
    );
  }

  // Authentication error state
  if (authError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-2 md:p-6 lg:p-8 min-h-screen bg-gray-100">
      <div className="max-w-full mx-auto flex flex-col lg:flex-row gap-6">
        {/* Left Column - Current Order and Payment */}
        <div className="lg:w-2/3 h-full space-y-6">
          {/* Header buttons */}
          <div className="bg-green-200 rounded-[40px] flex items-center justify-between w-full h-[100px] px-6">
            <div className="flex items-center gap-4">
              <a href="/edit">
                <button className="bg-white rounded-full w-[150px] h-[50px] text-sm font-medium">
                  Edit Product Price
                </button>
              </a>
              <a href="/lakis/history">
              <button className="bg-green-700 rounded-full w-[150px] h-[50px] text-sm font-medium">
                History
              </button>
              </a>
            </div>
            <div className="bg-white rounded-full px-6 py-2 text-xl font-semibold">
              {username}
            </div>
          </div>

          {/* Current Order Section */}
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Current Order</h1>
              {currentOrder.length > 0 && (
                <button 
                  onClick={() => setCurrentOrder([])}
                  className="text-sm text-red-500 hover:text-red-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
              {currentOrder.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No items in order. Add products from the catalog.
                </div>
              ) : (
                currentOrder.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group transition-colors duration-150">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                        {item.quantity > 1 && (
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{item.name}</h2>
                        <div className="flex items-center space-x-2 mt-1">
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                            className="w-12 text-center border rounded py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                          />
                          <button
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">
                        {formatCurrency(item.quantity * (item.price || 0))}
                      </span>
                      <button
                        onClick={() => removeFromOrder(item.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-semibold mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-200">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Payment</h2>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium">Customer:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="font-semibold border-b border-gray-300 focus:border-blue-500 focus:outline-none px-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Order Total:</div>
                  <div className="text-xl font-bold">{formatCurrency(total)}</div>
                </div>
                <div>
                  <div className="text-[20px] text-gray-500 mb-1">Payment Amount:</div>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setPaymentAmount(value);
                      setPaymentInput(value.toString());
                    }}
                    className="w-full p-2 bg-green-200 rounded-full h-[50px] focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg mb-4 border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Remaining Balance:</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(remainingBalance)}
                    </div>
                  </div>
                  {changeDue > 0 && (
                    <div>
                      <div className="text-sm text-gray-500">Change Due:</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(changeDue)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {['1', '2', '3', 'Qty', '4', '5', '6', '% Disc', '7', '8', '9', 'Price', 'C', '0', '⌫', '☑'].map((item) => (
                <button
                  key={item}
                  onClick={() => handlePaymentButton(item)}
                  className={`p-4 rounded-lg text-center font-medium text-lg transition-colors ${
                    item === '☑'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : (item === 'Qty' || item === '% Disc' || item === 'Price')
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : (item === 'C' || item === '⌫')
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } active:scale-95 transform transition-transform`}
                >
                  {item}
                </button>
              ))}
              <button
                onClick={submitOrder}
                disabled={currentOrder.length === 0 || isProcessing}
                className={`p-4 rounded-lg text-center font-medium text-lg ${
                  currentOrder.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } transition-colors col-span-4 active:scale-95 transform transition-transform flex items-center justify-center gap-2`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Submit Order'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Product Catalog */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-md p-6 sticky top-6">
            <div className="flex flex-col space-y-4 mb-6">
              <h2 className="text-2xl font-bold">Product Catalog</h2>
              
              {/* Category Tabs */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeTab === category.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <svg
                  className="w-5 h-5 absolute left-3 top-3.5 text-gray-400"
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

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-300px)] pr-2">
              {filteredProducts.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No products found matching your search.
                </div>
              ) : (
                filteredProducts.flatMap(product => 
                  product.variableProducts.map(variant => (
                    <div
                      key={variant.id}
                      className={`relative bg-gray-50 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col ${
                        variant.quantity <= 0 ? 'opacity-70' : ''
                      }`}
                      onClick={() => variant.quantity > 0 && addToOrder(product, variant)}
                    >
                      {variant.quantity <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                          <span className="text-white font-bold">SOLD OUT</span>
                        </div>
                      )}
                      <div className="relative mb-2">
                        <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                        <span className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {variant.color}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-sm text-center">{product.name}</h3>
                        <p className="text-gray-500 text-xs text-center">{variant.color}</p>
                        <p className="text-gray-700 text-xs mt-1 text-center">
                          {formatCurrency(variant.price || 0)}
                        </p>
                        <p className="text-xs text-center mt-1">
                          Stock: {variant.quantity}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (variant.quantity > 0) addToOrder(product, variant);
                        }}
                        className={`mt-2 px-3 py-1.5 rounded-lg text-sm w-full ${
                          variant.quantity > 0 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        } transition-colors`}
                        disabled={variant.quantity <= 0}
                      >
                        {variant.quantity > 0 ? 'Add to Order' : 'Out of Stock'}
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplay;