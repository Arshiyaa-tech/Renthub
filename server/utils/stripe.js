/**
 * Stripe SDK Initialization
 *
 * Initializes the Stripe instance using the secret key from environment.
 * All Stripe operations should use this instance.
 */

const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: null })
  : null;

module.exports = stripe;
