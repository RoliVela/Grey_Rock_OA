import { createClient } from "@/lib/supabase/server";

export type BusinessMatch = {
  business_name: string;
  category: string;
  phone: string | null;
  neighborhood: string | null;
  website_url: string | null;
};

export async function getBusinessMatches(profileId: string): Promise<BusinessMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_business_matches", {
    p_profile_id: profileId,
  });
  if (error) throw error;
  return data ?? [];
}
