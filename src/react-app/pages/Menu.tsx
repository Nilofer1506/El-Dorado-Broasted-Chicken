import { useState } from "react";
import Header from "@/react-app/components/Header";
import { menuItems, categories } from "@/data/menu";
import { useCart } from "@/react-app/contexts/CartContext";
import { Leaf, Minus, Plus } from "lucide-react";

export default function MenuPage() {
  const { items, addItem, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredItems =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <div className="pt-44 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Our Menu
            </h1>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                selectedCategory === "All"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300"
              }`}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
                    : "bg-white text-gray-700 border-2 border-gray-200 hover:border-orange-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              (() => {
                const cartItem = items.find(
                  (cartEntry) => cartEntry.id === parseInt(item.id)
                );
                const quantity = cartItem?.quantity ?? 0;

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    {item.isVeg ? (
                      <div className="bg-green-500 text-white p-1.5 rounded-md shadow-lg">
                        <Leaf className="w-4 h-4 fill-white" />
                      </div>
                    ) : (
                      <div className="bg-red-500 text-white p-1.5 rounded-md shadow-lg">
                        <div className="w-4 h-4 flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {item.popular && (
                    <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Popular
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                    {item.category}
                  </div>
                  </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.name}
                        </h3>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            item.isVeg
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.isVeg ? "VEG" : "NON-VEG"}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 min-h-[48px]">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="text-2xl font-bold text-orange-600">
                            Rs. {item.price}
                          </span>
                          {item.priceNote && (
                            <p className="text-sm text-gray-500">{item.priceNote}</p>
                          )}
                        </div>
                        {quantity > 0 ? (
                          <div className="flex items-center gap-3 rounded-full bg-orange-50 px-3 py-2 border border-orange-200">
                            <button
                              onClick={() =>
                                updateQuantity(parseInt(item.id), quantity - 1)
                              }
                              className="w-9 h-9 rounded-full bg-white text-orange-600 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-bold text-gray-900">
                              {quantity}
                            </span>
                            <button
                              onClick={() =>
                                addItem({
                                  id: parseInt(item.id),
                                  name: item.name,
                                  price: item.price,
                                  image: item.image,
                                })
                              }
                              className="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center hover:shadow-lg transition-all"
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              addItem({
                                id: parseInt(item.id),
                                name: item.name,
                                price: item.price,
                                image: item.image,
                              })
                            }
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No items found in this category
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
