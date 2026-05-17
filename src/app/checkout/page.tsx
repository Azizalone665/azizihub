'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';  // ← Add this import
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FiTruck, FiShield, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    price: number;
    attributes: any;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = useCallback(async () => {
    try {
      const { data: cart, error } = await supabase
        .from('cart')
        .select(`
          id,
          cart_items (
            id,
            quantity,
            price,
            products (
              id,
              name,
              price,
              attributes
            )
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (cart?.cart_items) {
        const formatted = cart.cart_items.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          products: Array.isArray(item.products) ? item.products[0] : item.products,
        }));
        setCartItems(formatted);
      } else {
        setCartItems([]);
        toast.error('Your cart is empty');
        router.push('/cart');
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, router]);

  // Memoize order calculations (tax removed)
  const { subtotal, shipping, total, freeShippingRemaining } = useMemo(() => {
    const sub = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const ship = sub > 5000 ? 0 : 200;
    const remaining = sub > 5000 ? 0 : 5000 - sub;
    return {
      subtotal: sub,
      shipping: ship,
      total: sub + ship,
      freeShippingRemaining: remaining,
    };
  }, [cartItems]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^[0-9+\-\s]{10,15}$/.test(phone.trim())) newErrors.phone = 'Enter a valid phone number';
    if (!addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State/Province is required';
    if (!zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, phone, addressLine1, city, state, zipCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress = { 
        fullName: fullName.trim(), 
        phone: phone.trim(), 
        addressLine1: addressLine1.trim(), 
        addressLine2: addressLine2.trim(), 
        city: city.trim(), 
        state: state.trim(), 
        zipCode: zipCode.trim(), 
        country: 'Pakistan' 
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress, paymentMethod }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Order placed successfully!');
      router.push(`/order-success?order=${data.orderNumber}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading checkout...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Your cart is empty</h1>
          <Link href="/products" className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg inline-block transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">Checkout</h1>
        
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Shipping Address */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Address Line 1 *"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.addressLine1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="City *"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="State/Province *"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className={`w-full border rounded-lg p-2.5 md:p-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition ${errors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}
                    />
                    {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Cash on Delivery (COD)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-700">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      disabled
                      className="w-4 h-4"
                    />
                    <span className="text-gray-500">Card Payment (coming soon)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 md:py-3.5 rounded-xl transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 md:p-6 sticky top-24">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              {/* Items List */}
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-2">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[60%]">
                      {item.products.name} <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">₨{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              {/* Totals (No Tax) */}
              <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <span>Subtotal</span>
                  <span>₨{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm">
                  <div className="flex items-center gap-1">
                    <FiTruck className="w-4 h-4" />
                    <span>Shipping</span>
                  </div>
                  <span>{shipping === 0 ? 'Free' : `₨${shipping.toLocaleString()}`}</span>
                </div>
                <div className="border-t dark:border-gray-700 pt-3 mt-2">
                  <div className="flex justify-between font-bold text-base md:text-lg text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₨{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Free Shipping Progress */}
              {shipping > 0 && freeShippingRemaining > 0 && (
                <div className="mt-4 pt-3 border-t dark:border-gray-700">
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center mb-2">
                    Add ₨{freeShippingRemaining.toLocaleString()} more for free shipping
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((subtotal / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <FiShield className="w-3 h-3" />
                <span>Secure checkout • SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}