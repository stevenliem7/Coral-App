import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tncdfocnfgfbgiduvjhg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY2Rmb2NuZmdmYmdpZHV2amhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNTQwODEsImV4cCI6MjA3MjczMDA4MX0.3smJyIoKjQY1_cz4rYhKeR7DV1i9FqNs3zJA4DGwsGc'

export const supabase = createClient(supabaseUrl, supabaseKey)
