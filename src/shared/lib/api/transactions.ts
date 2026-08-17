import { supabase } from '../supabase';
import type { Transaction, Category } from '../../types';

export async function fetchCategories(bookId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('book_id', bookId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{
      book_id: category.book_id,
      name: category.name,
      type: category.type,
      is_default: category.is_default
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchTransactionsForBusiness(cashBookIds: string[]): Promise<Transaction[]> {
  if (cashBookIds.length === 0) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .in('book_id', cashBookIds)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      book_id: tx.book_id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      category_id: tx.category_id || null,
      payment_method: tx.payment_method,
      note: tx.note,
      attachment_url: tx.attachment_url,
      attachment_name: tx.attachment_name,
      created_by: user?.id || null
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(tx: Transaction): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      date: tx.date,
      category_id: tx.category_id || null,
      payment_method: tx.payment_method,
      note: tx.note,
      attachment_url: tx.attachment_url,
      attachment_name: tx.attachment_name
    })
    .eq('id', tx.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
