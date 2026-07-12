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

export interface AppliedCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
}

interface AppState {
  user: User | null;
  cart: CartItem[];
  wishlist: WishlistItem[];
  coupon: AppliedCoupon | null;
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
  setCoupon: (coupon: AppliedCoupon | null) => void;
  syncCartWithServer: () => Promise<void>;
  syncWishlistWithServer: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      wishlist: [],
      coupon: null,

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('heritage-feedback', {
            detail: { type: 'cart', title: item.title, image: item.featuredImage },
          }));
        }

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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('heritage-feedback', {
            detail: { type: 'wishlist', title: item.title, image: item.featuredImage },
          }));
        }

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

      setCoupon: (coupon) => set({ coupon }),

      // Merge the local (guest) cart with the server cart instead of overwriting.
      // Runs on every session load (Navbar → /api/auth/me), so it must be
      // idempotent: quantity = max(local, server) capped at stock. That keeps a
      // plain refresh a no-op while still rescuing items added before sign-in.
      // ponytail: max-merge — a deliberate qty reduction on another device loses
      // to the higher local value; add last-write-wins timestamps if that matters.
      syncCartWithServer: async () => {
        if (!get().user) return;
        try {
          const res = await fetch('/api/cart');
          if (!res.ok) return;
          const data = await res.json();
          const serverCart: CartItem[] = data.cartItems || [];
          const local = get().cart;

          const byId = new Map<string, CartItem>();
          for (const item of serverCart) byId.set(item.productId, item);
          for (const item of local) {
            const server = byId.get(item.productId);
            if (server) {
              byId.set(item.productId, {
                ...server,
                quantity: Math.min(Math.max(server.quantity, item.quantity), server.stock),
              });
            } else {
              byId.set(item.productId, item);
            }
          }
          const merged = [...byId.values()];
          set({ cart: merged });

          // Persist only the rows that differ from the server so a refresh writes nothing.
          await Promise.all(
            merged.map((item) => {
              const server = serverCart.find((s) => s.productId === item.productId);
              if (!server) {
                return fetch('/api/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
                }).catch(console.error);
              }
              if (server.quantity !== item.quantity) {
                return fetch('/api/cart', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
                }).catch(console.error);
              }
              return Promise.resolve();
            })
          );
        } catch (error) {
          console.error('Failed to sync cart with server:', error);
        }
      },

      syncWishlistWithServer: async () => {
        if (!get().user) return;
        try {
          const res = await fetch('/api/wishlist');
          if (!res.ok) return;
          const data = await res.json();
          const serverWishlist: WishlistItem[] = data.wishlistItems || [];
          const local = get().wishlist;

          const byId = new Map<string, WishlistItem>();
          for (const item of serverWishlist) byId.set(item.productId, item);
          for (const item of local) if (!byId.has(item.productId)) byId.set(item.productId, item);
          const merged = [...byId.values()];
          set({ wishlist: merged });

          // Push guest-only items up (POST is a no-op if already present).
          await Promise.all(
            merged
              .filter((item) => !serverWishlist.some((s) => s.productId === item.productId))
              .map((item) =>
                fetch('/api/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: item.productId }),
                }).catch(console.error)
              )
          );
        } catch (error) {
          console.error('Failed to sync wishlist with server:', error);
        }
      },
    }),
    {
      name: 'madhubani-art-storage',
      partialize: (state) => ({ cart: state.cart, wishlist: state.wishlist, coupon: state.coupon }),
    }
  )
);
