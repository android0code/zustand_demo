import { Platform } from 'react-native';
import { RAZORPAY_CONFIG } from '@/config/razorpay';

export interface RazorpayPaymentSuccessResult {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayPaymentErrorResult {
  code: string;
  description: string;
  source?: string;
  step?: string;
  reason?: string;
}

export interface OpenRazorpayOptions {
  amount: number; // in standard currency units (e.g. 2.99 for $2.99)
  currency?: string;
  name?: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  notes?: Record<string, string>;
  onSuccess: (result: RazorpayPaymentSuccessResult) => void;
  onDismiss?: () => void;
  onError?: (error: RazorpayPaymentErrorResult) => void;
}

let scriptLoadPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Razorpay Checkout SDK script on web:
 * https://checkout.razorpay.com/v1/checkout.js
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve) => {
    // Safety timeout: never hang indefinitely
    const timer = setTimeout(() => {
      resolve(Boolean((window as any).Razorpay));
    }, 3500);

    const existing = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).Razorpay) {
        clearTimeout(timer);
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => {
        clearTimeout(timer);
        resolve(true);
      });
      existing.addEventListener('error', () => {
        clearTimeout(timer);
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    script.onerror = (e) => {
      clearTimeout(timer);
      console.warn('Failed to load official Razorpay Checkout script:', e);
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Launches the official Razorpay Checkout popup so that the payment is
 * genuinely authorized and logged in your Razorpay Dashboard (Test or Live).
 */
export async function openOfficialRazorpayCheckout(
  options: OpenRazorpayOptions
): Promise<boolean> {
  if (Platform.OS !== 'web') {
    return false;
  }

  const loaded = await loadRazorpayCheckoutScript();
  if (!loaded || !(window as any).Razorpay) {
    console.warn('Razorpay SDK script not available on window, falling back');
    return false;
  }

  // Domestic Indian Razorpay accounts only accept INR unless International Payments
  // are activated with an order_id from the backend. Defaulting to INR ensures
  // Razorpay accepts the payment seamlessly without "Currency USD not supported" error.
  const isIndianAccount =
    RAZORPAY_CONFIG.keyId.startsWith('rzp_test_') ||
    RAZORPAY_CONFIG.keyId.startsWith('rzp_live_');
  const activeCurrency = isIndianAccount ? 'INR' : options.currency || RAZORPAY_CONFIG.currency || 'INR';

  // If charging in INR for a store displaying USD: approximate conversion $1 = ₹86
  const calculatedAmount =
    activeCurrency === 'INR' && RAZORPAY_CONFIG.currency === 'USD'
      ? Math.max(100, Math.round(options.amount * 86 * 100))
      : Math.max(100, Math.round(options.amount * 100));

  const launchWithCurrency = (curr: string, amt: number) => {
    const razorpayOptions: any = {
      key: RAZORPAY_CONFIG.keyId,
      amount: amt,
      currency: curr,
      name: options.name || RAZORPAY_CONFIG.companyName,
      description: options.description || RAZORPAY_CONFIG.companyDescription,
      image: '/30Days_Hustle.png',
      prefill: {
        email: options.customerEmail || undefined,
        contact: options.customerPhone || '9876543210',
        name: options.customerName || undefined,
      },
      notes: {
        ...options.notes,
        product: options.description || 'Digital PDF E-Book',
        delivery: 'Instant Digital PDF Download',
        merchant: RAZORPAY_CONFIG.companyName,
      },
      theme: {
        color: RAZORPAY_CONFIG.themeColor || '#6366f1',
      },
      handler: function (response: any) {
        if (response && response.razorpay_payment_id) {
          options.onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        }
      },
      modal: {
        ondismiss: function () {
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
    };

    try {
      const rzpInstance = new (window as any).Razorpay(razorpayOptions);

      rzpInstance.on('payment.failed', function (resp: any) {
        console.warn('Razorpay payment authorization failed:', resp?.error);

        const errorDesc = resp?.error?.description || '';
        const errorReason = resp?.error?.reason || '';
        const errorCode = resp?.error?.code || '';

        if (
          curr === 'USD' &&
          (errorDesc.toLowerCase().includes('currency') || errorDesc.toLowerCase().includes('not supported'))
        ) {
          console.log('Retrying Razorpay Checkout in INR for domestic merchant account...');
          const inrAmount = Math.max(100, Math.round(options.amount * 86 * 100));
          launchWithCurrency('INR', inrAmount);
          return;
        }

        let friendlyMsg = errorDesc || 'Payment was not completed';
        const combinedError = `${errorDesc} ${errorReason} ${errorCode}`.toLowerCase();
        if (
          combinedError.includes('international') ||
          combinedError.includes('business') ||
          combinedError.includes('not allowed')
        ) {
          friendlyMsg = RAZORPAY_CONFIG.isTestMode
            ? 'International cards are disabled on this Razorpay merchant account. In Test Mode: please use domestic test card 4012 0000 0000 0002, or choose UPI / Netbanking and click the green "Success" button. (Do not use card 4242 which is flagged as foreign).'
            : 'International cards are not supported on this merchant account. Please choose UPI, Indian Debit/Credit Card, or Netbanking.';
        }

        if (options.onError) {
          options.onError({
            code: errorCode || 'PAYMENT_FAILED',
            description: friendlyMsg,
            reason: errorReason,
          });
        }
      });

      rzpInstance.open();
      return true;
    } catch (err: any) {
      console.error('Error opening Razorpay checkout instance:', err);
      return false;
    }
  };

  return launchWithCurrency(activeCurrency, calculatedAmount);
}
