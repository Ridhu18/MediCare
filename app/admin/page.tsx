"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Users,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Activity,
  Hospital,
  Bed,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "@/components/admin-sidebar"

const recentAppointments = [
  {
    id: "1",
    patientName: "Priya Patel",
    doctorName: "Dr. Sharma",
    department: "Cardiology",
    time: "10:00 AM",
    status: "pending",
  },
  {
    id: "2",
    patientName: "Amit Kumar",
    doctorName: "Dr. Verma",
    department: "Neurology",
    time: "10:30 AM",
    status: "confirmed",
  },
  {
    id: "3",
    patientName: "Sunita Rao",
    doctorName: "Dr. Gupta",
    department: "Orthopedics",
    time: "11:00 AM",
    status: "pending",
  },
  {
    id: "4",
    patientName: "Rajesh Singh",
    doctorName: "Dr. Patel",
    department: "General",
    time: "11:30 AM",
    status: "confirmed",
  },
]

const emergencyCases = [
  {
    id: "1",
    type: "Cardiac Arrest",
    priority: "critical",
    patient: "Unknown Male",
    eta: "2 min",
    ambulanceId: "AMB-101",
  },
  {
    id: "2",
    type: "Road Accident",
    priority: "high",
    patient: "Meera Sharma",
    eta: "5 min",
    ambulanceId: "AMB-105",
  },
  {
    id: "3",
    type: "Breathing Difficulty",
    priority: "high",
    patient: "Ram Prasad",
    eta: "8 min",
    ambulanceId: "AMB-103",
  },
]

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("/admin")
  const [dashboardStats, setDashboardStats] = useState([
    { label: "Total Appointments", value: "0", icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Doctors", value: "0", icon: Users, color: "text-accent", bg: "bg-accent/10" },
    { label: "Total Hospitals", value: "0", icon: Hospital, color: "text-success", bg: "bg-success/10" }, // Replaced Beds with Hospitals for now or keep Beds if we have data
    { label: "Total Patients", value: "0", icon: Users, color: "text-warning-foreground", bg: "bg-warning/10" },
  ])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/api/stats", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          setDashboardStats([
            { label: "Total Appointments", value: data.totalAppointments.toString(), icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
            { label: "Total Doctors", value: data.totalDoctors.toString(), icon: Users, color: "text-accent", bg: "bg-accent/10" },
            { label: "Total Hospitals", value: data.totalHospitals.toString(), icon: Hospital, color: "text-success", bg: "bg-success/10" },
            { label: "Total Patients", value: data.totalPatients.toString(), icon: Users, color: "text-warning-foreground", bg: "bg-warning/10" },
          ])
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">DASHBOARD</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                Administrative Control Center
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/5 transition-colors">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-emergency rounded-full ring-2 ring-background" />
              </Button>
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => (
              <Card key={stat.label} className="border-primary/5 bg-background/40 backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-black mt-1 text-slate-800 group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
                    </div>
                    <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:rotate-12", stat.bg)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Appointments */}
            <div className="lg:col-span-2">
              <Card className="border-primary/5 bg-background/40 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-primary/5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-black tracking-tight text-slate-800">TODAY'S APPOINTMENTS</CardTitle>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Real-time scheduling</p>
                    </div>
                    <Link href="/admin/appointments">
                      <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 gap-1 font-bold">
                        VIEW ALL
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {recentAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/40 transition-all duration-300 group hover:translate-x-1"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-2 border-primary/10 group-hover:border-primary/30 transition-colors">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-mono">
                              {apt.patientName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-800">{apt.patientName}</p>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                              {apt.doctorName} <span className="opacity-30 mx-1">|</span> {apt.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-black text-slate-700 font-mono text-sm">{apt.time}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0 border-0",
                                apt.status === "confirmed"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-amber-500/10 text-amber-600"
                              )}
                            >
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Emergency Cases */}
            <Card className="border-rose-500/20 bg-rose-500/5 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              <CardHeader className="relative z-10 border-b border-rose-500/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-rose-600 text-lg font-black tracking-tight">
                  <Activity className="h-5 w-5 animate-pulse" />
                  INCOMING ALERT
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 relative z-10 p-4">
                {emergencyCases.map((emergency) => (
                  <div
                    key={emergency.id}
                    className="p-4 rounded-xl bg-white/40 border border-rose-500/10 hover:border-rose-500/30 transition-all duration-300 group/item"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2",
                          emergency.priority === "critical"
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-amber-500 text-white"
                        )}
                      >
                        {emergency.priority}
                      </Badge>
                      <span className="text-[10px] font-black font-mono text-slate-500 opacity-60 tracking-tighter">{emergency.ambulanceId}</span>
                    </div>
                    <h4 className="font-black text-slate-800 tracking-tight">{emergency.type}</h4>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-70 mb-3">{emergency.patient}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 text-rose-600">
                        <Clock className="h-3 w-3" />
                        <span className="text-[11px] font-black font-mono">ETA: {emergency.eta}</span>
                      </div>
                      <Button size="sm" variant="outline" className="text-[10px] font-black uppercase tracking-widest h-7 px-3 border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                        PREPARE
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/admin/appointments", icon: Calendar, color: "text-primary", bg: "bg-primary/10", label: "Appointments", desc: "Manage bookings" },
              { href: "/admin/doctors", icon: Users, color: "text-accent", bg: "bg-accent/10", label: "Doctors", desc: "Manage staff" },
              { href: "/admin/beds", icon: Bed, color: "text-success", bg: "bg-success/10", label: "Beds", desc: "Track availability" },
              { href: "/admin/emergency", icon: Activity, color: "text-emergency", bg: "bg-emergency/10", label: "Emergency", desc: "Priority cases" },
            ].map((action) => (
              <Link key={action.label} href={action.href}>
                <Card className="border-primary/5 bg-background/40 backdrop-blur-xl hover:bg-white transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl transition-transform duration-300 group-hover:scale-110", action.bg)}>
                      <action.icon className={cn("h-6 w-6", action.color)} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 tracking-tight">{action.label}</h3>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase opacity-60">{action.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
