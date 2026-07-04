import { Link, useLocation, useNavigate } from "react-router";
import { ShoppingCart, UserCircle, LogOut } from "lucide-react";
import { useCart } from "@/react-app/contexts/CartContext";
import { useAuth } from "@/react-app/contexts/AuthContext";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, openCart } = useCart();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const slogans = [
    "Crave a Feast? Get Broasted to Perfection.",
    "We Don't Just Cook Chicken - We Ignite It.",
    "Your Daily Heat Fix, Gold-Standard Crisp.",
    "When Ordinary Won't Do, Spice It Up with El Darodo.",
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <img
                src="/eldorado-logo.jpeg"
                alt="EL Dorado Broasted Chicken logo"
                className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-2xl bg-white object-contain p-1 shadow-2xl ring-4 ring-amber-300"
              />
              <span className="brand-logo-text hidden sm:block truncate">
                EL Dorado Broasted Chicken
              </span>
            </Link>

          </div>

          <div className="flex flex-shrink-0 items-center gap-3 sm:gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive("/")
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              Home
            </Link>
            <Link
              to="/menu"
              className={`font-medium transition-colors ${
                isActive("/menu")
                  ? "text-orange-600"
                  : "text-gray-600 hover:text-orange-600"
              }`}
            >
              Menu
            </Link>
            {user ? (
              <>
                <Link
                  to="/order-history"
                  className={`font-medium transition-colors ${
                    isActive("/order-history")
                      ? "text-orange-600"
                      : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  Orders
                </Link>
                <div className="hidden md:flex items-center gap-2 text-sm text-gray-700 bg-orange-50 px-3 py-2 rounded-full border border-orange-100">
                  <UserCircle className="w-4 h-4 text-orange-600" />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`font-medium transition-colors ${
                  isActive("/login")
                    ? "text-orange-600"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                Login
              </Link>
            )}
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-orange-50 rounded-full transition-colors"
            >
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
      <div className="slogan-banner">
        <div className="slogan-track">
          {slogans.map((slogan) => (
            <span key={slogan} className="slogan-line">
              {slogan}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
