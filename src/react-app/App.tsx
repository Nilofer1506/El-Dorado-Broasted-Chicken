import { HashRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import MenuPage from "@/react-app/pages/Menu";
import CheckoutPage from "@/react-app/pages/Checkout";
import OrderConfirmationPage from "@/react-app/pages/OrderConfirmation";
import LoginPage from "@/react-app/pages/Login";
import OrderHistoryPage from "@/react-app/pages/OrderHistory";
import { CartProvider } from "@/react-app/contexts/CartContext";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import CartSidebar from "@/react-app/components/CartSidebar";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-confirmation"
              element={<OrderConfirmationPage />}
            />
          </Routes>
          <CartSidebar />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
