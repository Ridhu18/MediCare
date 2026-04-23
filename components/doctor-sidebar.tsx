"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Calendar,
    Users,
    Clock,
    Settings,
    LogOut,
    Stethoscope,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
    { href: "/doctor/patients", icon: Users, label: "Patients" },
    { href: "/doctor/schedule", icon: Clock, label: "Schedule" },
]

export function DoctorSidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setUser(data)
                }
            } catch (e) {
                console.error("Error fetching profile:", e)
            }
        }
        fetchProfile()
    }, [])

    return (
        <aside className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-t border-primary/5 md:top-0 md:bottom-auto md:right-auto md:border-t-0 md:border-r md:h-screen md:w-20 lg:w-64 flex flex-col hidden md:flex transition-all duration-500">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-6 pb-8 pt-4 relative">
                <div className="h-11 w-11 bg-gradient-to-br from-primary to-primary/80 rounded-[18px] flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20 transition-transform hover:scale-105 duration-300">
                    <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div className="hidden lg:flex flex-col">
                    <span className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-100">
                        MediCare<span className="text-primary">+</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 dark:text-primary/80 -mt-1 italic">Specialist Portal</span>
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 relative group md:w-full",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold shadow-sm shadow-primary/5"
                                    : "text-slate-500 hover:bg-primary/5 hover:text-primary"
                            )}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full hidden md:block" />
                            )}
                            
                            <item.icon className={cn(
                                "h-5 w-5 transition-transform duration-300",
                                isActive ? "scale-110" : "group-hover:scale-110"
                            )} />
                            
                            <span className="text-sm font-bold tracking-tight lg:inline hidden md:hidden lg:inline">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile Quick View (Optional but premium) */}
            {user && (
                <div className="px-4 mb-2 hidden lg:block">
                    <div className="p-3 bg-primary/5 rounded-2xl border border-primary/5 flex items-center gap-3">
                        <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                            <AvatarImage src={user.profileImage ? `http://localhost:5000${user.profileImage}` : ""} className="object-cover" />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-black">
                                {user.name?.split(" ").map((n: any) => n[0]).join("")}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate">Dr. {user.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{user.specialization || "Specialist"}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-primary/5 space-y-1">
                <Link
                    href="/doctor/profile"
                    className="flex items-center gap-4 px-4 py-3.5 w-full text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl transition-all group"
                >
                    <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform duration-500" />
                    <span className="text-sm font-bold tracking-tight lg:inline hidden md:hidden lg:inline">Settings</span>
                </Link>
                <Link 
                    href="/auth" 
                    className="flex items-center gap-4 px-4 py-3.5 w-full text-slate-400 hover:text-emergency hover:bg-emergency/5 rounded-2xl transition-all group"
                >
                    <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold tracking-tight lg:inline hidden md:hidden lg:inline">Logout</span>
                </Link>
            </div>
        </aside>
    )
}
