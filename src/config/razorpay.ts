/**
 * RAZORPAY PAYMENT CONFIGURATION
 * -------------------------------------------------------------
 * Configured with dual environment support:
 * 1. Testing / Debug Details: Used during development, debugging, and local testing.
 * 2. Live Production Details: Used for real payments in production.
 *
 * HOW TO SWITCH:
 * - In Development (__DEV__ = true): Test credentials are used automatically.
 * - In Production: Set `EXPO_PUBLIC_IS_TEST_MODE=false` in .env to enable Live mode.
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
   * `true` during development/testing.
   * `false` when accepting live payments from real customers.
   */
  isTestMode: boolean;
}

// -----------------------------------------------------------------------------
// 1. TESTING CREDENTIALS (DEBUG MODE ONLY)
// -----------------------------------------------------------------------------
export const RAZORPAY_TEST_CREDENTIALS = {
  keyId: process.env.EXPO_PUBLIC_RAZORPAY_TEST_KEY_ID || 'rzp_test_Tch2pFyFPMnE7Z',
  keySecret:
    process.env.RAZORPAY_TEST_KEY_SECRET ||
    process.env.EXPO_PUBLIC_RAZORPAY_TEST_KEY_SECRET ||
    'e3lE42kaMxUlxDkewr9qOzQG',
};

// -----------------------------------------------------------------------------
// 2. LIVE CREDENTIALS (PRODUCTION REAL MONEY PAYMENTS)
// -----------------------------------------------------------------------------
export const RAZORPAY_LIVE_CREDENTIALS = {
  keyId: process.env.EXPO_PUBLIC_RAZORPAY_LIVE_KEY_ID || 'rzp_live_TkXit42sKW1toa',
  keySecret:
    process.env.RAZORPAY_LIVE_KEY_SECRET ||
    process.env.EXPO_PUBLIC_RAZORPAY_LIVE_KEY_SECRET ||
    'D5DJYB0YlYgUFuCFCGGE02A7',
};

// -----------------------------------------------------------------------------
// 3. SMART ACTIVE CONFIGURATION
// -----------------------------------------------------------------------------
// Development/Debug detection:
const isDevEnvironment =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.NODE_ENV !== 'production' ||
  process.env.EXPO_PUBLIC_APP_ENV === 'development';

// In development/debug, testing credentials are used for safe development.
// Set EXPO_PUBLIC_IS_TEST_MODE='false' in production to activate live payments.
export const isRazorpayTestMode: boolean =
  process.env.EXPO_PUBLIC_IS_TEST_MODE !== 'false' || isDevEnvironment;

export const RAZORPAY_CONFIG: RazorpayConfig = {
  // Key ID: switches between test and live based on environment
  keyId: isRazorpayTestMode
    ? RAZORPAY_TEST_CREDENTIALS.keyId
    : RAZORPAY_LIVE_CREDENTIALS.keyId,

  // Key Secret: switches between test and live
  keySecret: isRazorpayTestMode
    ? RAZORPAY_TEST_CREDENTIALS.keySecret
    : RAZORPAY_LIVE_CREDENTIALS.keySecret,

  // Currency & Store Branding
  currency: process.env.EXPO_PUBLIC_CURRENCY || 'USD',
  currencySymbol: process.env.EXPO_PUBLIC_CURRENCY_SYMBOL || '$',
  companyName: process.env.EXPO_PUBLIC_COMPANY_NAME || 'aa21pa-digits',
  companyDescription:
    process.env.EXPO_PUBLIC_COMPANY_DESC || 'Curated PDF E-Books & Handbooks',
  themeColor: process.env.EXPO_PUBLIC_THEME_COLOR || '#0c2340',
  supportEmail:
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'aa21pa-solutions@gmail.com',

  // Active mode flag
  isTestMode: isRazorpayTestMode,
};
