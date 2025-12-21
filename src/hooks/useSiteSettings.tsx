import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  id: string;
  logo_url: string | null;
  company_name: string;
  tagline: string;
  footer_description: string | null;
  footer_copyright: string | null;
  created_at: string;
  updated_at: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<SiteSettings>) => {
      // Get the existing settings row
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .single();

      if (!existing) throw new Error("No site settings found");

      const { data, error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};
