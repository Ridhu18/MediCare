"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bed,
  AlertTriangle,
  MessageCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  LogOut,
  Hospital,
  ChevronLeft,
  Phone,
  Mail,
  MoreVertical,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"
import { AdminSidebar } from "@/components/admin-sidebar"

interface Appointment {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  doctorName: string
  department: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "rejected" | "cancelled"
  reason: string
  healthId: string
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-warning/20 text-warning-foreground border-warning",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-success/20 text-success border-success",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/20 text-destructive border-destructive",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/20 text-destructive border-destructive",
  },
}

export default function AdminAppointments() {
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeTab, setActiveTab] = useState("today")
  const { toast } = useToast()

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")

      // 1. Fetch admin profile to get hospitalIds
      const userRes = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })
      let adminHospitalIds: string[] = []
      if (userRes.ok) {
        const userData = await userRes.json()
        adminHospitalIds = userData.hospitalIds || []
      }

      // 2. Fetch all appointments
      const res = await fetch("http://localhost:5000/api/appointments/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        let data = await res.json()

        // 3. Filter appointments to only include those in the admin's hospitals
        if (adminHospitalIds.length > 0) {
          data = data.filter((apt: any) => {
            // appointment.hospital could be an object (populated) or just an ID string depending on exactly how it's populated. 
            // The backend populates it as `{ _id, name }`
            const aptHospitalId = apt.hospital?._id || apt.hospital;
            return aptHospitalId && adminHospitalIds.includes(aptHospitalId.toString());
          })
        } else {
          // If admin has no hospitals, they see no appointments
          data = []
        }

        const mappedData = data.map((apt: any) => ({
          id: apt._id,
          patientName: apt.patient?.name || "Unknown Patient",
          patientPhone: apt.patient?.phone || "N/A",
          patientEmail: apt.patient?.email || "N/A",
          doctorName: apt.doctor?.user?.name || "N/A",
          department: apt.doctor?.specialization || "General",
          date: apt.date,
          time: apt.time,
          status: apt.status,
          reason: apt.reason || "No reason provided",
          healthId: apt.patient?.healthId || "N/A",
        }))
        setAppointmentsList(mappedData)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filterAppointments = (tab: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return appointmentsList.filter((apt) => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)

      const matchesSearch =
        apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
        apt.department.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === "all" || apt.status === statusFilter

      let matchesTab = true
      if (tab === "today") {
        matchesTab = aptDate.getTime() === today.getTime()
      } else if (tab === "upcoming") {
        matchesTab = aptDate > today
      } else if (tab === "past") {
        matchesTab = aptDate < today
      }

      return matchesSearch && matchesStatus && matchesTab
    })
  }

  const handleAction = async (action: "confirmed" | "rejected", appointmentId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: action }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: `Appointment ${action === "confirmed" ? "accepted" : "rejected"} successfully`,
        })
        fetchAppointments()
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating appointment status:", error)
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      })
    }
    setSelectedAppointment(null)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent h-96 -z-10" />
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-primary/5 h-10 w-10 rounded-xl">
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </Button>
              </Link>
              <div className="h-12 w-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/5">
                <Calendar className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none uppercase">Appointment</h1>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">
                  Scheduling & Hospital Network Registry
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-white/5 border border-primary/5 rounded-xl shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Live Network</span>
               </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Filters Registry */}
          <Card className="border-none bg-white/40 dark:bg-white/5 backdrop-blur-xl shadow-sm rounded-[2.5rem] p-2 overflow-hidden border border-white/20 dark:border-white/5">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search patients, doctors, or departments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-14 pl-12 bg-white/60 dark:bg-white/5 border-primary/5 rounded-[1.5rem] focus:ring-primary/20 font-bold text-sm transition-all hover:bg-white dark:hover:bg-white/10 shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Status Scope</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-12 bg-white/60 border-primary/5 rounded-xl focus:ring-primary/20 font-bold text-sm transition-all hover:bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-primary/10 shadow-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments temporal Registry */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 p-1.5 bg-white/40 backdrop-blur-xl border border-primary/5 rounded-[1.5rem] w-full max-w-2xl mx-auto flex mb-8">
              <TabsTrigger value="today" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all relative">
                Today
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center bg-primary text-[9px] text-white border-2 border-white dark:border-slate-900 rounded-full p-0">
                  {filterAppointments("today").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Past</TabsTrigger>
              <TabsTrigger value="all" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">All</TabsTrigger>
            </TabsList>

            {["today", "upcoming", "past", "all"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-6 outline-none focus-visible:ring-0">
                {filterAppointments(tab).length === 0 ? (
                  <div className="p-32 text-center bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-[3rem] border border-primary/5">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center mx-auto mb-6">
                      <Calendar className="h-10 w-10 text-primary/20" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Registry Silence</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-2">No matching sessions identified in this scope</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {filterAppointments(tab).map((apt: any) => (
                      <Card key={apt.id} className="group border-none bg-white/40 backdrop-blur-xl shadow-sm rounded-[2.5rem] overflow-hidden hover:scale-[1.01] transition-all duration-500 border border-white/20">
                        <CardContent className="p-8">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <Avatar className="h-16 w-16 border-4 border-white shadow-xl rounded-2xl overflow-hidden ring-1 ring-primary/5">
                                <AvatarFallback className="bg-primary/5 text-primary text-lg font-black tracking-tighter rounded-none">
                                  {apt.patientName ? apt.patientName.split(" ").map((n: string) => n[0]).join("") : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-3 mb-1.5 text-xs">
                                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight group-hover:text-primary transition-colors">{apt.patientName}</h3>
                                  <Badge
                                    variant="secondary"
                                    className={cn("px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border-none shadow-sm", (statusConfig as any)[apt.status]?.className)}
                                  >
                                    {(statusConfig as any)[apt.status]?.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-80">
                                   <span>DR. {apt.doctorName}</span>
                                   <span className="h-1 w-1 rounded-full bg-slate-300" />
                                   <span className="text-primary/70">{apt.department}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-4">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-white/5 rounded-xl shadow-sm border border-primary/5">
                                    <Calendar className="h-3.5 w-3.5 text-primary/60" />
                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200">
                                      {new Date(apt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-white/5 rounded-xl shadow-sm border border-primary/5">
                                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 font-mono tracking-tighter">
                                      {apt.time}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {apt.status === "pending" && (
                                <div className="flex items-center gap-3 w-full lg:w-auto">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAction("confirmed", apt.id)}
                                    className="flex-1 lg:flex-none h-12 px-6 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-2xl gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Validate
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleAction("rejected", apt.id)}
                                    className="flex-1 lg:flex-none h-12 px-6 bg-emergency/5 text-emergency hover:bg-emergency hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl gap-2 transition-all"
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Dismiss
                                  </Button>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAppointment(apt)}
                                className="h-12 px-8 rounded-2xl border-primary/10 hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest shadow-sm"
                              >
                                View Detailed Record
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

        </div>
      </main>

      {/* Appointment Details Dialog */}
      <Suspense fallback={<Loading />}>
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto border-none bg-white/80 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
            {selectedAppointment && (
              <div className="space-y-0">
                <div className="p-8 pb-6 border-b border-primary/5 bg-slate-50/50">
                   <div className="flex items-center gap-6">
                      <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
                        <Users className="h-8 w-8" />
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">{selectedAppointment.patientName}</DialogTitle>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Health Identity: <span className="text-primary/70">{selectedAppointment.healthId}</span>
                        </p>
                      </div>
                   </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Communication Signal</p>
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-primary/40" />
                          {selectedAppointment.patientPhone}
                        </p>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-primary/40" />
                          {selectedAppointment.patientEmail}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Assignment</p>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">Dr. {selectedAppointment.doctorName}</p>
                        <p className="text-xs font-bold text-primary/70 uppercase">{selectedAppointment.department}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Scheduled Timeline</p>
                      <p className="text-sm font-black text-slate-800">
                        {new Date(selectedAppointment.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Time Slot</p>
                      <p className="text-sm font-black text-slate-800 font-mono tracking-widest">{selectedAppointment.time}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Session Narrative / Reason</p>
                    <div className="p-6 bg-white/60 rounded-[1.5rem] border border-primary/5 italic text-sm text-slate-600 leading-relaxed shadow-sm">
                      "{selectedAppointment.reason}"
                    </div>
                  </div>

                  {selectedAppointment.status === "pending" && (
                    <div className="flex gap-4 pt-4">
                      <Button
                        onClick={() => handleAction("confirmed", selectedAppointment.id)}
                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest rounded-2xl gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Authorize Appointment
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleAction("rejected", selectedAppointment.id)}
                        className="flex-1 h-14 bg-emergency/5 text-emergency hover:bg-emergency hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl gap-2 transition-all"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedAppointment(null)}
                      className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800"
                    >
                      Close Registry Record
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  )
}

