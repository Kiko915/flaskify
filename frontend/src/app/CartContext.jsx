import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5555';
axios.defaults.withCredentials = true;

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoized fetch cart function
  const fetchCart = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('CartContext - Fetching cart');
      const response = await axios.get('/api/cart');
      console.log('CartContext - Cart response:', response.data);
      setCart(response.data);
    } catch (error) {
      console.error('CartContext - Error fetching cart:', error);
      setError(error);
      
      if (error.response?.status === 401) {
        console.log('CartContext - Unauthorized, clearing cart state');
        setCart(null);
      } else {
        toast.error('Failed to load cart. Retrying...');
        // Retry after 2 seconds
        setTimeout(() => {
          fetchCart(force);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to initialize cart
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to cart
  const addToCart = async (productUuid, variationUuid, quantity, selectedOption = null, autoCheck = false) => {
    try {
      setLoading(true);
      console.log('CartContext - Sending add to cart request');
      const response = await axios.post('/api/cart/add', {
        product_uuid: productUuid,
        variation_uuid: variationUuid,
        quantity: quantity,
        selected_option: selectedOption,
        auto_check: autoCheck
      });
      
      console.log('CartContext - Add to cart response:', response.data);
      setCart(response.data);
      return response.data?.item_uuid; // Return the item_uuid for auto-checking
    } catch (error) {
      console.error('CartContext - Error adding to cart:', error);
      if (error.response?.status === 401) {
        console.log('CartContext - Unauthorized, clearing cart state');
        setCart(null);
        toast.error('Please log in to add items to cart');
      } else {
        toast.error(error.response?.data?.error || 'Failed to add item to cart');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemUuid, quantity) => {
    try {
      setLoading(true);
      console.log('CartContext - Sending update cart request');
      const response = await axios.put(`/api/cart/update/${itemUuid}`, {
        quantity: quantity
      });
      
      console.log('CartContext - Update cart response:', response.data);
      setCart(response.data);
      return true;
    } catch (error) {
      console.error('CartContext - Error updating cart item:', error);
      if (error.response?.status === 401) {
        console.log('CartContext - Unauthorized, clearing cart state');
        setCart(null);
        toast.error('Please log in to update cart');
      }
      toast.error(error.response?.data?.error || 'Failed to update cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove from cart
  const removeFromCart = async (itemUuid) => {
    try {
      setLoading(true);
      console.log('CartContext - Sending remove from cart request');
      const response = await axios.delete(`/api/cart/remove/${itemUuid}`);
      console.log('CartContext - Remove from cart response:', response.data);
      setCart(response.data);
      toast.success('Item removed from cart');
      return true;
    } catch (error) {
      console.error('CartContext - Error removing from cart:', error);
      if (error.response?.status === 401) {
        console.log('CartContext - Unauthorized, clearing cart state');
        setCart(null);
        toast.error('Please log in to remove items');
      }
      toast.error(error.response?.data?.error || 'Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = useCallback(() => {
    setCart(null);
    setLoading(false);
    setError(null);
  }, []);

  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    fetchCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 