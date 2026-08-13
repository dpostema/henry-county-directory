import Stripe from 'stripe';
const stripe = new Stripe('sk_test_51T1VpZR844HAYNTBKLMMfE3RRWA6xcOMHw3rfJHJaSBtVl4Xo4RvSv6X72gJPZrzB363iPo6LqCkDXIRtMKVGiMc007zSXFkmJ');

async function checkPrice() {
  try {
    const price = await stripe.prices.retrieve('price_1TzI0jR844HAYNTBAyLHolPx');
    console.log("Price exists:", price.id, price.unit_amount);
  } catch (err) {
    console.error("Error retrieving price:", err.message);
  }
}

checkPrice();
