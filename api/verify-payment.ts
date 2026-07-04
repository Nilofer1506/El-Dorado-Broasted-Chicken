import { createRazorpaySignature, getRazorpayCredentials, parseJsonBody, sendJson } from "./_lib/razorpay";

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
    const orderId = payload.razorpay_order_id;
    const paymentId = payload.razorpay_payment_id;
    const signature = payload.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      sendJson(res, 400, { error: "Payment verification fields are required." });
      return;
    }

    const generatedSignature = createRazorpaySignature(orderId, paymentId, credentials.keySecret);

    if (generatedSignature !== signature) {
      sendJson(res, 400, { error: "Payment signature verification failed." });
      return;
    }

    sendJson(res, 200, { success: true });
  } catch (error: unknown) {
    console.error("Razorpay verify payment error:", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}
