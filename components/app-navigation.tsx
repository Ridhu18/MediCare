"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  AlertCircle,
  Hospital,
  CreditCard,
  MessageCircle,
  User,
  LayoutDashboard,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const userNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/emergency", icon: AlertCircle, label: "Emergency" },
  { href: "/hospitals", icon: Hospital, label: "Hospitals" },
  { href: "/health-card", icon: CreditCard, label: "Health Card" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Profile" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:top-0 md:bottom-auto md:right-auto md:border-t-0 md:border-r md:h-screen md:w-20 lg:w-64">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:pt-6 md:gap-2 p-2 md:h-full">
        {/* Logo - Desktop only */}
        <div className="hidden md:flex items-center gap-3 px-4 pb-6 border-b border-border w-full">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M+</span>
          </div>
          <span className="hidden lg:block font-bold text-lg">MediCare+</span>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-3 p-2 md:px-4 md:py-3 rounded-lg transition-colors md:w-full",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs md:text-sm lg:inline hidden md:hidden lg:inline">
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Logout (Patient/User only) */}
        {!isAdmin && (
          <div className="hidden md:block border-t border-border mt-auto w-full">
            <Link
              href="/auth"
              className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline">Logout</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
