import { createClient } from "@supabase/supabase-js";

// 1. Cliente HUB (A conta global - Autenticação e Perfil Base)
const hubUrl = process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!;
const hubKey = process.env.NEXT_PUBLIC_HUB_ANON_KEY!;

export const hubClient = createClient(hubUrl, hubKey);

// 2. Cliente STORIES (A rede social - Posts, Likes, etc)
const storiesUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const storiesKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const storiesClient = createClient(storiesUrl, storiesKey);