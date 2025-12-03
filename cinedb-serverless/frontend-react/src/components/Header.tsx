import { Film, Search, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 group">
            <Film className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              <span className="text-foreground">Cine</span>
              <span className="text-primary">DB</span>
            </span>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search movies..." 
              className="pl-10 w-64 bg-secondary/50 border-border/50 focus:border-primary"
            />
          </div>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-popover" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              className="hidden md:inline-flex"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
