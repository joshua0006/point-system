
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  ShoppingBag, 
  MessageCircle, 
  LayoutDashboard,
  User,
  LogOut,
  X
} from 'lucide-react';

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const closeMenu = () => setIsOpen(false);

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    ...(user ? [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/messages', label: 'Messages', icon: MessageCircle },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeMenu}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>

            {/* User Section */}
            {user && (
              <div className="border-t p-4 space-y-2">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Profile</span>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    closeMenu();
                    signOut();
                  }}
                  className="w-full justify-start gap-3 p-3 h-auto"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </Button>
              </div>
            )}

            {/* Auth Section for non-logged in users */}
            {!user && (
              <div className="border-t p-4">
                <Link to="/auth" onClick={closeMenu}>
                  <Button className="w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
