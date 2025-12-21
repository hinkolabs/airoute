export interface DbUser {
  id: string;
  email: string;
  subscription_plan: string;
  billing_cycle: string | null;
  credits: number;
  next_billing_date: string | null;
  customer_id: string | null;
  created_at: string;
}













