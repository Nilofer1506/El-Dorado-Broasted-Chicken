import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Banknote,
  Bike,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  Minus,
  Plus,
  Store,
  Tag,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import Header from "@/react-app/components/Header";
import { useCart } from "@/react-app/contexts/CartContext";
import { useAuth } from "@/react-app/contexts/AuthContext";

type RazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  error?: string;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailedResponse = {
  error?: {
    description?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailedResponse) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Payment processing failed. Please try again.";
}

const deliveryOptions = [
  {
    id: "standard",
    label: "Standard Delivery",
    detail: "30-45 min",
    fee: 50,
    icon: Bike,
  },
  {
    id: "express",
    label: "Express Delivery",
    detail: "15-20 min",
    fee: 90,
    icon: Zap,
  },
  {
    id: "pickup",
    label: "Pickup",
    detail: "Collect at store",
    fee: 0,
    icon: Store,
  },
] as const;

const paymentMethods = [
  { id: "cod", label: "Cash on Delivery", detail: "Pay when your order arrives", icon: Banknote },
  { id: "razorpay", label: "Razorpay", detail: "UPI, card, wallet and more", icon: CreditCard },
] as const;

const savedAddresses = [
  {
    id: "home",
    label: "Home",
    address: "12 Golden Street",
    city: "Mumbai",
    zipCode: "400001",
  },
  {
    id: "office",
    label: "Office",
    address: "45 Business Park",
    city: "Mumbai",
    zipCode: "400013",
  },
] as const;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, updateQuantity, removeItem } = useCart();
  const { user, loading } = useAuth();
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [deliveryOption, setDeliveryOption] =
    useState<(typeof deliveryOptions)[number]["id"]>("standard");
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof paymentMethods)[number]["id"]>("cod");
  const [selectedAddress, setSelectedAddress] = useState("home");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    deliveryInstructions: "",
    orderNotes: "",
  });

  useEffect(() => {
    if (user) {
      const defaultAddress = savedAddresses[0];
      setFormData((current) => ({
        ...current,
        name: current.name || user.name,
        email: current.email || user.email || "",
        phone: current.phone || user.phone || "",
        address: current.address || defaultAddress.address,
        city: current.city || defaultAddress.city,
        zipCode: current.zipCode || defaultAddress.zipCode,
      }));
    }
  }, [user]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectSavedAddress = (addressId: string) => {
    setSelectedAddress(addressId);
    const address = savedAddresses.find((entry) => entry.id === addressId);
    if (address) {
      setFormData((current) => ({
        ...current,
        address: address.address,
        city: address.city,
        zipCode: address.zipCode,
      }));
    }
  };

  const handleAddNewAddress = () => {
    setSelectedAddress("new");
    setFormData((current) => ({
      ...current,
      address: "",
      city: "",
      zipCode: "",
    }));
  };

  const applyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (normalized === "FIRSTORDER10") {
      setAppliedCoupon(normalized);
      setCouponMessage("FIRSTORDER10 applied: 10% off your subtotal.");
      return;
    }

    setAppliedCoupon("");
    setCouponMessage(
      normalized ? "That coupon code is not valid." : "Enter a coupon code first."
    );
  };

  const selectedDelivery =
    deliveryOptions.find((option) => option.id === deliveryOption) ||
    deliveryOptions[0];
  const discount = appliedCoupon === "FIRSTORDER10" ? Math.round(totalPrice * 0.1) : 0;
  const discountedSubtotal = Math.max(totalPrice - discount, 0);
  const deliveryFee = selectedDelivery.fee;
  const tax = Math.round(discountedSubtotal * 0.05);
  const total = discountedSubtotal + deliveryFee + tax;
  const canUseDeliveryAddress = deliveryOption !== "pickup";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    setError("");

    if (paymentMethod === "cod") {
      navigate("/order-confirmation");
      return;
    }

    try {
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        throw new Error("Razorpay key is not configured.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load. Please refresh and try again.");
      }

      const amountInPaise = Math.max(Math.round(total * 100), 100);
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: `ed_${Date.now()}`,
        }),
      });

      const orderData = (await orderResponse.json()) as RazorpayOrderResponse;

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Unable to create Razorpay order.");
      }

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EL Dorado Broasted Chicken",
        description: "Order payment",
        image: `${window.location.origin}/eldorado-logo.jpeg`,
        order_id: orderData.order_id,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          deliveryOption,
          deliveryInstructions: formData.deliveryInstructions,
          orderNotes: formData.orderNotes,
        },
        theme: {
          color: "#ea580c",
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(response),
            });
            const verifyData = (await verifyResponse.json()) as {
              success?: boolean;
              error?: string;
            };

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            navigate(
              `/order-confirmation?razorpay_payment_id=${response.razorpay_payment_id}`
            );
          } catch (err: unknown) {
            setError(getErrorMessage(err));
            setLoadingPayment(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Razorpay payment was cancelled.");
            setLoadingPayment(false);
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        setError(
          response.error?.description || "Razorpay payment failed. Please try again."
        );
        setLoadingPayment(false);
      });

      razorpay.open();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoadingPayment(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <Header />
        <div className="pt-44 pb-16 px-6">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-orange-100">
            <h1 className="mb-4 text-4xl font-black text-gray-950">Your cart is empty</h1>
            <p className="mb-8 text-gray-600">Add some favorites before checking out.</p>
            <button
              onClick={() => navigate("/menu")}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-4 font-bold text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <Header />
        <div className="pt-44 pb-16 px-6">
          <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center text-gray-500 shadow-xl ring-1 ring-orange-100">
            Preparing checkout...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50">
      <Header />

      <main className="pt-44 pb-16 px-6">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => navigate("/menu")}
            className="mb-6 flex items-center gap-2 font-semibold text-gray-600 transition hover:text-orange-600"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Menu
          </button>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-extrabold uppercase text-orange-700">
                Almost there
              </p>
              <h1 className="text-4xl font-black text-gray-950">Checkout</h1>
              <p className="mt-2 text-gray-600">
                Confirm your details, choose delivery, and place your order.
              </p>
            </div>
            <Link
              to="/menu"
              className="rounded-full border border-orange-200 bg-white px-5 py-3 font-bold text-orange-700 shadow-sm transition hover:border-orange-400 hover:shadow-md"
            >
              Edit Cart
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_390px]">
            <div className="space-y-5">
              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-orange-100">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-950">Customer Details</h2>
                    <p className="text-sm text-gray-500">
                      {user ? "We filled what we know." : "Guest checkout is available."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Full name"
                  />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Phone number"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 md:col-span-2"
                    placeholder="Email address"
                  />
                </div>
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-orange-100">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-gray-950">Delivery Method</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {deliveryOptions.map((option) => {
                    const Icon = option.icon;
                    const selected = deliveryOption === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDeliveryOption(option.id)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-orange-500 bg-orange-50 shadow-md"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <Icon className="mb-3 h-5 w-5 text-orange-600" />
                        <p className="font-black text-gray-950">{option.label}</p>
                        <p className="text-sm text-gray-500">{option.detail}</p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {option.fee ? `Rs. ${option.fee}` : "Free"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {canUseDeliveryAddress && (
                <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-orange-100">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white">
                      <Home className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-gray-950">Delivery Address</h2>
                  </div>

                  {user && (
                    <div className="mb-4 flex flex-wrap gap-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => selectSavedAddress(address.id)}
                          className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                            selectedAddress === address.id
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 text-gray-700 hover:border-orange-300"
                          }`}
                        >
                          {address.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddNewAddress}
                        className="rounded-full border border-dashed border-orange-300 px-4 py-2 text-sm font-bold text-orange-700"
                      >
                        + New Address
                      </button>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 md:col-span-2"
                      placeholder="Street address"
                    />
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={formData.zipCode}
                      onChange={handleChange}
                      className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="PIN code"
                    />
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleChange}
                      rows={3}
                      className="rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 md:col-span-2"
                      placeholder="Delivery instructions: call before delivery, leave at door..."
                    />
                  </div>
                </section>
              )}

              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-orange-100">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black text-gray-950">Order Notes</h2>
                </div>
                <textarea
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="Extra spicy, no onions, add ketchup..."
                />
              </section>

              <section className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-orange-100">
                <h2 className="mb-5 text-xl font-black text-gray-950">Payment</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                          selected
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md"
                            : "border-gray-200 text-gray-800 hover:border-orange-300"
                        }`}
                      >
                        <Icon className="mt-0.5 h-5 w-5" />
                        <span>
                          <span className="block font-black">{method.label}</span>
                          <span className="block text-sm font-semibold text-gray-500">
                            {method.detail}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-44 lg:self-start">
              <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-orange-100">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black text-gray-950">Your Order</h2>
                  <Link to="/menu" className="text-sm font-bold text-orange-600 hover:text-orange-800">
                    Edit
                  </Link>
                </div>

                <div className="mb-5 max-h-[360px] space-y-3 overflow-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-2xl border border-gray-100 p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-3">
                          <h3 className="truncate font-bold text-gray-950">{item.name}</h3>
                          <span className="font-bold text-gray-950">
                            Rs. {item.price * item.quantity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">Rs. {item.price} each</p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 text-orange-600 hover:bg-orange-50"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-7 text-center font-black text-gray-950">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white hover:bg-orange-700"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-5 rounded-2xl bg-orange-50 p-4 ring-1 ring-orange-100">
                  <label className="mb-2 flex items-center gap-2 text-sm font-black text-gray-900">
                    <Tag className="h-4 w-4 text-orange-600" />
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="min-w-0 flex-1 rounded-full border border-orange-200 px-4 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="FIRSTORDER10"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="rounded-full bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
                    >
                      Apply
                    </button>
                  </div>
                  <p className={`mt-2 text-xs font-semibold ${appliedCoupon ? "text-green-700" : "text-gray-500"}`}>
                    {couponMessage || "Use FIRSTORDER10 for 10% off."}
                  </p>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs. {totalPrice}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span>- Rs. {discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span>{deliveryFee ? `Rs. ${deliveryFee}` : "Free"}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST 5%)</span>
                    <span>Rs. {tax}</span>
                  </div>
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-2xl font-black text-gray-950">
                      <span>Total</span>
                      <span>Rs. {total}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingPayment}
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 py-4 font-black text-white shadow-xl shadow-orange-200 transition hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loadingPayment
                    ? paymentMethod === "razorpay"
                      ? "Opening Razorpay..."
                      : "Placing order..."
                    : paymentMethod === "razorpay"
                      ? `Pay Rs. ${total}`
                      : `Place Order - Rs. ${total}`}
                </button>
              </div>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}