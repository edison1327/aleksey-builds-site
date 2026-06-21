import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Shield, ChevronDown, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MfaSetupDialog from "./MfaSetupDialog";

interface UserMenuProps {
  collapsed?: boolean;
}

const UserMenu = ({ collapsed = false }: UserMenuProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mfaOpen, setMfaOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
  };

  const getUserName = (email: string) => {
    return email.split("@")[0];
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full gap-2 ${collapsed ? "justify-center px-2" : "justify-start"} hover:bg-muted`}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(user.email || "U")}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserName(user.email || "Usuario")}
                </p>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={isAdmin ? "default" : "secondary"} 
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {isAdmin ? "Admin" : "Usuario"}
                  </Badge>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {getInitials(user.email || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getUserName(user.email || "Usuario")}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {isAdmin ? (
                <Badge className="gap-1">
                  <Shield className="h-3 w-3" />
                  Administrador
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <User className="h-3 w-3" />
                  Usuario
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setMfaOpen(true)} className="cursor-pointer">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Seguridad (2FA)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
      <MfaSetupDialog open={mfaOpen} onOpenChange={setMfaOpen} />
    </DropdownMenu>
  );
};

export default UserMenu;
