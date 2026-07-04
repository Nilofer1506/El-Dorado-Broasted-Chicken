import { getRazorpayCredentials, parseJsonBody, sendJson } from "./_lib/razorpay";

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const credentials = getRazorpayCredentials();
  if (!credentials) {
    sendJson(res, 401, { error: "Razorpay credentials are not configured." });
    return;
  }

  try {
    const payload = await parseJsonBody(req);
    const amount = Math.round(Number(payload.amount));
    const currency = payload.currency || "INR";
    const receipt = payload.receipt || `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      sendJson(res, 400, { error: "Amount must be at least 100 paise." });
      return;
    }

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, currency, receipt }),
    });

    if (response.status === 401) {
      sendJson(res, 401, { error: "Razorpay authentication failed." });
      return;
    }

    if (!response.ok) {
      console.error("Razorpay create order error:", await response.text());
      sendJson(res, 500, { error: "Unable to create Razorpay order." });
      return;
    }

    const order = await response.json();
    sendJson(res, 200, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: unknown) {
    console.error("Razorpay create order error:", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}
