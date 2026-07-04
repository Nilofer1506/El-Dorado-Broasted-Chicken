import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import Header from "@/react-app/components/Header";
import { useAuth } from "@/react-app/contexts/AuthContext";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to continue.";
}

type Mode = "login" | "signup";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    email: "",
    phone: "",
    password: "",
  });

  if (!loading && user) {
    return <Navigate to="/order-history" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        await signup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
      } else {
        await login({
          identifier: formData.identifier,
          password: formData.password,
        });
      }

      navigate("/order-history");
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <div className="pt-44 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-gray-600">
                Sign in with email or mobile number and password, or create an
                account using mobile number or email.
              </p>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className={`flex-1 rounded-full py-3 font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`flex-1 rounded-full py-3 font-semibold transition-colors ${
                  mode === "signup"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-50 text-orange-700"
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="+91 98765 43210"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Use email, mobile number, or both. At least one is required.
                    </p>
                  </div>
                </>
              )}

              {mode === "login" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.identifier}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        identifier: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    placeholder="you@example.com or +91 98765 43210"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <input
                    type="text"
                    inputMode="email"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    placeholder="you@example.com (optional)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="At least 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-white font-bold transition-all hover:shadow-xl disabled:opacity-60"
              >
                {submitting
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
