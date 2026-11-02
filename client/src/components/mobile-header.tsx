import React from 'react';
import { Link } from 'wouter';
import { Bell, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { PakistanypLogo, FlagStripe } from '@/components/brand/pakistanyp-logo';
import { localize } from '@shared/country';

function MobileHeader() {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#E7E9EE] md:hidden">
      <FlagStripe />
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center" aria-label={localize("PakistanYP home")}>
          <PakistanypLogo height={44} />
        </Link>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          
          {isAuthenticated ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.profileImageUrl} />
                      <AvatarFallback>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/dashboard" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                    <Link href="/my-businesses" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        My Businesses
                      </Button>
                    </Link>
                    <Link href="/profile" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        Profile Settings
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600"
                      onClick={() => window.location.href = '/api/auth/logout'}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;