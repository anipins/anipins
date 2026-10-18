export type RazorpayPaymentEvent = {
  event_id: string;
  payment_id: string;
  subscription_id: string;
  user_id: number;
  event_type: string;
  status: string;
  amount: number | null;
  currency: string;
  method: string;
  occurred_at: number;
};

export function extractRazorpayPaymentEvent(event: unknown, userId: number): RazorpayPaymentEvent | null;
