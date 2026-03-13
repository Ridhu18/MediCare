"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Calendar,
    Users,
    Bed,
    AlertTriangle,
    MessageCircle,
    Hospital,
    Settings,
    LogOut,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/appointments", icon: Calendar, label: "Appointments" },
    { href: "/admin/doctors", icon: Users, label: "Doctors" },
    { href: "/admin/hospitals", icon: Hospital, label: "Hospitals" },
    { href: "/admin/beds", icon: Bed, label: "Bed Management" },
    { href: "/admin/emergency", icon: AlertTriangle, label: "Emergency Cases" },
    { href: "/admin/chat", icon: MessageCircle, label: "Messages" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [stats, setStats] = useState({ pending: 0, unread: 0 })

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem("token")
            const headers: HeadersInit = {}
            if (token) {
                headers["Authorization"] = `Bearer ${token}`
            }
            const res = await fetch("http://localhost:5000/api/stats", { headers })
            if (res.ok) {
                const data = await res.json()
                setStats({
                    pending: data.pendingEmergencies || 0,
                    unread: data.unreadMessages || 0,
                })
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 10000) // Poll for alert updates
        return () => clearInterval(interval)
    }, [])
    return (
        <aside className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl border-t border-primary/5 md:top-0 md:bottom-auto md:right-auto md:border-t-0 md:border-r md:h-screen md:w-20 lg:w-64 flex flex-col hidden md:flex transition-all duration-500">
            {/* Logo Section */}
            <div className="flex items-center gap-3 px-6 pb-8 pt-4 relative">
                <div className="h-11 w-11 bg-gradient-to-br from-primary to-primary/80 rounded-[18px] flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20 transition-transform hover:scale-105 duration-300">
                    <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div className="hidden lg:flex flex-col">
                    <span className="font-black text-xl tracking-tight text-slate-800">
                        Admin<span className="text-primary">Console</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 -mt-1 italic">Control Center</span>
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
                            
                            {item.label === "Emergency Cases" && stats.pending > 0 && (
                                <Badge className="ml-auto bg-emergency/90 text-white border-none shadow-lg shadow-emergency/20 text-[10px] h-5 px-1.5 animate-pulse lg:flex hidden">
                                    {stats.pending}
                                </Badge>
                            )}
                            {item.label === "Messages" && stats.unread > 0 && (
                                <Badge className="ml-auto bg-primary text-white border-none shadow-lg shadow-primary/20 text-[10px] h-5 px-1.5 font-bold lg:flex hidden">
                                    {stats.unread}
                                </Badge>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 mt-auto border-t border-primary/5 space-y-1">
                <button
                    type="button"
                    className="flex items-center gap-4 px-4 py-3.5 w-full text-slate-400 hover:text-slate-800 hover:bg-white/40 rounded-2xl transition-all group"
                >
                    <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform duration-500" />
                    <span className="text-sm font-bold tracking-tight lg:inline hidden md:hidden lg:inline">Settings</span>
                </button>
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
