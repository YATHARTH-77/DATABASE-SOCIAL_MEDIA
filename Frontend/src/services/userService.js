import { supabase } from '../lib/supabase';

export const userService = {
  async getUserProfile(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        user_id,
        username,
        email,
        full_name,
        profile_pic_url,
        is_private,
        follower_count,
        created_at
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return user;
  },

  async getUserByUsername(username) {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        user_id,
        username,
        email,
        full_name,
        profile_pic_url,
        is_private,
        follower_count,
        created_at
      `)
      .eq('username', username)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return user;
  },

  async getFollowerCount(userId) {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (error) throw error;
    return count || 0;
  },

  async getFollowingCount(userId) {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    if (error) throw error;
    return count || 0;
  },

  async getPostCount(userId) {
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  },

  async isFollowing(followerId, followingId) {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async followUser(followerId, followingId) {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });

    if (error) throw error;

    await supabase
      .from('users')
      .update({ follower_count: supabase.raw('follower_count + 1') })
      .eq('user_id', followingId);
  },

  async unfollowUser(followerId, followingId) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: followerId, following_id: followingId });

    if (error) throw error;

    await supabase
      .from('users')
      .update({ follower_count: supabase.raw('follower_count - 1') })
      .eq('user_id', followingId);
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
