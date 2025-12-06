import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
