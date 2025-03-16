"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Grid,
  CreditCard,
  ClipboardList,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { ToothIcon } from "@/components/icons/ToothIcon";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  current?: boolean;
  submenu?: { title: string; href: string }[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: <CreditCard className="h-5 w-5" />,
    current: true,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: <Grid className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    title: "Dental Charts",
    href: "/dental-charts",
    icon: <ToothIcon className="h-5 w-5" />,
    submenu: [
      {
        title: "Recent Charts",
        href: "/dental-charts/recent",
      },
      {
        title: "Chart Templates",
        href: "/dental-charts/templates",
      }
    ]
  },
];

export function Sidebar({ userRole = "staff" }: { userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-50 lg:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform lg:translate-x-0 lg:static lg:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              DentChartzz
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
} 