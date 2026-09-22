/**
 * RAZORPAY PAYMENT CONFIGURATION
 * -------------------------------------------------------------
 * Easy configuration for your Razorpay Account.
 *
 * HOW TO GET YOUR KEYS:
 * 1. Log in to your Razorpay Dashboard: https://dashboard.razorpay.com/app/keys
 * 2. In the left sidebar, navigate to Account & Settings -> API Keys.
 * 3. Generate or copy your Key ID (and Key Secret if using server-side order creation).
 * 4. Paste your Key ID below in `keyId`.
 * 5. Set `isTestMode: false` when you are ready to accept real customer payments!
 */

export interface RazorpayConfig {
  /**
   * Your Razorpay Key ID.
   * Test keys start with `rzp_test_`
   * Live keys start with `rzp_live_`
   */
  keyId: string;

  /**
   * Your Razorpay Key Secret (used for server-side verification).
   */
  keySecret: string;

  /**
   * Currency code for payments.
   * Examples: 'USD', 'INR', 'EUR', 'GBP'
   */
  currency: string;

  /**
   * Currency symbol displayed in UI ($ for USD, ₹ for INR, etc.)
   */
  currencySymbol: string;

  /**
   * Your company or business name displayed on the payment checkout popup.
   */
  companyName: string;

  /**
   * Short description of your digital products shown on checkout.
   */
  companyDescription: string;

  /**
   * Brand accent color used for Razorpay header and buttons.
   * Razorpay navy/blue: '#0c2340' or Brand Indigo: '#6366f1'
   */
  themeColor: string;

  /**
   * Customer support email address.
   */
  supportEmail: string;

  /**
   * Set to `true` during development/testing.
   * Change to `false` when launching live to real customers.
   */
  isTestMode: boolean;
}

export const RAZORPAY_CONFIG: RazorpayConfig = {
  // ⬇️ REPLACE THIS WITH YOUR RAZORPAY KEY ID:
  keyId: 'rzp_test_Tch2pFyFPMnE7Z',

  // ⬇️ REPLACE THIS WITH YOUR RAZORPAY KEY SECRET (optional for client checkout):
  keySecret: 'e3lE42kaMxUlxDkewr9qOzQG',

  // Store Currency ('USD' for US Dollars, 'INR' for Indian Rupees)
  currency: 'USD',
  currencySymbol: '$',

  // Business & Branding details
  companyName: 'aa21pa-digits',
  companyDescription: 'Curated PDF E-Books & Handbooks',
  themeColor: '#0c2340', // Razorpay signature dark navy blue
  supportEmail: 'aa21pa-solutions@gmail.com',

  // Set false for live production
  isTestMode: true,
};
