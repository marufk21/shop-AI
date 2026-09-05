"use client"

import * as React from "react"

export interface CartItem {
  productId: string
  name: string
  price: number
  imageUrl: string | null
  slug: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "HYDRATE_CART"; payload: CartItem[] }

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false

  const item = value as Partial<CartItem>
  return (
    typeof item.productId === "string" && item.productId.trim().length > 0 &&
    typeof item.name === "string" &&
    typeof item.price === "number" && Number.isFinite(item.price) &&
    typeof item.slug === "string" &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) && item.quantity > 0 &&
    (typeof item.imageUrl === "string" || item.imageUrl === null)
  )
}

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("shopai-cart")
    if (!stored) return []

    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("shopai-cart", JSON.stringify(items))
  } catch {
    // silently ignore
  }
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (!isCartItem(action.payload)) {
        return state
      }

      const existing = state.items.find(
        (i) => i.productId === action.payload.productId
      )
      if (existing) {
        const next = state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: i.quantity + action.payload.quantity }
            : i
        )
        return { ...state, items: next, isOpen: true }
      }
      return { ...state, items: [...state.items, action.payload], isOpen: true }
    }
    case "REMOVE_ITEM": {
      const next = state.items.filter(
        (i) => i.productId !== action.payload.productId
      )
      return { ...state, items: next }
    }
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => i.productId !== action.payload.productId
          ),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      }
    }
    case "CLEAR_CART":
      return { ...state, items: [] }
    case "HYDRATE_CART":
      return { ...state, items: action.payload }
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen }
    case "OPEN_CART":
      return { ...state, isOpen: true }
    case "CLOSE_CART":
      return { ...state, isOpen: false }
    default:
      return state
  }
}

// ── State context (changes when cart data changes) ──

interface CartStateValue {
  items: CartItem[]
  isOpen: boolean
  itemCount: number
  subtotal: number
}

const CartStateContext = React.createContext<CartStateValue | null>(null)

// ── Dispatch context (stable — never changes after mount) ──

interface CartDispatchValue {
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartDispatchContext = React.createContext<CartDispatchValue | null>(null)

// ── Hooks ──

export function useCartState() {
  const ctx = React.useContext(CartStateContext)
  if (!ctx) {
    throw new Error("useCartState must be used within a CartProvider")
  }
  return ctx
}

export function useCartDispatch() {
  const ctx = React.useContext(CartDispatchContext)
  if (!ctx) {
    throw new Error("useCartDispatch must be used within a CartProvider")
  }
  return ctx
}

const CartIsOpenContext = React.createContext<boolean>(false)

/** Granular selector – only re-renders when isOpen flips. */
export function useCartIsOpen() {
  return React.useContext(CartIsOpenContext)
}

/** Convenience hook — reads both contexts. Prefer useCartState / useCartDispatch for granular re-renders. */
export function useCart(): CartStateValue & CartDispatchValue {
  const state = React.useContext(CartStateContext)
  const dispatch = React.useContext(CartDispatchContext)
  if (!state || !dispatch) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return { ...state, ...dispatch }
}

// ── Provider ──

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [state, dispatch] = React.useReducer(cartReducer, {
    items: [],
    isOpen: false,
  })

  // Hydrate cart from localStorage after mount to prevent SSR hydration mismatch
  React.useEffect(() => {
    const stored = loadCart()
    if (stored.length > 0) {
      dispatch({ type: "HYDRATE_CART", payload: stored })
    }
    setIsHydrated(true)
  }, [])

  // Persist cart to localStorage on every items change (only after initial hydration)
  React.useEffect(() => {
    if (isHydrated) {
      saveCart(state.items)
    }
  }, [isHydrated, state.items])

  // Memoize derived state so StateContext only changes when values actually differ
  const stateValue = React.useMemo<CartStateValue>(
    () => ({
      items: state.items,
      isOpen: state.isOpen,
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [state.items, state.isOpen]
  )

  // Dispatch functions are stable — dispatch from useReducer never changes
  const dispatchValue = React.useMemo<CartDispatchValue>(
    () => ({
      addItem: (item) => dispatch({ type: "ADD_ITEM", payload: item }),
      removeItem: (productId) =>
        dispatch({ type: "REMOVE_ITEM", payload: { productId } }),
      updateQuantity: (productId, quantity) =>
        dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      toggleCart: () => dispatch({ type: "TOGGLE_CART" }),
      openCart: () => dispatch({ type: "OPEN_CART" }),
      closeCart: () => dispatch({ type: "CLOSE_CART" }),
    }),
    []
  )

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartDispatchContext.Provider value={dispatchValue}>
        <CartIsOpenContext.Provider value={state.isOpen}>
          {children}
        </CartIsOpenContext.Provider>
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  )
}
