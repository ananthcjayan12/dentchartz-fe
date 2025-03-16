"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, Building2 } from "lucide-react";

export function UserNav() {
  const router = useRouter();
  const { user, logout, clinics, currentClinic, setCurrentClinic } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };
  
  // Use full_name if available, or construct from first_name and last_name, or use username
  const displayName = user?.full_name || 
    (user?.first_name || user?.last_name ? 
      `${user.first_name || ''} ${user.last_name || ''}`.trim() : 
      user?.username || "User");
  
  // Generate initials from the display name
  const userInitials = displayName !== "User" 
    ? displayName.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.jpg" alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-gray-500">{user?.email || user?.username || ""}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Clinic Selector */}
        {clinics && clinics.length > 0 && (
          
          <>
            <DropdownMenuLabel className="flex items-center">
              <Building2 className="mr-2 h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium">Current Clinic</span>
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup 
              value={currentClinic?.id?.toString()} 
              onValueChange={(value) => {
                const clinic = clinics.find(c => c.id.toString() === value);
                if (clinic) {
                  setCurrentClinic(clinic);
                }
              }}
            >
              {clinics.map((clinic) => (
                console.log(clinic),
                <DropdownMenuRadioItem key={clinic.id} value={clinic.id.toString()}>
                  {clinic.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer flex w-full">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer flex w-full">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 