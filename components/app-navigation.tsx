"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  AlertCircle,
  Hospital,
  CreditCard,
  MessageCircle,
  Settings,
  LogOut,
  History,
  LayoutDashboard,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const userNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/emergency", icon: AlertCircle, label: "Emergency" },
  { href: "/hospitals", icon: Hospital, label: "Hospitals" },
  { href: "/health-card", icon: CreditCard, label: "Health Card" },
  { href: "/history", icon: History, label: "History" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
]

const adminNavItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/appointments", icon: Hospital, label: "Appointments" },
  { href: "/admin/doctors", icon: User, label: "Doctors" },
  { href: "/admin/beds", icon: Hospital, label: "Beds" },
]

interface AppNavigationProps {
  isAdmin?: boolean
}

export function AppNavigation({ isAdmin = false }: AppNavigationProps) {
  const pathname = usePathname()
  const navItems = isAdmin ? adminNavItems : userNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-t border-primary/5 md:top-0 md:bottom-auto md:right-auto md:border-t-0 md:border-r md:h-screen md:w-20 lg:w-64 transition-all duration-500">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:pt-4 md:gap-1 p-2 md:h-full">
        {/* Logo - Desktop only */}
        <div className="hidden md:flex items-center gap-3 px-6 pb-8 pt-4 w-full">
          <div className="h-11 w-11 rounded-[18px] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20 transition-transform hover:scale-105 duration-300">
            <span className="text-white font-black text-xl tracking-tighter">M+</span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-100">MediCare+</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 dark:text-primary/70 -mt-1 italic">Patient Portal</span>
          </div>
        </div>

        <div className="flex md:flex-col gap-1 w-full px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:px-5 md:py-3.5 rounded-2xl transition-all duration-300 md:w-full group relative",
                  isActive
                    ? "text-primary bg-primary/10 shadow-sm shadow-primary/5"
                    : "text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-primary/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full hidden md:block" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className={cn(
                  "text-[10px] md:text-sm lg:inline hidden md:hidden lg:inline font-bold tracking-tight transition-colors",
                  isActive ? "text-primary" : "text-slate-500 dark:text-slate-400 group-hover:text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Bottom Actions */}
        {!isAdmin && (
          <div className="hidden md:block mt-auto w-full px-2 pb-6 space-y-1">
             <div className="h-px w-full bg-primary/5 mb-6" />
             <Link
              href="/profile"
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 w-full rounded-2xl transition-all duration-300 group",
                pathname === "/profile"
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Settings className={cn("h-5 w-5 transition-transform duration-500", pathname === "/profile" ? "rotate-45" : "group-hover:rotate-45")} />
              <span className="hidden lg:inline text-sm">Settings</span>
            </Link>
            <Link
              href="/auth"
              className="flex items-center gap-4 px-5 py-3.5 w-full text-slate-500 dark:text-slate-400 hover:text-emergency hover:bg-emergency/5 rounded-2xl transition-all duration-300 group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              <span className="hidden lg:inline text-sm font-bold">Logout</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
