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
        <aside className="w-64 border-r bg-card flex flex-col hidden md:flex border-border/40">
            <div className="p-6 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Admin<span className="text-primary">Panel</span></span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {
                    navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                                {item.label === "Emergency Cases" && stats.pending > 0 && (
                                    <Badge className="ml-auto bg-emergency text-emergency-foreground">
                                        {stats.pending}
                                    </Badge>
                                )}
                                {item.label === "Messages" && stats.unread > 0 && (
                                    <Badge className="ml-auto bg-primary text-primary-foreground">
                                        {stats.unread}
                                    </Badge>
                                )}
                            </Link>
                        )
                    })
                }
            </nav >

            <div className="p-4 border-t">
                <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                </button>
                <Link href="/auth" className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-foreground transition-colors">
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                </Link>
            </div>
        </aside >
    )
}
