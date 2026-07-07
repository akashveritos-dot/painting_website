import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  salePrice: number | null;
  featuredImage: string;
  quantity: number;
  stock: number;
}

export interface WishlistItem {
  productId: string;
  title: string;
  price: number;
  salePrice: number | null;
  featuredImage: string;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  wishlist: WishlistItem[];
  setUser: (user: User | null) => void;
  setCart: (cart: CartItem[]) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setWishlist: (wishlist: WishlistItem[]) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  syncCartWithServer: () => Promise<void>;
  syncWishlistWithServer: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      wishlist: [],

      setUser: (user) => {
        set({ user });
        if (user) {
          // Trigger server synchronization upon login
          get().syncCartWithServer();
          get().syncWishlistWithServer();
        }
      },

      setCart: (cart) => set({ cart }),

      addToCart: (item, qty = 1) => {
        const currentCart = get().cart;
        const existingItem = currentCart.find((i) => i.productId === item.productId);

        let updatedCart: CartItem[];
        if (existingItem) {
          updatedCart = currentCart.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + qty, item.stock) }
              : i
          );
        } else {
          updatedCart = [...currentCart, { ...item, quantity: Math.min(qty, item.stock) }];
        }

        set({ cart: updatedCart });

        // If logged in, sync with database
        if (get().user) {
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.productId, quantity: qty }),
          }).catch(console.error);
        }
      },

      removeFromCart: (productId) => {
        const updatedCart = get().cart.filter((item) => item.productId !== productId);
        set({ cart: updatedCart });

        // If logged in, delete from database
        if (get().user) {
          fetch(`/api/cart?productId=${productId}`, {
            method: 'DELETE',
          }).catch(console.error);
        }
      },

      updateCartQuantity: (productId, quantity) => {
        const currentCart = get().cart;
        const item = currentCart.find((i) => i.productId === productId);
        if (!item) return;

        const targetQty = Math.max(1, Math.min(quantity, item.stock));
        const updatedCart = currentCart.map((i) =>
          i.productId === productId ? { ...i, quantity: targetQty } : i
        );

        set({ cart: updatedCart });

        // If logged in, update on the server
        if (get().user) {
          fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: targetQty }),
          }).catch(console.error);
        }
      },

      clearCart: () => {
        set({ cart: [] });
        if (get().user) {
          fetch('/api/cart?clear=true', {
            method: 'DELETE',
          }).catch(console.error);
        }
      },

      setWishlist: (wishlist) => set({ wishlist }),

      addToWishlist: (item) => {
        const currentWishlist = get().wishlist;
        const exists = currentWishlist.some((i) => i.productId === item.productId);
        if (exists) return;

        const updatedWishlist = [...currentWishlist, item];
        set({ wishlist: updatedWishlist });

        if (get().user) {
          fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: item.productId }),
          }).catch(console.error);
        }
      },

      removeFromWishlist: (productId) => {
        const updatedWishlist = get().wishlist.filter((item) => item.productId !== productId);
        set({ wishlist: updatedWishlist });

        if (get().user) {
          fetch(`/api/wishlist?productId=${productId}`, {
            method: 'DELETE',
          }).catch(console.error);
        }
      },

      clearWishlist: () => set({ wishlist: [] }),

      syncCartWithServer: async () => {
        if (!get().user) return;
        try {
          // Fetch server cart
          const res = await fetch('/api/cart');
          if (res.ok) {
            const data = await res.json();
            if (data.cartItems) {
              set({ cart: data.cartItems });
            }
          }
        } catch (error) {
          console.error('Failed to sync cart with server:', error);
        }
      },

      syncWishlistWithServer: async () => {
        if (!get().user) return;
        try {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const data = await res.json();
            if (data.wishlistItems) {
              set({ wishlist: data.wishlistItems });
            }
          }
        } catch (error) {
          console.error('Failed to sync wishlist with server:', error);
        }
      },
    }),
    {
      name: 'madhubani-art-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist }), // Only persist cart and wishlist
    }
  )
);
