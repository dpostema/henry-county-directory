import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// 1. Read and parse .env manually
const envContent = fs.readFileSync(envPath, "utf-8");
const envLines = envContent.split("\n");

let stripeSecretKey = "";
for (const line of envLines) {
  if (line.startsWith("STRIPE_SECRET_KEY=")) {
    stripeSecretKey = line.split("=")[1]?.trim();
    break;
  }
}

if (!stripeSecretKey) {
  console.error("No STRIPE_SECRET_KEY found in .env");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20",
});

async function createProductAndPrice(name, amount, interval = null) {
  console.log(`Creating product: ${name}...`);
  const product = await stripe.products.create({
    name,
  });

  const priceData = {
    product: product.id,
    unit_amount: amount,
    currency: "usd",
  };

  if (interval) {
    priceData.recurring = { interval };
  }

  const price = await stripe.prices.create(priceData);
  console.log(`  -> Created price: ${price.id}`);
  return price.id;
}

async function main() {
  console.log("Starting Stripe setup...");

  const prices = {
    NEXT_PUBLIC_STRIPE_PRICE_FEATURED_MONTHLY: await createProductAndPrice("Featured Tier (Monthly)", 1000, "month"),
    NEXT_PUBLIC_STRIPE_PRICE_FEATURED_ANNUAL: await createProductAndPrice("Featured Tier (Annual)", 10000, "year"),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY: await createProductAndPrice("Pro Tier (Monthly)", 2900, "month"),
    NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL: await createProductAndPrice("Pro Tier (Annual)", 29000, "year"),
    NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY: await createProductAndPrice("Enterprise Tier (Monthly)", 9900, "month"),
    NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL: await createProductAndPrice("Enterprise Tier (Annual)", 99000, "year"),

    NEXT_PUBLIC_STRIPE_PRICE_BOOST_7DAY: await createProductAndPrice("Listing Boost (7 Days)", 500),
    NEXT_PUBLIC_STRIPE_PRICE_BOOST_30DAY: await createProductAndPrice("Listing Boost (30 Days)", 1500),
    NEXT_PUBLIC_STRIPE_PRICE_EXTRA_PHOTO: await createProductAndPrice("Extra Photo Slot", 200),
    NEXT_PUBLIC_STRIPE_PRICE_REVIEW_CAMPAIGN: await createProductAndPrice("Review Campaign", 4900),
    NEXT_PUBLIC_STRIPE_PRICE_QR_CODE: await createProductAndPrice("QR Code Pack", 900),
    NEXT_PUBLIC_STRIPE_PRICE_AI_DESC: await createProductAndPrice("AI Description Writer", 1900),
    NEXT_PUBLIC_STRIPE_PRICE_LEAD_UNLOCK: await createProductAndPrice("Lead Unlock", 300),
  };

  console.log("\nUpdating .env file...");

  const newEnvLines = envLines.map((line) => {
    for (const [key, value] of Object.entries(prices)) {
      if (line.startsWith(`${key}=`)) {
        return `${key}=${value}`;
      }
    }
    return line;
  });

  fs.writeFileSync(envPath, newEnvLines.join("\n"));
  console.log(".env file updated successfully!");
  console.log("Stripe setup complete.");
}

main().catch((err) => {
  console.error("Error setting up Stripe:", err);
  process.exit(1);
});
