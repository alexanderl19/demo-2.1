import type { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required."
  );

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
