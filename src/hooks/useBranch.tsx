import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Branch = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  city: string | null;
  is_active: boolean;
};

type Ctx = {
  branches: Branch[];
  currentBranchId: string | null;
  setCurrentBranchId: (id: string | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const STORAGE_KEY = "current_branch_id";
const BranchContext = createContext<Ctx | null>(null);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranchId, setCurrentBranchIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(true);

  const setCurrentBranchId = (id: string | null) => {
    setCurrentBranchIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const load = async () => {
    if (!user) { setBranches([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("branches")
      .select("id, organization_id, code, name, city, is_active")
      .eq("is_active", true)
      .order("name");
    setBranches((data as Branch[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const value = useMemo(
    () => ({ branches, currentBranchId, setCurrentBranchId, loading, refresh: load }),
    [branches, currentBranchId, loading]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be inside BranchProvider");
  return ctx;
}
