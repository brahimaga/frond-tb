"use client";

import { useState, useEffect } from 'react';
import Head from 'next/head';

const OrderHistory = () => {
  // State for storing the list of orders
  const [orders, setOrders] = useState([]);
  
  // Loading state indicator
  const [loading, setLoading] = useState(true);
  
  // Error state for handling API errors
  const [error, setError] = useState(null);
  
  // State to show login prompt when unauthenticated
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Tracks which order is currently being cancelled
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  /**
   * Fetches order history from the API
   * Handles authentication and error states
   */
  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please login.");
      setShowLoginPrompt(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://109.123.252.86:8080/api/orders/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Server responded with status ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        throw new Error(data.message || "Failed to load orders");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch orders. Please check your network connection.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * Handles order cancellation
   * @param {string} orderId - ID of the order to cancel
   * 
   * Reasons for cancellation:
   * - Change of mind about the purchase
   * - Found better alternatives
   * - No longer need the product/service
   * - Financial considerations
   * - Duplicate or accidental order
   * 
   * Process flow:
   * 1. Verify authentication
   * 2. Send cancellation request to server
   * 3. Update local state on success
   * 4. Handle errors appropriately
   */
  const handleCancelOrder = async (orderId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Authentication required. Please login.");
      setShowLoginPrompt(true);
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`http://109.123.252.86:8080/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: "don't need it" // Default cancellation reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Failed to cancel order. Server responded with status ${response.status}`
        );
      }

      const data = await response.json();
      if (data.success) {
        // Update the order status locally
        setOrders(orders.map(order => 
          order.order_id === orderId ? { ...order, status: 'cancelled' } : order
        ));
      } else {
        throw new Error(data.message || "Failed to cancel order");
      }
    } catch (err) {
      setError(err.message);
      console.error("Cancel error:", err);
    } finally {
      setCancellingOrderId(null);
    }
  };

  /**
   * Formats date string to readable format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  /**
   * Retries fetching orders after error
   */
  const retryFetch = () => {
    setError(null);
    setLoading(true);
    fetchOrders();
  };

  // Loading state UI
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="text-green-500 text-xl">{error}</div>
        <button
          onClick={retryFetch}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-900 transition"
        >
          Retry
        </button>
        {showLoginPrompt && (
          <a 
            href="/login" 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          >
            Go to Login
          </a>
        )}
      </div>
    );
  }

  // Main component UI
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Order History</title>
        <meta name="description" content="View your order history" />
      </Head>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Order History</h1>
          <p className="mt-3 text-xl text-gray-500">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
          </p>
        </div>

        {/* Orders list */}
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order # {order.order_id}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center gap-2">
                    {/* Order status badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : order.status === 'cancelled'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-green-800'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    
                    {/* Cancel button - shown only for paid orders */}
                    {order.status === 'paid' && (
                      <button
                        onClick={() => handleCancelOrder(order.order_id)}
                        disabled={cancellingOrderId === order.order_id}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          cancellingOrderId === order.order_id
                            ? 'bg-gray-300 text-gray-600'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        aria-label={`Cancel order ${order.order_id}`}
                      >
                        {cancellingOrderId === order.order_id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order details */}
              <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Seller</h4>
                    <p className="mt-1 text-sm text-gray-900">{order.seller_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Client</h4>
                    <p className="mt-1 text-sm text-gray-900">{order.client_name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                    <p className="mt-1 text-sm text-gray-900">${order.total}</p>
                  </div>
                </div>

                {/* Products list */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500">Products</h4>
                  <div className="mt-2 space-y-3">
                    {order.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.product_name}</p>
                          <p className="text-xs text-gray-500">Variant ID: {product.variant_id}</p>
                        </div>
                        <p className="text-sm text-gray-900">Qty: {product.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found in your history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;