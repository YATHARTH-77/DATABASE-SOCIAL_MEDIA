import { supabase } from '../lib/supabase';

export const storiesService = {
  async getActiveStories() {
    const now = new Date().toISOString();

    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        story_id,
        media_url,
        created_at,
        expires_at,
        user_id,
        users (
          user_id,
          username,
          profile_pic_url
        ),
        story_views (
          user_id
        ),
        story_likes (
          user_id
        )
      `)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          username: story.users?.username || 'unknown',
          profilePic: story.users?.profile_pic_url || '',
          stories: [],
        };
      }
      acc[userId].stories.push({
        id: story.story_id,
        mediaUrl: story.media_url,
        timestamp: formatTimeAgo(story.created_at),
        views: story.story_views?.length || 0,
        likes: story.story_likes?.length || 0,
      });
      return acc;
    }, {});

    return Object.values(groupedStories);
  },

  async viewStory(storyId, userId) {
    const { error } = await supabase
      .from('story_views')
      .insert({ story_id: storyId, user_id: userId });

    if (error && error.code !== '23505') throw error;
  },

  async likeStory(storyId, userId) {
    const { error } = await supabase
      .from('story_likes')
      .insert({ story_id: storyId, user_id: userId });

    if (error) throw error;
  },

  async unlikeStory(storyId, userId) {
    const { error } = await supabase
      .from('story_likes')
      .delete()
      .match({ story_id: storyId, user_id: userId });

    if (error) throw error;
  },

  async createStory(userId, mediaUrl) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStory(storyId, userId) {
    const { error } = await supabase
      .from('stories')
      .delete()
      .match({ story_id: storyId, user_id: userId });

    if (error) throw error;
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
  return `${days}d ago`;
}
