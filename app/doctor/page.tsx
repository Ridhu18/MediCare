"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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

const navItems = [
  { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/patients", icon: Users, label: "Patients" },
  { href: "/doctor/schedule", icon: Clock, label: "Schedule" },
  { href: "/doctor/profile", icon: User, label: "Profile" },
]

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
      const res = await fetch(`http://localhost:5000/api/medical-records/${recordId}`, {
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
      const apptRes = await fetch("http://localhost:5000/api/appointments/doctor", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (apptRes.ok) {
        const data = await apptRes.json()
        setAppointments(data)
        calculateStats(data)
      }

      // Fetch Doctor Profile
      const docRes = await fetch("http://localhost:5000/api/doctors/me", {
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

    const socket = io("http://localhost:5000")

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
      await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">MediCare+</h1>
              <p className="text-xs text-muted-foreground">Doctor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setActiveNav(item.href)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                activeNav === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Link href="/auth" className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {doctorInfo?.user?.name ? `Dr. ${doctorInfo.user.name}` : "Doctor"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage
                  src={doctorInfo?.user?.profileImage ? `http://localhost:5000${doctorInfo.user.profileImage}` : ""}
                  alt={doctorInfo?.user?.name}
                />
                <AvatarFallback className="bg-primary/10 text-primary uppercase">
                  {doctorInfo?.user?.name ? doctorInfo.user.name.split(" ").map((n: string) => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            stat.trend === "up" ? "text-success" : "text-destructive"
                          )}
                        >
                          {stat.change}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          from last week
                        </span>
                      </div>
                    </div>
                    <div className={cn("p-3 rounded-lg bg-muted", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Appointments */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Today's Appointments</CardTitle>
                    <Link href="/doctor/appointments">
                      <Button variant="ghost" size="sm">
                        View All
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-3">
                      {loading && <p>Loading appointments...</p>}
                      {!loading && appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length === 0 && <p className="text-muted-foreground p-4">No appointments today.</p>}
                      {appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).map((appointment) => (
                        <div
                          key={appointment._id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{appointment.patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.reason}
                              </p>
                              {appointment.attachments && appointment.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {appointment.attachments.map((file, i) => (
                                    file.url.startsWith("medical-record:") || file.fileType === "text/reference" ? (
                                      <button
                                        key={i}
                                        disabled={fetchingRecord}
                                        onClick={(e) => {
                                          e.preventDefault()
                                          if (file.url.startsWith("medical-record:")) {
                                            const id = file.url.split(":")[1];
                                            fetchMedicalRecordDetail(id);
                                          } else {
                                            alert("Detailed view is not available for this record (old summary reference).");
                                          }
                                        }}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                                      >
                                        <FileText className="h-3 w-3" />
                                        {fetchingRecord ? "..." : file.name}
                                      </button>
                                    ) : (
                                      <a
                                        key={i}
                                        href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border hover:bg-muted/80 transition-colors text-[10px] font-medium"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        {file.name}
                                      </a>
                                    )
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-muted-foreground">
                                  {new Date(appointment.date).toLocaleDateString()} {appointment.time}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={
                                    appointment.status === "confirmed"
                                      ? "bg-success/20 text-success border-success"
                                      : appointment.status === "pending"
                                        ? "bg-warning/20 text-warning-foreground border-warning"
                                        : "bg-destructive/20 text-destructive border-destructive"
                                  }
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-success border-success hover:bg-success/10"
                                  onClick={() => handleStatusUpdate(appointment._id, "confirmed")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive hover:bg-destructive/10"
                                  onClick={() => handleStatusUpdate(appointment._id, "rejected")}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {appointment.status === "confirmed" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  (window.location.href = `tel:${appointment.patient?.phone?.replace(/\s/g, "")}`)
                                }
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Patients & Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPatientsDynamic.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent patients found.</p>
                    )}
                    {recentPatientsDynamic.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/doctor/patients?patient=${patient.name}`}
                      >
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {patient.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{patient.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {patient.condition}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={
                                patient.status === "stable"
                                  ? "bg-success/20 text-success border-success text-xs"
                                  : patient.status === "improving"
                                    ? "bg-primary/20 text-primary border-primary text-xs"
                                    : "bg-warning/20 text-warning-foreground border-warning text-xs"
                              }
                            >
                              {patient.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {patient.nextAppointment ? `Next: ${patient.nextAppointment}` : `Last: ${patient.lastVisit}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/doctor/patients">
                    <Button variant="ghost" className="w-full mt-4" size="sm">
                      View All Patients
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 p-4">
                  <Link href="/doctor/appointments">
                    <div className="group flex items-center gap-4 p-3 rounded-xl bg-background border hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                        <Calendar className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Manage Appointments</p>
                        <p className="text-xs text-muted-foreground">Review and update slots</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  <Link href="/doctor/schedule">
                    <div className="group flex items-center gap-4 p-3 rounded-xl bg-background border hover:border-warning hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning transition-colors">
                        <Clock className="h-6 w-6 text-warning group-hover:text-warning-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Update Schedule</p>
                        <p className="text-xs text-muted-foreground">Set your availability</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>

                  <Link href="/doctor/patients">
                    <div className="group flex items-center gap-4 p-3 rounded-xl bg-background border hover:border-success hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success transition-colors">
                        <UserPlus className="h-6 w-6 text-success group-hover:text-success-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">Register Patient</p>
                        <p className="text-xs text-muted-foreground">Create new records</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </CardContent>
              </Card>
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
                          href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
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

