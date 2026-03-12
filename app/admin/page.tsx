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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, Admin
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-emergency rounded-full" />
              </Button>
              <Avatar>
                <AvatarFallback className="bg-primary/10 text-primary">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today's Appointments</CardTitle>
                    <Link href="/admin/appointments">
                      <Button variant="ghost" size="sm">
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {apt.patientName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{apt.patientName}</p>
                            <p className="text-sm text-muted-foreground">
                              {apt.doctorName} • {apt.department}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">{apt.time}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                apt.status === "confirmed"
                                  ? "bg-success/20 text-success border-success"
                                  : "bg-warning/20 text-warning-foreground border-warning"
                              )}
                            >
                              {apt.status}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-success">
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
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
            <Card className="border-emergency/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emergency">
                  <AlertTriangle className="h-5 w-5" />
                  Incoming Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyCases.map((emergency) => (
                  <div
                    key={emergency.id}
                    className="p-4 border rounded-lg bg-emergency/5 border-emergency/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        className={cn(
                          emergency.priority === "critical"
                            ? "bg-emergency text-emergency-foreground animate-pulse"
                            : "bg-warning text-warning-foreground"
                        )}
                      >
                        {emergency.priority}
                      </Badge>
                      <span className="text-sm font-mono">{emergency.ambulanceId}</span>
                    </div>
                    <h4 className="font-semibold">{emergency.type}</h4>
                    <p className="text-sm text-muted-foreground">{emergency.patient}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        ETA: {emergency.eta}
                      </span>
                      <Button size="sm" variant="outline" className="text-xs bg-transparent">
                        Prepare
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/appointments">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Appointments</h3>
                    <p className="text-sm text-muted-foreground">Manage bookings</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/doctors">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Doctors</h3>
                    <p className="text-sm text-muted-foreground">Manage staff</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/beds">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-success/10">
                    <Bed className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Beds</h3>
                    <p className="text-sm text-muted-foreground">Track availability</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/emergency">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emergency/10">
                    <Activity className="h-6 w-6 text-emergency" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Emergency</h3>
                    <p className="text-sm text-muted-foreground">Priority cases</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
