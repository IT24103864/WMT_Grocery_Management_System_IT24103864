import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CartContext = createContext();

const CART_KEY  = "@grocery_cart_items";
const STORE_KEY = "@grocery_cart_store";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartStore, setCartStore] = useState(null);

  // FIX #24: load persisted cart on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const [rawItems, rawStore] = await Promise.all([
          AsyncStorage.getItem(CART_KEY),
          AsyncStorage.getItem(STORE_KEY),
        ]);
        if (rawItems) setCartItems(JSON.parse(rawItems));
        if (rawStore) setCartStore(JSON.parse(rawStore));
      } catch {}
    };
    loadCart();
  }, []);

  // FIX #24: persist cart whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(cartItems)).catch(() => {});
  }, [cartItems]);

  useEffect(() => {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify(cartStore)).catch(() => {});
  }, [cartStore]);

  useEffect(() => {
    if (cartItems.length === 0 && cartStore) setCartStore(null);
  }, [cartItems, cartStore]);

  const getStoreFromProduct = (product) => {
    const store = product.store || product.storeId;
    if (!store) return null;
    if (typeof store === "string") return { _id: store, name: product.storeName || "Selected Store" };
    return store;
  };

  const addToCart = (product, quantity = 1) => {
    const availableStock = Number(product.stock ?? product.stockQuantity ?? Infinity);
    if (availableStock <= 0) return { ok: false, reason: "OUT_OF_STOCK" };

    const productStore = getStoreFromProduct(product);
    if (cartStore?._id && productStore?._id && cartStore._id !== productStore._id) {
      return { ok: false, reason: "STORE_MISMATCH" };
    }

    if (!cartStore && productStore) setCartStore(productStore);

    setCartItems((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, availableStock);
        return prev.map((i) => i._id === product._id ? { ...i, quantity: nextQuantity } : i);
      }
      return [...prev, { ...product, quantity: Math.min(quantity, availableStock) }];
    });

    return { ok: true };
  };

  const replaceCartWithProduct = (product, quantity = 1) => {
    setCartStore(getStoreFromProduct(product));
    const availableStock = Number(product.stock ?? product.stockQuantity ?? Infinity);
    setCartItems([{ ...product, quantity: Math.min(quantity, availableStock) }]);
  };

  const removeFromCart = (productId) =>
    setCartItems((prev) => prev.filter((i) => i._id !== productId));

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCartItems((prev) =>
      prev.map((i) => {
        if (i._id !== productId) return i;
        const availableStock = Number(i.stock ?? i.stockQuantity ?? Infinity);
        return { ...i, quantity: Math.min(quantity, availableStock) };
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCartStore(null);
    AsyncStorage.multiRemove([CART_KEY, STORE_KEY]).catch(() => {});
  };

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartStore,
        addToCart,
        replaceCartWithProduct,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
