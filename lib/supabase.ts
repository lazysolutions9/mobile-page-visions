import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://fhwktehwsqmdfyvocdvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZod2t0ZWh3c3FtZGZ5dm9jZHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTI5MzksImV4cCI6MjA2NjE2ODkzOX0.gKhhJ7cKFSsqhQye1wK6qNNDnzul-d_CVV6-z5kEooU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 