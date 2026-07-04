import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import Stripe from "stripe";

const SESSION_COOKIE = "ns_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const OTP_DURATION_MS = 1000 * 60 * 10;
const PHONE_EMAIL_DOMAIN = "phone.ns.local";

const app = new Hono<{ Bindings: Env }>();

type AppContext = Context<{ Bindings: Env }>;

type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

type CheckoutItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type RazorpayCreateOrderRequest = {
  amount: number;
  currency?: string;
  receipt?: string;
};

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayVerifyPaymentRequest = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

type CheckoutRequest = {  items: CheckoutItem[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
    deliveryInstructions?: string;
    orderNotes?: string;
  };
  checkoutOptions?: {
    couponCode?: string;
    discount?: number;
    deliveryOption?: string;
    deliveryFee?: number;
    paymentMethod?: string;
    deliveryInstructions?: string;
    orderNotes?: string;
  };
  totalAmount: number;
};

type LoginRequest = {
  identifier: string;
  password: string;
};

type SignupRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type RequestOtpPayload = {
  phone: string;
};

type VerifyOtpPayload = {
  phone: string;
  otp: string;
};

type SessionRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  expires_at: string;
};

type LoginUserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
};

type PhoneOtpRow = {
  id: number;
  phone: string;
  otp_code: string;
  expires_at: string;
  attempts: number;
  verified_at: string | null;
};

type OrderRow = {
  id: number;
  total_amount: number;
  status: string;
  delivery_address: string;
  created_at: string;
};

type OrderItemRow = {
  item_name: string | null;
  quantity: number;
  price_at_time: number;
};

function getRazorpayCredentials(c: AppContext) {
  const keyId = c.env.RAZORPAY_KEY_ID;
  const keySecret = c.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function createRazorpaySignature(
  orderId: string,
  paymentId: string,
  keySecret: string
) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(keySecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(`${orderId}|${paymentId}`)
  );

  return toHex(signature);
}

function getErrorMessage(error: unknown) {  return error instanceof Error ? error.message : "Unexpected error";
}

const jsonError = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function normalizePhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  if (!normalized) {
    return null;
  }
  if (normalized.length < 10) {
    return null;
  }

  return normalized;
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return normalized ? normalized : null;
}

function isPhoneBackedEmail(email: string) {
  return email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

function createPhoneBackedEmail(phone: string) {
  const sanitized = phone.replace(/[^\d]/g, "");
  return `${sanitized}@${PHONE_EMAIL_DOMAIN}`;
}

function toPublicUser<T extends { id: number; name: string; email: string; phone: string | null }>(
  user: T
): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: isPhoneBackedEmail(user.email) ? null : user.email,
    phone: user.phone,
  };
}

function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashPassword(password: string) {
  const passwordBytes = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", passwordBytes);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createSessionToken() {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "")
  );
}

async function getCurrentUser(c: AppContext) {
  const sessionToken = getCookie(c, SESSION_COOKIE);

  if (!sessionToken) {
    return null;
  }

  const session = await c.env.DB.prepare(
    `SELECT users.id, users.name, users.email, users.phone, user_sessions.expires_at
     FROM user_sessions
     JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.session_token = ?`
  )
    .bind(sessionToken)
    .first<SessionRow>();

  if (!session) {
    return null;
  }

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await c.env.DB.prepare("DELETE FROM user_sessions WHERE session_token = ?")
      .bind(sessionToken)
      .run();
    deleteCookie(c, SESSION_COOKIE);
    return null;
  }

  return toPublicUser(session);
}

async function createUserSession(c: AppContext, userId: number) {
  const sessionToken = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await c.env.DB.prepare(
    "INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)"
  )
    .bind(userId, sessionToken, expiresAt)
    .run();

  setCookie(c, SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
    secure: c.req.url.startsWith("https://"),
  });
}

async function requireUser(c: AppContext) {
  const user = await getCurrentUser(c);
  if (!user) {
    return { error: jsonError("Please sign in to continue.", 401) } as const;
  }

  return { user } as const;
}

app.post("/api/auth/signup", async (c) => {
  try {
    const { name, email, phone, password } = await c.req.json<SignupRequest>();

    if (!name?.trim() || !password?.trim()) {
      return jsonError("Name and password are required.");
    }

    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters long.");
    }

    const normalizedEmail = normalizeEmail(email || "");
    const normalizedPhone = normalizePhone(phone || "");

    if (!normalizedEmail && !normalizedPhone) {
      return jsonError("Provide either an email address or a mobile number.");
    }

    if (normalizedEmail) {
      const existingUserByEmail = await c.env.DB.prepare(
        "SELECT id FROM users WHERE email = ?"
      )
        .bind(normalizedEmail)
        .first();

      if (existingUserByEmail) {
        return jsonError("An account already exists for that email.", 409);
      }
    }

    if (phone && !normalizedPhone) {
      return jsonError("Please enter a valid mobile number.");
    }

    if (normalizedPhone) {
      const existingUserByPhone = await c.env.DB.prepare(
        "SELECT id FROM users WHERE phone = ?"
      )
        .bind(normalizedPhone)
        .first();

      if (existingUserByPhone) {
        return jsonError("An account already exists for that mobile number.", 409);
      }
    }

    const storedEmail =
      normalizedEmail || createPhoneBackedEmail(normalizedPhone as string);
    const passwordHash = await hashPassword(password);
    const result = await c.env.DB.prepare(
      "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)"
    )
      .bind(name.trim(), storedEmail, normalizedPhone, passwordHash)
      .run();

    const userId = Number(result.meta.last_row_id);
    await createUserSession(c, userId);

    return c.json({
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
      },
    });
  } catch (error: unknown) {
    console.error("Signup error:", error);
    return c.json({ error: "Unable to create account." }, 500);
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    const { identifier, password } = await c.req.json<LoginRequest>();

    if (!identifier?.trim() || !password?.trim()) {
      return jsonError("Email/mobile and password are required.");
    }

    const normalizedEmail = normalizeEmail(identifier);
    const normalizedPhone = normalizePhone(identifier);

    let user: LoginUserRow | null = null;

    if (normalizedEmail) {
      user = await c.env.DB.prepare(
        "SELECT id, name, email, phone, password_hash FROM users WHERE email = ?"
      )
        .bind(normalizedEmail)
        .first<LoginUserRow>();
    }

    if (!user && normalizedPhone) {
      user = await c.env.DB.prepare(
        "SELECT id, name, email, phone, password_hash FROM users WHERE phone = ?"
      )
        .bind(normalizedPhone)
        .first<LoginUserRow>();
    }

    if (!user) {
      return jsonError("Invalid login or password.", 401);
    }

    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return jsonError("Invalid login or password.", 401);
    }

    await createUserSession(c, user.id);

    return c.json({
      user: toPublicUser(user),
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return c.json({ error: "Unable to sign in." }, 500);
  }
});

app.post("/api/auth/request-otp", async (c) => {
  try {
    const { phone } = await c.req.json<RequestOtpPayload>();
    const normalizedPhone = normalizePhone(phone || "");

    if (!normalizedPhone) {
      return jsonError("Please enter a valid mobile number.");
    }

    const user = await c.env.DB.prepare(
      "SELECT id FROM users WHERE phone = ?"
    )
      .bind(normalizedPhone)
      .first();

    if (!user) {
      return jsonError("No account found for that mobile number.", 404);
    }

    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_DURATION_MS).toISOString();

    await c.env.DB.prepare("DELETE FROM phone_otps WHERE phone = ?")
      .bind(normalizedPhone)
      .run();

    await c.env.DB.prepare(
      "INSERT INTO phone_otps (phone, otp_code, expires_at) VALUES (?, ?, ?)"
    )
      .bind(normalizedPhone, otpCode, expiresAt)
      .run();

    const response: {
      success: boolean;
      message: string;
      devOtp?: string;
    } = {
      success: true,
      message: "OTP sent to your mobile number.",
    };

    if (
      c.req.header("origin")?.includes("127.0.0.1") ||
      c.req.header("origin")?.includes("localhost")
    ) {
      response.devOtp = otpCode;
    }

    return c.json(response);
  } catch (error: unknown) {
    console.error("Request OTP error:", error);
    return c.json({ error: "Unable to send OTP." }, 500);
  }
});

app.post("/api/auth/verify-otp", async (c) => {
  try {
    const { phone, otp } = await c.req.json<VerifyOtpPayload>();
    const normalizedPhone = normalizePhone(phone || "");

    if (!normalizedPhone || !otp?.trim()) {
      return jsonError("Mobile number and OTP are required.");
    }

    const otpRow = await c.env.DB.prepare(
      `SELECT id, phone, otp_code, expires_at, attempts, verified_at
       FROM phone_otps
       WHERE phone = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
      .bind(normalizedPhone)
      .first<PhoneOtpRow>();

    if (!otpRow) {
      return jsonError("No OTP request found for that mobile number.", 404);
    }

    if (otpRow.verified_at) {
      return jsonError("This OTP has already been used.", 400);
    }

    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return jsonError("This OTP has expired. Request a new one.", 400);
    }

    if (otpRow.attempts >= 5) {
      return jsonError("Too many incorrect attempts. Request a new OTP.", 429);
    }

    if (otpRow.otp_code !== otp.trim()) {
      await c.env.DB.prepare(
        "UPDATE phone_otps SET attempts = attempts + 1 WHERE id = ?"
      )
        .bind(otpRow.id)
        .run();
      return jsonError("Incorrect OTP.", 401);
    }

    const user = await c.env.DB.prepare(
      "SELECT id, name, email, phone FROM users WHERE phone = ?"
    )
      .bind(normalizedPhone)
      .first<SessionRow>();

    if (!user) {
      return jsonError("No account found for that mobile number.", 404);
    }

    await c.env.DB.prepare(
      "UPDATE phone_otps SET verified_at = ? WHERE id = ?"
    )
      .bind(new Date().toISOString(), otpRow.id)
      .run();

    await createUserSession(c, user.id);

    return c.json({ user: toPublicUser(user) });
  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    return c.json({ error: "Unable to verify OTP." }, 500);
  }
});

app.post("/api/auth/logout", async (c) => {
  try {
    const sessionToken = getCookie(c, SESSION_COOKIE);

    if (sessionToken) {
      await c.env.DB.prepare("DELETE FROM user_sessions WHERE session_token = ?")
        .bind(sessionToken)
        .run();
    }

    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ success: true });
  } catch (error: unknown) {
    console.error("Logout error:", error);
    return c.json({ error: "Unable to sign out." }, 500);
  }
});

app.get("/api/auth/me", async (c) => {
  try {
    const user = await getCurrentUser(c);
    return c.json({ user });
  } catch (error: unknown) {
    console.error("Auth me error:", error);
    return c.json({ error: "Unable to load session." }, 500);
  }
});

app.post("/api/create-order", async (c) => {
  try {
    const credentials = getRazorpayCredentials(c);
    if (!credentials) {
      return jsonError("Razorpay credentials are not configured.", 401);
    }

    const payload = await c.req.json<RazorpayCreateOrderRequest>();
    const amount = Math.round(Number(payload.amount));
    const currency = payload.currency || "INR";
    const receipt = payload.receipt || `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      return jsonError("Amount must be at least 100 paise.");
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${credentials.keyId}:${credentials.keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency, receipt }),
    });

    if (response.status === 401) {
      return jsonError("Razorpay authentication failed.", 401);
    }

    if (!response.ok) {
      console.error("Razorpay create order error:", await response.text());
      return c.json({ error: "Unable to create Razorpay order." }, 500);
    }

    const order = (await response.json()) as RazorpayOrderResponse;

    return c.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: unknown) {
    console.error("Razorpay create order error:", error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

app.post("/api/verify-payment", async (c) => {
  try {
    const credentials = getRazorpayCredentials(c);
    if (!credentials) {
      return jsonError("Razorpay credentials are not configured.", 401);
    }

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = await c.req.json<RazorpayVerifyPaymentRequest>();

    if (!orderId || !paymentId || !signature) {
      return jsonError("Payment verification fields are required.");
    }

    const generatedSignature = await createRazorpaySignature(
      orderId,
      paymentId,
      credentials.keySecret
    );

    if (!signaturesMatch(generatedSignature, signature)) {
      return jsonError("Payment signature verification failed.");
    }

    return c.json({ success: true });
  } catch (error: unknown) {
    console.error("Razorpay verify payment error:", error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});
app.post("/api/checkout", async (c) => {
  try {
    const user = await getCurrentUser(c);

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const { items, customerInfo, checkoutOptions, totalAmount } =
      await c.req.json<CheckoutRequest>();

    if (!customerInfo.email?.trim()) {
      return jsonError("Email is required for checkout.");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${c.req.header("origin")}/#/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${c.req.header("origin")}/#/checkout`,
      customer_email: user?.email || customerInfo.email,
      metadata: {
        ...(user ? { userId: user.id.toString() } : {}),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        deliveryAddress: `${customerInfo.address}, ${customerInfo.city}, ${customerInfo.zipCode}`,
        deliveryOption: checkoutOptions?.deliveryOption || "standard",
        deliveryInstructions: checkoutOptions?.deliveryInstructions || customerInfo.deliveryInstructions || "",
        orderNotes: checkoutOptions?.orderNotes || customerInfo.orderNotes || "",
        couponCode: checkoutOptions?.couponCode || "",
        discount: (checkoutOptions?.discount || 0).toString(),
        deliveryFee: (checkoutOptions?.deliveryFee || 0).toString(),
        paymentMethod: checkoutOptions?.paymentMethod || "razorpay",
        totalAmount: totalAmount.toString(),
      },
    });

    return c.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

app.post("/api/webhooks/stripe", async (c) => {
  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature") || "";

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        c.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error: unknown) {
      console.error(
        "Webhook signature verification failed:",
        getErrorMessage(error)
      );
      return c.text("Invalid signature", 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const orderResult = await c.env.DB.prepare(
        `INSERT INTO orders (
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          total_amount,
          status,
          payment_intent_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          session.metadata?.userId ? parseInt(session.metadata.userId, 10) : null,
          session.metadata?.customerName || "",
          session.customer_email || session.customer_details?.email || "",
          session.metadata?.customerPhone || "",
          session.metadata?.deliveryAddress || "",
          parseFloat(session.metadata?.totalAmount || "0"),
          "confirmed",
          session.payment_intent as string
        )
        .run();

      const orderId = Number(orderResult.meta.last_row_id);

      for (const item of lineItems.data) {
        const quantity = item.quantity || 0;
        const unitPrice =
          quantity > 0 ? (item.amount_total || 0) / 100 / quantity : 0;

        await c.env.DB.prepare(
          `INSERT INTO order_items (
            order_id,
            menu_item_id,
            item_name,
            quantity,
            price_at_time
          ) VALUES (?, ?, ?, ?, ?)`
        )
          .bind(orderId, 0, item.description, quantity, unitPrice)
          .run();
      }
    }

    return c.text("ok", 200);
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return c.text("Webhook error", 500);
  }
});

app.get("/api/orders/session/:sessionId", async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) {
      return auth.error;
    }

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
    const sessionId = c.req.param("sessionId");
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.payment_intent) {
      return c.json({ error: "Payment not completed" }, 404);
    }

    const order = await c.env.DB.prepare(
      "SELECT * FROM orders WHERE payment_intent_id = ? AND user_id = ?"
    )
      .bind(session.payment_intent, auth.user.id)
      .first();

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order);
  } catch (error: unknown) {
    console.error("Order lookup error:", error);
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

app.get("/api/orders/mine", async (c) => {
  try {
    const auth = await requireUser(c);
    if ("error" in auth) {
      return auth.error;
    }

    const orders = await c.env.DB.prepare(
      `SELECT id, total_amount, status, delivery_address, created_at
       FROM orders
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
      .bind(auth.user.id)
      .all<OrderRow>();

    const orderRows = orders.results || [];

    const ordersWithItems = await Promise.all(
      orderRows.map(async (order: OrderRow) => {
        const items = await c.env.DB.prepare(
          `SELECT item_name, quantity, price_at_time
           FROM order_items
           WHERE order_id = ?
           ORDER BY id ASC`
        )
          .bind(order.id)
          .all<OrderItemRow>();

        return {
          ...order,
          items: items.results || [],
        };
      })
    );

    return c.json({ orders: ordersWithItems });
  } catch (error: unknown) {
    console.error("Order history error:", error);
    return c.json({ error: "Unable to load order history." }, 500);
  }
});

export default app;
