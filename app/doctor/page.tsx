"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DoctorSidebar } from "@/components/doctor-sidebar"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Settings,
  LogOut,
  Hospital,
  Stethoscope,
  User,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  FileText,
  History as HistoryIcon,
  Pill,
  AlertCircle,
  Paperclip,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import io from "socket.io-client"

// Removed inline navItems

const stats = [
  {
    label: "Today's Appointments",
    value: "12",
    change: "+3",
    trend: "up",
    icon: Calendar,
    color: "text-primary",
  },
  {
    label: "Pending Reviews",
    value: "5",
    change: "-2",
    trend: "down",
    icon: Clock,
    color: "text-warning-foreground",
  },
  {
    label: "Completed Today",
    value: "8",
    change: "+2",
    trend: "up",
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    label: "Total Patients",
    value: "234",
    change: "+12",
    trend: "up",
    icon: Users,
    color: "text-accent",
  },
]

// Replaced with dynamic data
interface Appointment {
  _id: string
  patient: {
    name: string
    email: string
    phone: string
  }
  time: string
  date: string
  status: string
  reason: string
  attachments?: Array<{
    name: string
    url: string
    fileType: string
  }>
}
// const todayAppointments = [] // Removed static data

// Replaced with dynamic logic in component
interface RecentPatient {
  id: string
  name: string
  lastVisit: string
  nextAppointment?: string
  condition: string
  status: "stable" | "monitoring" | "improving" | "critical"
}

export default function DoctorDashboard() {
  const [activeNav, setActiveNav] = useState("/doctor")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctorInfo, setDoctorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewingMedicalRecord, setViewingMedicalRecord] = useState<any>(null)
  const [isMedicalRecordDialogOpen, setIsMedicalRecordDialogOpen] = useState(false)
  const [fetchingRecord, setFetchingRecord] = useState(false)

  const fetchMedicalRecordDetail = async (recordId: string) => {
    setFetchingRecord(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/${recordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setViewingMedicalRecord(data)
        setIsMedicalRecordDialogOpen(true)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Failed to fetch record:", errorData)
        alert("Failed to fetch medical record: " + (errorData.message || res.statusText))
      }
    } catch (error) {
      console.error("Error fetching medical record detail:", error)
      alert("Error connecting to server")
    } finally {
      setFetchingRecord(false)
    }
  }

  // Fetch appointments on mount
  // Note: In a real app, use SWR or React Query, and useEffect properly
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch Appointments
      const apptRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (apptRes.ok) {
        const data = await apptRes.json()
        setAppointments(data)
        calculateStats(data)
      }

      // Fetch Doctor Profile
      const docRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (docRes.ok) {
        const docData = await docRes.json()
        setDoctorInfo(docData)
      }

    } catch (error) {
      console.error("Error fetching dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on mount and set up real-time listener
  useEffect(() => {
    fetchDashboardData()

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}`)

    socket.on("appointment_created", (data) => {
      console.log("New appointment received on dashboard:", data)
      fetchDashboardData()
    })

    socket.on("appointment_updated", (data) => {
      console.log("Appointment updated on dashboard:", data)
      fetchDashboardData()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const [dashboardStats, setDashboardStats] = useState(stats)

  const calculateStats = (data: Appointment[]) => {
    const today = new Date().toISOString().split('T')[0]

    const todayCount = data.filter(a => a.date.startsWith(today)).length // Date might be full ISO string
    // Better date check:
    const todayDate = new Date().toDateString()
    const todayApts = data.filter(a => new Date(a.date).toDateString() === todayDate).length

    const pendingCount = data.filter(a => a.status === 'pending').length
    const completedToday = data.filter(a => a.status === 'completed' && new Date(a.date).toDateString() === todayDate).length

    // Unique patients
    const uniquePatients = new Set(data.map(a => a.patient?.email)).size

    setDashboardStats([
      {
        label: "Today's Appointments",
        value: todayApts.toString(),
        change: "+0", // Mock
        trend: "up",
        icon: Calendar,
        color: "text-primary",
      },
      {
        label: "Pending Requests",
        value: pendingCount.toString(),
        change: "0",
        trend: "neutral",
        icon: Clock,
        color: "text-warning-foreground",
      },
      {
        label: "Completed Today",
        value: completedToday.toString(),
        change: "+0",
        trend: "up",
        icon: CheckCircle2,
        color: "text-success",
      },
      {
        label: "Total Patients",
        value: uniquePatients.toString(),
        change: "+0",
        trend: "up",
        icon: Users,
        color: "text-accent",
      },
    ])
  }

  // Derive recent patients from appointments
  const recentPatientsDynamic = Array.from(
    appointments.reduce((acc, apt) => {
      const email = apt.patient?.email || "unknown"
      if (!acc.has(email)) {
        acc.set(email, {
          id: apt._id,
          name: apt.patient?.name || "Unknown Patient",
          allVisits: [],
          condition: apt.reason || "General Consultation",
          status: "stable" as const, // Default status
        })
      }
      acc.get(email).allVisits.push(new Date(apt.date))
      return acc
    }, new Map())
  ).map(([_, patient]: [any, any]) => {
    const visits = patient.allVisits.sort((a: Date, b: Date) => b.getTime() - a.getTime())
    const now = new Date()
    const pastVisits = visits.filter((v: Date) => v <= now)
    const futureVisits = visits.filter((v: Date) => v > now).reverse() // Earliest future first

    return {
      ...patient,
      lastVisit: pastVisits.length > 0 ? pastVisits[0].toLocaleDateString() : "No past visits",
      nextAppointment: futureVisits.length > 0 ? futureVisits[0].toLocaleDateString() : undefined,
    }
  }).sort((a, b) => {
    const aDate = new Date(a.lastVisit === "No past visits" ? 0 : a.lastVisit).getTime()
    const bDate = new Date(b.lastVisit === "No past visits" ? 0 : b.lastVisit).getTime()
    return bDate - aDate
  }).slice(0, 3)

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      // Update local state
      setAppointments(prev => prev.map(app => app._id === id ? { ...app, status } : app))
    } catch (error) {
      console.error("Error updating status", error)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DoctorSidebar />

      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent h-96 -z-10" />

        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/5">
                <LayoutDashboard className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Clinical Console</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Welcome back, Dr. {doctorInfo?.user?.name || "Practitioner"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/50 text-slate-400 hover:text-primary transition-all">
                <Settings className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10 border-2 border-background shadow-md">
                <AvatarImage
                  src={doctorInfo?.user?.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${doctorInfo.user.profileImage}` : ""}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                  {doctorInfo?.user?.name ? doctorInfo.user.name.split(" ").map((n: string) => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat) => (
              <Card key={stat.label} className="group border-none bg-white/40 backdrop-blur-xl shadow-sm rounded-[2rem] hover:bg-white/60 transition-all duration-500 overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-80">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                        <div className="flex items-center gap-1">
                          {stat.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-emergency" />
                          )}
                          <span className={cn(
                            "text-[10px] font-black",
                            stat.trend === "up" ? "text-emerald-500" : "text-emergency"
                          )}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-inner", 
                      stat.color === "text-primary" ? "bg-primary/10 text-primary" : 
                      stat.color === "text-warning-foreground" ? "bg-amber-500/10 text-amber-600" :
                      stat.color === "text-success" ? "bg-emerald-500/10 text-emerald-600" :
                      "bg-accent/10 text-accent"
                    )}>
                      <stat.icon className="h-7 w-7 stroke-[1.5]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Clinical Queue */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 opacity-80">Immediate Appointment Queue</h2>
                </div>
                <Link href="/doctor/appointments">
                  <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                    Access Registry
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {loading && (
                   <div className="p-20 text-center bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-primary/5">
                     <Clock className="h-10 w-10 mx-auto text-slate-200 animate-spin" />
                   </div>
                )}
                {!loading && appointments.filter(a => {
                  const isToday = new Date(a.date).toDateString() === new Date().toDateString();
                  const isUpcomingPending = a.status === 'pending' && new Date(a.date) > new Date();
                  return isToday || isUpcomingPending;
                }).length === 0 && (
                  <div className="p-20 text-center bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-primary/5">
                    <Calendar className="h-10 w-10 mx-auto text-slate-200 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zero entries for this window</p>
                  </div>
                )}
                {appointments
                  .filter(a => {
                    const isToday = new Date(a.date).toDateString() === new Date().toDateString();
                    const isUpcomingPending = a.status === 'pending' && new Date(a.date) > new Date();
                    return isToday || isUpcomingPending;
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))
                  .map((appointment) => (
                  <Card key={appointment._id} className="group border-none bg-white/40 backdrop-blur-xl shadow-sm rounded-[2.5rem] hover:bg-white/60 transition-all duration-500 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex flex-col items-center justify-center border border-white group-hover:bg-primary/5 transition-colors">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Time</span>
                            <span className="text-xs font-black text-slate-800">{appointment.time}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-black text-slate-800 tracking-tight">{appointment.patient.name}</h3>
                              <Badge variant="outline" className={cn("px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-none", 
                                appointment.status === "confirmed" ? "bg-emerald-500/10 text-emerald-600" :
                                appointment.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                                "bg-emergency/10 text-emergency"
                              )}>
                                {appointment.status}
                              </Badge>
                            </div>
                            <p className="text-xs font-bold text-slate-400 italic leading-none truncate max-w-[240px] mb-2">
                              "{appointment.reason}"
                            </p>
                            <div className="flex items-center gap-4 text-[9px] font-black text-primary/60 uppercase tracking-widest">
                               <div className="flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {new Date(appointment.date).toDateString() === new Date().toDateString() ? "Today" : new Date(appointment.date).toLocaleDateString()}
                               </div>
                               <div className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {appointment.time}
                               </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {appointment.status === "pending" && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusUpdate(appointment._id, "confirmed")}
                                className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusUpdate(appointment._id, "rejected")}
                                className="h-9 px-4 rounded-xl bg-emergency/5 text-emergency hover:bg-emergency/10 text-[9px] font-black uppercase tracking-widest"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-white/50 text-slate-400 hover:text-primary transition-all"
                            onClick={() => window.location.href = `tel:${appointment.patient?.phone?.replace(/\s/g, "")}`}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Link href={`/doctor/patients?patient=${appointment.patient.name}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl bg-white/50 text-slate-400 hover:text-slate-800 transition-all"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Side Modules */}
            <div className="space-y-10">
              {/* Recent Registry Entries */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 px-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 opacity-80">Recent Entries</h3>
                </div>
                <div className="space-y-4">
                  {recentPatientsDynamic.length === 0 && (
                    <div className="p-10 text-center bg-white/40 backdrop-blur-xl rounded-[2rem] border border-primary/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registry is empty</p>
                    </div>
                  )}
                  {recentPatientsDynamic.map((patient) => (
                    <div
                      key={patient.id}
                      className="group flex items-center gap-4 p-4 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-transparent hover:border-primary/10 hover:bg-white/60 transition-all duration-500 cursor-pointer shadow-sm"
                      onClick={() => window.location.href = `/doctor/patients?patient=${patient.name}`}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                          {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-800 tracking-tight truncate">{patient.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("px-2 py-0 rounded-md text-[8px] font-black uppercase tracking-widest border-none", 
                            patient.status === "critical" ? "bg-emergency/10 text-emergency" : "bg-emerald-500/10 text-emerald-600"
                          )}>
                            {patient.status}
                          </Badge>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {patient.lastVisit}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Protocol Shortcuts */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 px-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 opacity-80">Protocol Shortcuts</h3>
                </div>
                <div className="grid gap-4">
                  <Link href="/doctor/appointments">
                    <div className="group flex items-center gap-5 p-5 bg-gradient-to-br from-primary/5 to-white/40 backdrop-blur-xl rounded-[2rem] border border-transparent hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer">
                      <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        <Calendar className="h-7 w-7 stroke-[1.5]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-800 tracking-tight">Registry Management</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sync Appointments</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/doctor/schedule">
                    <div className="group flex items-center gap-5 p-5 bg-gradient-to-br from-amber-500/5 to-white/40 backdrop-blur-xl rounded-[2rem] border border-transparent hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500 cursor-pointer">
                      <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                        <Clock className="h-7 w-7 stroke-[1.5]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-slate-800 tracking-tight">Timeline Control</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Availability</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/doctor/patients" className="group p-8 bg-gradient-to-br from-primary to-primary-foreground rounded-[2.5rem] shadow-2xl shadow-primary/20 flex flex-col items-center text-center space-y-4 hover:scale-[1.02] transition-all duration-500">
                    <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Stethoscope className="h-9 w-9 text-white stroke-[1.5]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black italic text-white tracking-tighter">Practitioner Growth</h4>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Register New Patient Dossier</p>
                    </div>
                    <Button variant="outline" className="w-full h-11 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary font-black uppercase tracking-widest text-[9px] transition-all">
                      Open Medical Intake
                    </Button>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* Medical Record Detail Dialog */}
      <Dialog open={isMedicalRecordDialogOpen} onOpenChange={setIsMedicalRecordDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HistoryIcon className="h-6 w-6 text-primary" />
              Medical Record Detail
            </DialogTitle>
          </DialogHeader>
          
          {viewingMedicalRecord && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Patient Diagnosis</p>
                  <p className="text-lg font-bold text-foreground">{viewingMedicalRecord.diagnosis}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(viewingMedicalRecord.date).toLocaleDateString()}
                    </div>
                    {viewingMedicalRecord.doctor?.user?.name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <User className="h-3.5 w-3.5" />
                        Dr. {viewingMedicalRecord.doctor.user.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Hospital/Clinic</p>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <MapPin className="h-4 w-4 text-primary" />
                    {viewingMedicalRecord.appointment?.hospital?.name || "Self Uploaded"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Medical Assessment
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Medicines</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingMedicalRecord.medicines?.length > 0 ? (
                          viewingMedicalRecord.medicines.map((m: any, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-success/10 text-success border-success/20 text-[10px] font-bold">
                              <Pill className="h-2.5 w-2.5 mr-1" />
                              {m.name || m}
                            </Badge>
                          ))
                        ) : <p className="text-xs text-muted-foreground italic">None listed</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Allergies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingMedicalRecord.allergies?.length > 0 ? (
                          viewingMedicalRecord.allergies.map((a: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">
                              <AlertCircle className="h-2.5 w-2.5 mr-1" />
                              {a}
                            </Badge>
                          ))
                        ) : <p className="text-xs text-muted-foreground italic">No allergies reported</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {viewingMedicalRecord.notes && (
                  <div className="p-4 rounded-xl border border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      Doctor Notes
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50 italic">
                      &quot;{viewingMedicalRecord.notes}&quot;
                    </div>
                  </div>
                )}

                {viewingMedicalRecord.attachments?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Paperclip className="h-4 w-4 text-primary" />
                      Related Documents
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {viewingMedicalRecord.attachments.map((file: any, i: number) => (
                        <a
                          key={i}
                          href={file.url.startsWith('http') ? file.url : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-foreground">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{file.fileType.split('/')[1]}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

