import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, Home, List } from "lucide-react";
import Header from "@/react-app/components/Header";
import { useCart } from "@/react-app/contexts/CartContext";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState<string>("");
  
  useEffect(() => {
    // Clear cart on successful order
    clearCart();
    
    // Get session ID from URL and fetch order details. Non-card checkout arrives without a session.
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setOrderNumber(`ED${Date.now().toString().slice(-5)}`);
      return;
    }

    if (sessionId) {
      fetch(`/api/orders/session/${sessionId}`, {
          credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setOrderNumber(`ED${data.id.toString().padStart(5, '0')}`);
          }
        })
        .catch(err => console.error("Failed to fetch order:", err));
    }
  }, [searchParams, clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      
      <div className="pt-44 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Thank you for your order. We've received it and will start preparing 
              your delicious meal right away.
            </p>
            
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-bold text-gray-900">#{orderNumber || "Loading..."}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estimated Delivery</span>
                  <span className="font-bold text-gray-900">30-45 minutes</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-8">
              We'll send you an email confirmation shortly with your order details 
              and tracking information.
            </p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-8 py-4 bg-white text-gray-800 font-semibold rounded-full border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200"
              >
                <Home className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
              <button
                onClick={() => navigate("/order-history")}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <List className="w-5 h-5" />
                <span>View Orders</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
