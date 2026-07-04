import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import Header from "@/react-app/components/Header";
import { useAuth } from "@/react-app/contexts/AuthContext";

type OrderHistoryItem = {
  item_name: string;
  quantity: number;
  price_at_time: number;
};

type OrderHistoryOrder = {
  id: number;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
  items: OrderHistoryItem[];
};

export default function OrderHistoryPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderHistoryOrder[]>([]);
  const [error, setError] = useState("");
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoadingOrders(false);
      return;
    }

    fetch("/api/orders/mine", {
      credentials: "include",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load order history.");
        }

        setOrders(data.orders || []);
      })
      .catch((fetchError) => {
        setError(fetchError.message || "Unable to load order history.");
      })
      .finally(() => {
        setIsLoadingOrders(false);
      });
  }, [user]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <div className="pt-44 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Order History
            </h1>
            <p className="text-gray-600 text-lg">
              Review your previous orders and reorder your favorites.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {isLoadingOrders ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center text-gray-500 shadow-lg">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-6">
                Once you place an order while signed in, it will show up here.
              </p>
              <Link
                to="/menu"
                className="inline-block rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-8 py-3 font-semibold text-white"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-3xl border border-gray-100 bg-white p-8 shadow-lg"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Order #{String(order.id).padStart(5, "0")}
                      </h2>
                      <p className="text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 border border-orange-100">
                        {order.status}
                      </div>
                      <p className="mt-3 text-2xl font-bold text-orange-600">
                        Rs. {order.total_amount}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5">
                    <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-2">
                      Delivery Address
                    </h3>
                    <p className="text-gray-700">{order.delivery_address}</p>
                  </div>

                  <div>
                    <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-3">
                      Items
                    </h3>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div
                          key={`${order.id}-${index}`}
                          className="flex items-center justify-between rounded-2xl bg-orange-50 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.item_name || "Menu item"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            Rs. {item.price_at_time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
