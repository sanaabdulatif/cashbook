import { supabase } from '../supabase';
import type { ActivityLog } from '../../types';

export async function fetchActivityLogs(bookId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, profile:profiles(*)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  
  return (data || []).map((log: any) => ({
    id: log.id,
    book_id: log.book_id,
    user_id: log.user_id,
    action: log.action,
    details: log.details,
    created_at: log.created_at,
    profile: log.profile ? {
      id: log.profile.id,
      email: log.profile.email,
      full_name: log.profile.full_name,
      avatar_url: log.profile.avatar_url,
      created_at: log.profile.created_at
    } : undefined
  }));
}

export async function createActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{
      book_id: log.book_id,
      user_id: user.id,
      action: log.action,
      details: log.details
    }])
    .select('*, profile:profiles(*)')
    .single();
  if (error) throw error;
  
  return {
    id: data.id,
    book_id: data.book_id,
    user_id: data.user_id,
    action: data.action,
    details: data.details,
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
