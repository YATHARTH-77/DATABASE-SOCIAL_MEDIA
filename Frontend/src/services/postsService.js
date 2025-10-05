import { supabase } from '../lib/supabase';

export const postsService = {
  async getFeedPosts(limit = 20) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        post_id,
        caption,
        created_at,
        user_id,
        users (
          user_id,
          username,
          profile_pic_url
        ),
        media (
          media_id,
          media_url,
          media_type
        ),
        post_likes (
          user_id
        ),
        comments (
          comment_id
        ),
        post_hashtags (
          hashtags (
            hashtag_text
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return posts.map(post => ({
      id: post.post_id,
      username: post.users?.username || 'unknown',
      avatar: post.users?.profile_pic_url || '',
      userId: post.user_id,
      time: formatTimeAgo(post.created_at),
      caption: post.caption || '',
      hashtags: post.post_hashtags?.map(ph => `#${ph.hashtags.hashtag_text}`) || [],
      likes: post.post_likes?.length || 0,
      comments: post.comments?.length || 0,
      media: post.media || [],
    }));
  },

  async likePost(postId, userId) {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (error) throw error;
  },

  async unlikePost(postId, userId) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .match({ post_id: postId, user_id: userId });

    if (error) throw error;
  },

  async savePost(postId, userId) {
    const { error } = await supabase
      .from('saved_posts')
      .insert({ post_id: postId, user_id: userId });

    if (error) throw error;
  },

  async unsavePost(postId, userId) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .match({ post_id: postId, user_id: userId });

    if (error) throw error;
  },

  async getUserPosts(userId) {
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        post_id,
        caption,
        created_at,
        media (
          media_id,
          media_url,
          media_type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return posts;
  },

  async getSavedPosts(userId) {
    const { data: savedPosts, error } = await supabase
      .from('saved_posts')
      .select(`
        posts (
          post_id,
          caption,
          created_at,
          media (
            media_id,
            media_url,
            media_type
          )
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return savedPosts.map(sp => sp.posts);
  },
};

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
