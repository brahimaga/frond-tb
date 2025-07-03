"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const ProductTable = () => {
  const API_BASE_URL = "http://109.123.252.86:8080/api";
  const PRODUCTS_ENDPOINT = "/products";
  const UPDATE_PRICE_ENDPOINT = (id) => `/variable-products/${id}/update-price`;

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${
        typeof window !== "undefined" ? localStorage.getItem("token") : ""
      }`,
      "Content-Type": "application/json",
    },
  });

  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newPrice, setNewPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(PRODUCTS_ENDPOINT);
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data.products || [];

        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleEditClick = (variant) => {
    setEditingId(variant.id);
    setNewPrice(variant.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewPrice("");
  };

  const handleUpdatePrice = async (variantId) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue)) {
      setError("Please enter a valid price");
      return;
    }

    try {
      setIsLoading(true);
      await api.put(UPDATE_PRICE_ENDPOINT(variantId), {
        price: priceValue,
      });

      // Update in UI
      setProducts((prevProducts) =>
        prevProducts.map((product) => ({
          ...product,
          variable_products: product.variable_products.map((vp) =>
            vp.id === variantId ? { ...vp, price: priceValue } : vp
          ),
        }))
      );

      setEditingId(null);
      setNewPrice("");
    } catch (err) {
      setError("Failed to update price");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Product List</h2>

      {isLoading && (
        <div className="mb-4 text-blue-600">Loading or saving...</div>
      )}
      {error && <div className="mb-4 text-red-600">{error}</div>}

      {products.map((product) => (
        <div
          key={product.id}
          className="mb-8 border rounded-lg shadow-md p-4 bg-white"
        >
          <h3 className="text-lg font-semibold mb-2">
            {product.nom} - {product.category?.nom}
          </h3>

          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Variant ID</th>
                <th className="px-4 py-2">Color</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {product.variable_products.map((variant) => (
                <tr key={variant.id} className="border-t">
                  <td className="px-4 py-2">{variant.id}</td>
                  <td className="px-4 py-2">{variant.color}</td>
                  <td className="px-4 py-2">{variant.quantity}</td>
                  <td className="px-4 py-2">
                    {editingId === variant.id ? (
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="border px-2 py-1 rounded w-24"
                      />
                    ) : (
                      parseFloat(variant.price).toFixed(2)
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {editingId === variant.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdatePrice(variant.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          disabled={isLoading}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(variant)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ProductTable;
