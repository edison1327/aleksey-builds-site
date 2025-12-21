import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Navigation Links
export interface NavigationLink {
  id: string;
  label: string;
  path: string;
  icon: string;
  location: string;
  sort_order: number;
  is_active: boolean;
}

// Team Stats
export interface TeamStat {
  id: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

// Social Links
export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

// Types
export interface HeroContent {
  id: string;
  title: string;
  subtitle: string;
  description: string | null;
  badge_text: string | null;
  projects_count: number | null;
  years_count: number | null;
  clients_percentage: number | null;
  video_url: string | null;
  background_type: string | null;
  background_image_url: string | null;
  overlay_opacity: number | null;
  overlay_color: string | null;
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  features: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  year: number | null;
  image_url: string | null;
  gallery_images: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Machinery {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface Vehicle {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  is_available: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ContactInfo {
  id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  business_hours: string | null;
  google_maps_url: string | null;
}

// Hook for Hero Content
export const useHeroContent = () => {
  const [data, setData] = useState<HeroContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: heroData } = await supabase
        .from("hero_content")
        .select("*")
        .maybeSingle();
      
      setData(heroData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Hook for Services
export const useServices = () => {
  const [data, setData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      setData(services || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Hook for Projects
export const useProjects = (limit?: number) => {
  const [data, setData] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("projects")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: projects } = await query;
      setData(projects || []);
      setIsLoading(false);
    };
    fetchData();
  }, [limit]);

  return { data, isLoading };
};

// Hook for Machinery
export const useMachinery = (limit?: number) => {
  const [data, setData] = useState<Machinery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("machinery")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: machinery } = await query;
      setData(machinery || []);
      setIsLoading(false);
    };
    fetchData();
  }, [limit]);

  return { data, isLoading };
};

// Hook for Vehicles
export const useVehicles = (limit?: number) => {
  const [data, setData] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data: vehicles } = await query;
      setData(vehicles || []);
      setIsLoading(false);
    };
    fetchData();
  }, [limit]);

  return { data, isLoading };
};

// Hook for Contact Info
export const useContactInfo = () => {
  const [data, setData] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: contactInfo } = await supabase
        .from("contact_info")
        .select("*")
        .maybeSingle();
      
      setData(contactInfo);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Types for About Content
export interface AboutContent {
  id: string;
  title: string;
  description: string | null;
  mission: string | null;
  vision: string | null;
  values: string[] | null;
  image_url: string | null;
}

// Hook for About Content
export const useAboutContent = () => {
  const [data, setData] = useState<AboutContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: aboutData } = await supabase
        .from("about_content")
        .select("*")
        .maybeSingle();
      
      setData(aboutData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Types for Testimonials
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
}

// Hook for Testimonials
export const useTestimonials = () => {
  const [data, setData] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: testimonials } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      setData(testimonials || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Hook for Navigation Links
export const useNavigationLinks = (location?: string) => {
  const [data, setData] = useState<NavigationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      let query = supabase
        .from("navigation_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (location) {
        query = query.eq("location", location);
      }
      
      const { data: links } = await query;
      setData(links || []);
      setIsLoading(false);
    };
    fetchData();
  }, [location]);

  return { data, isLoading };
};

// Hook for Team Stats
export const useTeamStats = () => {
  const [data, setData] = useState<TeamStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: stats } = await supabase
        .from("team_stats")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      setData(stats || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};

// Hook for Social Links
export const useSocialLinks = () => {
  const [data, setData] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: links } = await supabase
        .from("social_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      setData(links || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return { data, isLoading };
};
