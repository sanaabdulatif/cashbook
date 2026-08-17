export type UserRole = 'owner' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface CashBook {
  id: string;
  business_id: string; // References Book.id (Business)
  name: string;
  opening_balance: number;
  created_at: string;
}

export interface Book {
  id: string;
  name: string;
  currency: string;
  opening_balance: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface BookMember {
  id: string;
  book_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
  profile?: Profile;
  access_for?: string;
}

export interface Category {
  id: string;
  book_id: string;
  name: string;
  type: 'cash_in' | 'cash_out' | 'both';
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  book_id: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  description: string;
  date: string;
  category_id?: string;
  category?: Category;
  payment_method?: 'Cash' | 'Bank' | 'Card' | 'UPI' | 'Other';
  note?: string;
  attachment_url?: string;
  attachment_name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  book_id: string;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
  profile?: Profile;
}

export interface BookSummary {
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  currentBalance: number;
}
