import { supabase } from '../supabase';
import type { Book, CashBook, BookMember } from '../../types';

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createBook(book: { name: string; currency: string; opening_balance: number; user_id: string }): Promise<Book> {
  const { data, error } = await supabase
    .from('businesses')
    .insert([{
      name: book.name,
      currency: book.currency,
      opening_balance: book.opening_balance,
      user_id: book.user_id
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchCashBooks(businessId: string): Promise<CashBook[]> {
  const { data, error } = await supabase
    .from('cashbooks')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createCashBook(cashBook: Omit<CashBook, 'id' | 'created_at'>): Promise<CashBook> {
  const { data, error } = await supabase
    .from('cashbooks')
    .insert([{
      business_id: cashBook.business_id,
      name: cashBook.name,
      opening_balance: cashBook.opening_balance
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBookMembers(bookId: string): Promise<BookMember[]> {
  const { data, error } = await supabase
    .from('book_members')
    .select('*, profile:profiles(*)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  
  // Format to match the frontend BookMember type where profile is optional
  return (data || []).map((m: any) => ({
    id: m.id,
    book_id: m.book_id,
    user_id: m.user_id,
    role: m.role,
    access_for: m.access_for,
    created_at: m.created_at,
    profile: m.profile ? {
      id: m.profile.id,
      email: m.profile.email,
      full_name: m.profile.full_name,
      avatar_url: m.profile.avatar_url,
      created_at: m.profile.created_at
    } : undefined
  }));
}

export async function inviteBookMember(bookId: string, email: string, role: 'owner' | 'editor' | 'viewer', accessFor: string): Promise<BookMember> {
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1);
  
  if (pError) throw pError;
  const userProfileId = profiles?.[0]?.id;
  if (!userProfileId) {
    throw new Error(`No registered user found with email ${email}`);
  }

  const { data, error } = await supabase
    .from('book_members')
    .insert([{
      book_id: bookId,
      user_id: userProfileId,
      role,
      access_for: accessFor
    }])
    .select('*, profile:profiles(*)')
    .single();
  if (error) throw error;
  
  return {
    id: data.id,
    book_id: data.book_id,
    user_id: data.user_id,
    role: data.role,
    access_for: data.access_for,
    created_at: data.created_at,
    profile: data.profile ? {
      id: data.profile.id,
      email: data.profile.email,
      full_name: data.profile.full_name,
      avatar_url: data.profile.avatar_url,
      created_at: data.profile.created_at
    } : undefined
  };
}

export async function updateBookMemberRole(memberId: string, role: 'owner' | 'editor' | 'viewer'): Promise<BookMember> {
  const { data, error } = await supabase
    .from('book_members')
    .update({ role })
    .eq('id', memberId)
    .select('*, profile:profiles(*)')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    book_id: data.book_id,
    user_id: data.user_id,
    role: data.role,
    access_for: data.access_for,
    created_at: data.created_at,
    profile: data.profile ? {
      id: data.profile.id,
      email: data.profile.email,
      full_name: data.profile.full_name,
      avatar_url: data.profile.avatar_url,
      created_at: data.profile.created_at
    } : undefined
  };
}

export async function deleteBookMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('book_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}
