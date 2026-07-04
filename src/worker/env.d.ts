declare namespace Cloudflare {
  interface Env {
    R2_BUCKET: R2Bucket;
    DB: D1Database;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
  }
}

interface Env extends Cloudflare.Env {}
