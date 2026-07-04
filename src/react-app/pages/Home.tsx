import { Link } from "react-router";
import { Clock, MapPin, Phone, Leaf, Minus, Plus, CheckCircle2, ArrowRight, Flame, Sandwich, Zap } from "lucide-react";
import Header from "@/react-app/components/Header";
import { menuItems } from "@/data/menu";
import { useCart } from "@/react-app/contexts/CartContext";

export default function HomePage() {
  const { items, addItem, updateQuantity } = useCart();
  const popularItems = menuItems.filter((item) => item.popular);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <section className="pt-44 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-7">
              <p className="inline-flex items-center rounded-full border border-amber-200 bg-white/85 px-5 py-2 text-sm font-bold uppercase text-red-700 shadow-sm">
                Golden Crisp. Juicy Bite. Unforgettable Taste.
              </p>

              <h1 className="text-5xl font-black leading-tight text-gray-950 sm:text-6xl">
                <span className="bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 bg-clip-text text-transparent">
                  Crispy, Juicy
                </span>
                <br />
                <span>Chicken Classics</span>
              </h1>

              <p className="max-w-2xl text-lg leading-8 text-gray-600 sm:text-xl">
                Experience the authentic taste of perfectly broasted chicken, prepared
                fresh with a golden crispy coating and tender, juicy meat inside. From
                family meals and sandwiches to crunchy strips and refreshing beverages,
                El Dorado Broasted Chicken serves flavors that satisfy every craving.
              </p>

              <div className="rounded-2xl border border-orange-100 bg-white/80 p-5 shadow-xl shadow-orange-100/60 backdrop-blur">
                <h2 className="mb-4 text-xl font-extrabold text-gray-950">
                  Why Choose Us?
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Freshly prepared chicken every day",
                    "Signature broasting technique for extra crispiness",
                    "Family-friendly meals and combo offers",
                    "Fast ordering and convenient pickup",
                  ].map((reason) => (
                    <div key={reason} className="flex items-start gap-3 text-sm font-semibold text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 px-8 py-4 font-bold text-white shadow-xl shadow-orange-200 transition-all duration-200 hover:scale-105 hover:shadow-2xl"
                >
                  Order Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/menu"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-orange-200 bg-white px-8 py-4 font-bold text-gray-900 shadow-lg transition-all duration-200 hover:border-orange-400 hover:text-orange-700 hover:shadow-xl"
                >
                  Explore Menu
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-3xl opacity-20"></div>
              <img
                src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1200&q=80"
                alt="Delicious fried chicken"
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Customer Favorites
            </h2>
            <p className="text-gray-600 text-lg">
              Popular picks from the updated menu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {popularItems.map((item) => (
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
                  <div className="absolute top-4 left-4">
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
                  <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Popular
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
                      <p className="text-gray-600 mb-4">{item.description}</p>
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
                              className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 transition-colors"
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
                            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-full hover:bg-orange-700 transition-colors"
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

          <div className="text-center mt-12">
            <Link
              to="/menu"
              className="inline-block px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 px-6 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-stretch">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-red-100 via-orange-100 to-amber-100 blur-2xl opacity-80"></div>
              <div className="relative rounded-[2rem] bg-white/80 p-3 shadow-2xl shadow-orange-100 ring-1 ring-orange-100 backdrop-blur">
                <div className="story-collage-grid">
                  <img
                    src="/story-collage/story-1.png"
                    alt="Crispy chicken sandwich ingredients"
                    className="story-collage-tile story-collage-feature"
                  />
                  <img
                    src="/story-collage/story-2.png"
                    alt="Golden broasted chicken pieces"
                    className="story-collage-tile story-collage-right-top"
                  />
                  <img
                    src="/story-collage/story-3.png"
                    alt="Loaded fries with crispy chicken"
                    className="story-collage-tile story-collage-right-mid"
                  />
                  <img
                    src="/story-collage/story-4.png"
                    alt="Fresh chicken wrap ingredients"
                    className="story-collage-tile story-collage-left-mid"
                  />
                  <img
                    src="/story-collage/story-5.png"
                    alt="Crunchy sides and dipping sauces"
                    className="story-collage-tile story-collage-center-low"
                  />
                  <img
                    src="/story-collage/story-6.png"
                    alt="Dessert cookies and brownies"
                    className="story-collage-tile story-collage-left-low"
                  />

                </div>
              </div>

            </div>

            <div className="space-y-7">
              <div>
                <p className="mb-3 inline-flex rounded-full bg-red-100 px-4 py-2 text-sm font-extrabold uppercase text-red-700 ring-1 ring-red-200">
                  Built for real chicken cravings
                </p>
                <h2 className="text-4xl font-black leading-tight text-gray-950 sm:text-5xl">
                  Our Story
                </h2>
              </div>

              <div className="space-y-4 text-lg leading-8 text-gray-600">
                <p>
                  At El Dorado Broasted Chicken, every meal is crafted with a passion
                  for flavor and quality. From our signature broasted chicken to our
                  freshly prepared sandwiches, wraps, and sides, we bring together bold
                  seasonings, premium ingredients, and a commitment to great taste.
                </p>
                <p>
                  Whether you&apos;re grabbing a quick lunch, enjoying dinner with family,
                  or celebrating with friends, our menu is designed to satisfy every
                  craving. We believe great food should be crispy, juicy, affordable,
                  and served with a smile.
                </p>
                <p>
                  Our goal is simple: serve unforgettable chicken and create memorable
                  dining experiences for every customer who walks through our doors or
                  orders online.
                </p>
              </div>

              <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-2xl shadow-orange-100/70">
                <h3 className="mb-5 text-2xl font-black text-gray-950">
                  Why Choose El Dorado?
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: CheckCircle2,
                      title: "Freshly Prepared Daily",
                      text: "Every meal is cooked fresh to ensure the best taste and quality.",
                    },
                    {
                      icon: Flame,
                      title: "Signature Broasted Perfection",
                      text: "Crispy on the outside, tender and juicy on the inside.",
                    },
                    {
                      icon: Sandwich,
                      title: "Variety for Everyone",
                      text: "From sandwiches and strips to family meals and sides.",
                    },
                    {
                      icon: Zap,
                      title: "Fast & Convenient Service",
                      text: "Easy ordering, quick preparation, and reliable delivery.",
                    },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 ring-1 ring-orange-100">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-500 shadow-lg shadow-orange-200">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-extrabold text-gray-950">{title}</h4>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                {[
                  ["10+", "Years of Flavor"],
                  ["50+", "Delicious Menu Items"],
                  ["1000+", "Happy Customers"],
                  ["100%", "Fresh & Quality Ingredients"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-gray-950 p-4 text-center shadow-xl shadow-orange-100">
                    <div className="mb-1 text-3xl font-black text-amber-400">{value}</div>
                    <div className="text-sm font-semibold text-white/85">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Visit Us Today
            </h2>
            <p className="text-gray-600 text-lg">
              Come experience the best fried chicken in town
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600">
                123 Main Street<br />
                Downtown, CA 90210
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hours</h3>
              <p className="text-gray-600">
                Mon - Thu: 11am - 9pm<br />
                Fri - Sat: 11am - 10pm<br />
                Sunday: 12pm - 8pm
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contact</h3>
              <p className="text-gray-600">
                (555) 123-4567<br />
                info@eldoradobroastedchicken.com
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <img
                src="/eldorado-logo.jpeg"
                alt="EL Dorado Broasted Chicken logo"
                className="h-20 w-20 rounded-2xl bg-white object-contain p-1 shadow-xl ring-2 ring-amber-300"
              />
              <span className="text-2xl font-bold">EL Dorado Broasted Chicken</span>
            </div>
            <p className="text-gray-400">
              Serving the community with bold flavor and crispy favorites
            </p>
          </div>
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400">
              Copyright 2026 EL Dorado Broasted Chicken. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
