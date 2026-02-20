import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartAPI.addItem({ product_id: productId, quantity });
      
      // Update cart immediately from the response
      if (response.data && response.data.cart) {
        setCart(response.data.cart);
      }
      
      // Also fetch fresh cart data to ensure sync
      await fetchCart();
      
      toast.success(t('addedToCart'));
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.detail || t('failedToAddToCart'));
      return { success: false };
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await cartAPI.removeItem(productId);
      await fetchCart();
      toast.success(t('removedFromCart'));
      return { success: true };
    } catch (error) {
      toast.error(t('failedToRemoveFromCart'));
      return { success: false };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart({ items: [] });
      toast.success(t('cartCleared'));
      return { success: true };
    } catch (error) {
      toast.error(t('failedToClearCart'));
      return { success: false };
    }
  };

  const cartItemsCount = cart?.items?.length || 0;
  const cartTotal = cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    clearCart,
    fetchCart,
    cartItemsCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};