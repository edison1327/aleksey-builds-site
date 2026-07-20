import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole =
  | 'admin'
  | 'manager'
  | 'editor'
  | 'viewer'
  | 'operator'
  | 'supplier'
  | 'client'
  | 'user';

export type PermAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

interface PermissionRow {
  role: AppRole;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  scope: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  roles: AppRole[];
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isOperator: boolean;
  isSupplier: boolean;
  isClient: boolean;
  /** admin | manager | editor | viewer | operator (can access CMS/back-office UI). */
  isStaff: boolean;
  /** admin OR manager (can manage users, approve, etc.). */
  isAdminOrManager: boolean;
  branchIds: string[];
  can: (module: string, action?: PermAction) => boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_PRIORITY: AppRole[] = [
  'admin', 'manager', 'editor', 'operator', 'viewer', 'supplier', 'client', 'user',
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadContext = (userId: string) => {
    setTimeout(async () => {
      try {
        const [rolesRes, branchesRes] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', userId),
          supabase.from('user_branches').select('branch_id').eq('user_id', userId),
        ]);
        const myRoles = ((rolesRes.data ?? []).map((r: any) => r.role as AppRole));
        setRoles(myRoles.length ? myRoles : ['user']);
        setBranchIds((branchesRes.data ?? []).map((b: any) => b.branch_id as string));

        if (myRoles.length) {
          const permsRes = await supabase
            .from('role_permissions')
            .select('*')
            .in('role', myRoles as any);
          setPermissions((permsRes.data ?? []) as PermissionRow[]);
        } else {
          setPermissions([]);
        }
      } catch {
        setRoles(['user']);
        setPermissions([]);
        setBranchIds([]);
      }
    }, 0);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) loadContext(session.user.id);
        else { setRoles([]); setPermissions([]); setBranchIds([]); }
        setIsLoading(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadContext(session.user.id);
      setIsLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email, password, options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]); setPermissions([]); setBranchIds([]);
  };

  const isAdmin = roles.includes('admin');
  const isManager = roles.includes('manager');
  const isEditor = roles.includes('editor');
  const isViewer = roles.includes('viewer');
  const isOperator = roles.includes('operator');
  const isSupplier = roles.includes('supplier');
  const isClient = roles.includes('client');
  const isAdminOrManager = isAdmin || isManager;
  const isStaff = isAdmin || isManager || isEditor || isViewer || isOperator;

  const role: AppRole =
    ROLE_PRIORITY.find((r) => roles.includes(r)) ?? 'user';

  const can = useCallback((module: string, action: PermAction = 'view') => {
    if (isAdmin) return true;
    return permissions.some((p) => {
      if (p.module !== module) return false;
      switch (action) {
        case 'view': return p.can_view;
        case 'create': return p.can_create;
        case 'edit': return p.can_edit;
        case 'delete': return p.can_delete;
        case 'approve': return p.can_approve;
        default: return false;
      }
    });
  }, [isAdmin, permissions]);

  return (
    <AuthContext.Provider value={{
      user, session, role, roles,
      isAdmin, isManager, isEditor, isViewer, isOperator, isSupplier, isClient,
      isStaff, isAdminOrManager, branchIds, can,
      isLoading, signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
