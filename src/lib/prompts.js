import { isSupabaseConfigured, supabase } from './supabase';

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }
}

function mapPromptFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    text: row.text,
    category: row.category,
    usageCount: row.usage_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPromptToRow(prompt) {
  return {
    title: prompt.title,
    text: prompt.text,
    category: prompt.category,
    usage_count: prompt.usageCount ?? 0,
  };
}

export async function fetchPrompts() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('prompts')
    .select('id,user_id,title,text,category,usage_count,created_at,updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(mapPromptFromRow);
}

export async function createPrompt(prompt) {
  assertSupabaseConfigured();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('You must be signed in to save prompts.');
  }

  const { data, error } = await supabase
    .from('prompts')
    .insert({
      ...mapPromptToRow(prompt),
      user_id: user.id,
    })
    .select('id,user_id,title,text,category,usage_count,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapPromptFromRow(data);
}

export async function updatePrompt(promptId, prompt) {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('prompts')
    .update(mapPromptToRow(prompt))
    .eq('id', promptId)
    .select('id,user_id,title,text,category,usage_count,created_at,updated_at')
    .single();

  if (error) {
    throw error;
  }

  return mapPromptFromRow(data);
}

export async function deletePrompt(promptId) {
  assertSupabaseConfigured();

  const { error } = await supabase.from('prompts').delete().eq('id', promptId);

  if (error) {
    throw error;
  }
}
