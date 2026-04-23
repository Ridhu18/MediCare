"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { DoctorSidebar } from "@/components/doctor-sidebar"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Stethoscope,
  User,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock3,
  Phone,
  Mail,
  MapPin,
  FileText,
  ChevronRight,
  Upload,
  Paperclip,
  X,
  History as HistoryIcon,
  Pill,
  AlertCircle,
  Printer,
  ExternalLink,
  Plus,
} from "lucide-react"
import { useReactToPrint } from "react-to-print"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import io from "socket.io-client"

// Removed inline navItems

interface Appointment {
  id: string
  patientName: string
  patientPhone: string
  patientEmail: string
  date: string
  time: string
  reason: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  type: "consultation" | "follow-up" | "emergency"
  notes?: string
  healthId: string
  patientId: string
  attachments?: Array<{
    name: string
    url: string
    fileType: string
  }>
}

const appointments: Appointment[] = []

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
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/20 text-destructive border-destructive",
  },
}

const typeConfig = {
  consultation: {
    label: "Consultation",
    className: "bg-primary/20 text-primary border-primary",
  },
  "follow-up": {
    label: "Follow-up",
    className: "bg-accent/20 text-accent-foreground border-accent",
  },
  emergency: {
    label: "Emergency",
    className: "bg-emergency/20 text-emergency-foreground border-emergency",
  },
}

function DoctorAppointmentsContent() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeTab, setActiveTab] = useState("today")
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [appointmentNotes, setAppointmentNotes] = useState("")

  const [isCompleteOpen, setIsCompleteOpen] = useState(false)
  const [reportData, setReportData] = useState({
    diagnosis: "",
    medicines: [{ name: "", dosage: "", duration: "", instructions: "" }],
    allergies: "",
    notes: ""
  })
  const [uploading, setUploading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])


  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({ contentRef: printRef })

  const handleOpenSummary = async (appointment: Appointment) => {
    setViewingMedicalRecord(null)
    setSelectedAppointment(appointment)
    if (appointment.status === 'completed') {
      setIsReportLoading(true)
      try {
        const token = localStorage.getItem("token")
        // Try to find the medical record for this appointment
        const res = await fetch(`http://localhost:5000/api/medical-records/appointment/${appointment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setViewingMedicalRecord(data)
          setIsSummaryOpen(true)
        } else {
          // Fallback to simple summary if no record found
          setIsSummaryOpen(true)
        }
      } catch (err) {
        setIsSummaryOpen(true)
      } finally {
        setIsReportLoading(false)
      }
    } else {
      setIsSummaryOpen(true)
    }
  }


  // New states for Reschedule
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" })
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

  // New states for Booking
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [bookingData, setBookingData] = useState({
    patientId: "",
    patientName: "",
    date: "",
    time: "",
    reason: "",
    type: "consultation"
  })


  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const [doctorProfile, setDoctorProfile] = useState<any>(null)
  const [viewingMedicalRecord, setViewingMedicalRecord] = useState<any>(null)
  const [isMedicalRecordDialogOpen, setIsMedicalRecordDialogOpen] = useState(false)
  const [fetchingRecord, setFetchingRecord] = useState(false)

  const fetchMedicalRecordDetail = async (recordId: string) => {
    console.log("Fetching medical record:", recordId)
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

  useEffect(() => {
    setIsMounted(true)
    const socket = io("http://localhost:5000")

    socket.on("appointment_created", (data) => {
      console.log("New appointment received:", data)
      fetchAppointments()
    })

    socket.on("appointment_updated", (data) => {
      console.log("Appointment updated:", data)
      fetchAppointments()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    const patientFromUrl = searchParams.get("patient")
    if (patientFromUrl) {
      setBookingData(prev => ({ ...prev, patientName: patientFromUrl }))
      setIsBookingOpen(true)
    }

    const fetchDoctorProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/api/doctors/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setDoctorProfile(data)
        }
      } catch (error) {
        console.error("Error fetching doctor profile", error)
      }
    }

    fetchDoctorProfile()
  }, [searchParams])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/appointments/doctor", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Map API data to UI interface
        const mappedData = data.map((item: any) => ({
          id: item._id,
          patientName: item.patient?.name || "Unknown",
          patientPhone: item.patient?.phone || "N/A",
          patientEmail: item.patient?.email || "N/A",
          patientId: item.patient?._id || "",
          date: item.date,
          time: item.time,
          reason: item.reason,
          status: item.status,
          type: item.type || "consultation", // Default if missing
          healthId: "N/A", // Not in schema yet
          notes: item.notes,
          attachments: item.attachments || []
        }))
        setAppointments(mappedData)
      }
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filteredAppointments = appointments
    .filter((apt) => {
      const matchesSearch =
        (apt.patientName || "").toLowerCase().includes(search.toLowerCase()) ||
        (apt.reason || "").toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || apt.status === statusFilter

      const aptDate = apt.date ? new Date(apt.date).toISOString().split('T')[0] : ""
      const today = new Date().toISOString().split('T')[0]

      const matchesDate =
        activeTab === "all" ||
        (activeTab === "today" && aptDate === today) ||
        (activeTab === "upcoming" && aptDate > today) ||
        (activeTab === "past" && aptDate < today)
      return matchesSearch && matchesStatus && matchesDate
    })
    .sort((a, b) => {
      const dateA = a.date || ""
      const dateB = b.date || ""
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.time || "").localeCompare(b.time || "")
    })

  const handleStatusChange = async (id: string, status: Appointment["status"]) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app))
      }
    } catch (error) {
      console.error("Error updating status", error)
    }
  }

  const handleCompleteAppointment = async () => {
    if (selectedAppointment) {
      try {
        const token = localStorage.getItem("token")

        const payload = {
          appointmentId: selectedAppointment.id,
          patientId: selectedAppointment.patientId,
          diagnosis: reportData.diagnosis,
          medicines: reportData.medicines.filter((m: any) => m.name),
          allergies: reportData.allergies.split(",").map((s: string) => s.trim()).filter((s: string) => s),
          notes: reportData.notes,
          attachments: attachments
        }

        const res = await fetch("http://localhost:5000/api/medical-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        if (res.ok) {
          setIsCompleteOpen(false)
          setSelectedAppointment(null)
          setReportData({
            diagnosis: "",
            medicines: [{ name: "", dosage: "", duration: "", instructions: "" }],
            allergies: "",
            notes: ""
          })
          fetchAppointments()
        }
      } catch (error) {
        console.error("Error completing appointment", error)
      }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("http://localhost:5000/api/medical-records/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAttachments(prev => [...prev, data])
      }
    } catch (error) {
      console.error("Upload error", error)
    } finally {
      setUploading(false)
    }
  }


  const handleBookAppointment = async () => {
    if (!bookingData.date || !bookingData.time) return

    try {
      const token = localStorage.getItem("token")

      // We need to find patient ID by name or the user needs to provide it.
      // For now, let's assume doctors can book for existing patients by name search.
      // Ideally, they search for a patient first.

      const payload = {
        doctorId: doctorProfile?._id,
        hospitalId: doctorProfile?.hospitals?.[0]?._id,
        patientId: bookingData.patientId, // Should be populated from a search
        date: bookingData.date,
        time: bookingData.time,
        reason: bookingData.reason || `Direct booking by Dr. ${doctorProfile?.user?.name}`,
        type: bookingData.type
      }

      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsBookingOpen(false)
        fetchAppointments()
      }
    } catch (error) {
      console.error("Booking error", error)
    }
  }
  const handleReschedule = async () => {
    if (selectedAppointment && rescheduleData.date && rescheduleData.time) {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`http://localhost:5000/api/appointments/${selectedAppointment.id}/reschedule`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(rescheduleData)
        })

        if (res.ok) {
          setIsRescheduleOpen(false)
          setSelectedAppointment(null)
          setRescheduleData({ date: "", time: "" })
          fetchAppointments()
        }
      } catch (error) {
        console.error("Error rescheduling appointment", error)
      }
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DoctorSidebar />

      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent h-96 -z-10" />
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm ring-1 ring-emerald-500/5">
                <Calendar className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Appointment</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Appointment Registry</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsBookingOpen(true)} className="gap-2 bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl hover:scale-105 active:scale-95 transition-all">
                <Calendar className="h-3.5 w-3.5" />
                Book Direct Session
              </Button>
               <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                  {doctorProfile?.user?.name ? doctorProfile.user.name.split(" ").map((n: string) => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Registry Filters */}
          <Card className="border-none bg-white/40 backdrop-blur-xl shadow-sm rounded-[2rem] p-2">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                  <Input
                    placeholder="Search by patient name, reason, or condition..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-11 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                    <Filter className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Registry Scope</span>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 h-12 bg-white/50 border-primary/10 rounded-2xl focus:ring-primary/20 font-bold text-sm transition-all">
                      <SelectValue placeholder="All Sessions" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-primary/10">
                      <SelectItem value="all">All Sessions</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-14 p-1.5 bg-white/40 backdrop-blur-xl border border-primary/5 rounded-[1.25rem] w-full max-w-2xl mx-auto flex">
              <TabsTrigger value="today" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Today</TabsTrigger>
              <TabsTrigger value="upcoming" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">Past</TabsTrigger>
              <TabsTrigger value="all" className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6 pt-4">
              {filteredAppointments.length === 0 ? (
                <div className="p-32 text-center bg-white/40 backdrop-blur-xl rounded-[3rem] border border-primary/5">
                  <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-10 w-10 text-primary/20" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">No Appointments Found</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">No data found in this registry scope</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredAppointments.map((appointment) => (
                    <Card key={appointment.id} className="group border-none bg-white/40 backdrop-blur-xl shadow-sm rounded-[2.5rem] hover:bg-white/60 transition-all duration-500 overflow-hidden">
                      <CardContent className="p-8">
                        <div className="grid lg:grid-cols-12 gap-10">
                          {/* Patient Profile Section */}
                          <div className="lg:col-span-8 flex flex-col md:flex-row gap-8">
                             <div className="relative shrink-0">
                               <Avatar className="h-24 w-24 rounded-[2rem] border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                 <AvatarFallback className="text-2xl font-black bg-primary/10 text-primary">
                                    {appointment.patientName.split(" ").map(n => n[0]).join("")}
                                 </AvatarFallback>
                               </Avatar>
                               <div className={cn("absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg",
                                 appointment.type === "emergency" ? "bg-emergency" : 
                                 appointment.type === "consultation" ? "bg-primary" : "bg-amber-500"
                               )}>
                                 {appointment.type === "emergency" ? <AlertCircle className="h-5 w-5" /> : 
                                  appointment.type === "consultation" ? <Stethoscope className="h-5 w-5" /> : <HistoryIcon className="h-5 w-5" />}
                               </div>
                             </div>

                             <div className="flex-1 space-y-4">
                                <div>
                                   <div className="flex items-center flex-wrap gap-3 mb-2">
                                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{appointment.patientName}</h2>
                                      <Badge className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-none", statusConfig[appointment.status]?.className)}>
                                         {statusConfig[appointment.status]?.label}
                                      </Badge>
                                      <Badge variant="outline" className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">
                                         {appointment.type}
                                      </Badge>
                                   </div>
                                   <p className="text-xs font-bold text-slate-500 italic leading-relaxed">"{appointment.reason}"</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                   <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                         <div className="h-9 w-9 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-primary border border-primary/5">
                                            <Calendar className="h-4 w-4" />
                                         </div>
                                         <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Scheduled Date</p>
                                            <p className="text-sm font-black text-slate-700">{new Date(appointment.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                         <div className="h-9 w-9 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-primary border border-primary/5">
                                            <Clock className="h-4 w-4" />
                                         </div>
                                         <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Session Window</p>
                                            <p className="text-sm font-black text-slate-700">{appointment.time}</p>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                         <div className="h-9 w-9 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-primary border border-primary/5">
                                            <Phone className="h-4 w-4" />
                                         </div>
                                         <div>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 group-hover:text-primary/70 transition-colors">Contact Call</span>
                                            <p className="text-sm font-black text-slate-700">{appointment.patientPhone}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                         <div className="h-9 w-9 rounded-xl bg-white/80 shadow-sm flex items-center justify-center text-primary border border-primary/5">
                                            <Mail className="h-4 w-4" />
                                         </div>
                                         <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Digital Address</p>
                                            <p className="text-sm font-black text-slate-700 truncate max-w-[140px]">{appointment.patientEmail}</p>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Action Controls Section */}
                          <div className="lg:col-span-4 flex flex-col justify-center gap-4">
                             {appointment.status === "pending" && (
                               <div className="grid grid-cols-2 gap-3">
                                 <Button 
                                   onClick={() => handleStatusChange(appointment.id, "confirmed")}
                                   className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-[10px] font-black uppercase tracking-widest"
                                 >
                                    Accept Session
                                 </Button>
                                 <Button 
                                   variant="ghost"
                                   onClick={() => handleStatusChange(appointment.id, "cancelled")}
                                   className="h-12 rounded-2xl bg-emergency/5 text-emergency hover:bg-emergency hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                 >
                                    Reject
                                 </Button>
                               </div>
                             )}

                             {appointment.status === "confirmed" && (
                               <div className="grid grid-cols-2 gap-3">
                                 <Button 
                                   onClick={() => {
                                      setSelectedAppointment(appointment)
                                      setReportData({
                                        diagnosis: "",
                                        medicines: [{ name: "", dosage: "", duration: "", instructions: "" }],
                                        allergies: "",
                                        notes: ""
                                      })
                                      setIsCompleteOpen(true)
                                   }}
                                   className="h-12 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest"
                                 >
                                    Complete
                                 </Button>
                                 <Button 
                                   variant="outline"
                                   onClick={() => {
                                      setSelectedAppointment(appointment)
                                      setRescheduleData({ date: appointment.date.split('T')[0], time: appointment.time })
                                      setIsRescheduleOpen(true)
                                   }}
                                   className="h-12 rounded-2xl border-primary/10 hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest"
                                 >
                                    Reschedule
                                 </Button>
                               </div>
                             )}

                             <div className="grid grid-cols-2 gap-3">
                                <Button 
                                  variant="ghost"
                                  onClick={() => window.location.href = `tel:${appointment.patientPhone.replace(/\s/g, "")}`}
                                  className="h-12 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest"
                                >
                                   Call
                                </Button>
                                <Button 
                                   variant="ghost"
                                   onClick={() => handleOpenSummary(appointment)}
                                   className="h-12 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest"
                                >
                                   {isReportLoading && selectedAppointment?.id === appointment.id ? "Loading..." : "View Summary"}
                                </Button>
                             </div>
                             <Link href={`/doctor/patients?patient=${appointment.patientName}`} className="w-full">
                               <Button 
                                 variant="ghost"
                                 className="h-12 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest w-full"
                               >
                                  History
                               </Button>
                             </Link>
                             
                             {appointment.notes && (
                               <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-1">
                                  <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest opacity-60">Clinical Notes</p>
                                  <p className="text-[11px] font-bold text-slate-700 line-clamp-2 italic">"{appointment.notes}"</p>
                               </div>
                             )}
                          </div>
                        </div>

                        {appointment.attachments && appointment.attachments.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-primary/5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                               <Paperclip className="h-3.5 w-3.5" />
                               Vault History
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {appointment.attachments.map((file, i) => (
                                <button
                                  key={i}
                                  disabled={fetchingRecord}
                                  onClick={() => {
                                    if (file.url.startsWith("medical-record:")) {
                                      const id = file.url.split(":")[1];
                                      fetchMedicalRecordDetail(id);
                                    } else if (!file.url.startsWith('http')) {
                                      window.open(`http://localhost:5000${file.url}`, '_blank')
                                    } else {
                                      window.open(file.url, '_blank')
                                    }
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 bg-white/80 border border-primary/5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group active:scale-95 disabled:opacity-50"
                                >
                                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                     <FileText className="h-4 w-4" />
                                  </div>
                                  <div className="text-left">
                                     <p className="text-xs font-black text-slate-800 leading-none">{file.name}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">History Access</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Complete Appointment Dialog */}
      <Dialog
        open={isCompleteOpen}
        onOpenChange={(open) => {
          setIsCompleteOpen(open)
          if (!open) setSelectedAppointment(null)
        }}
      >
        <DialogContent className="max-w-2xl border-none bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
               <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Complete Session & Add Report</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Create a formal medical record for {selectedAppointment?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Diagnosis</Label>
              <Input
                placeholder="Primary diagnosis..."
                value={reportData.diagnosis}
                onChange={(e) => setReportData({ ...reportData, diagnosis: e.target.value })}
                className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Medicines / Prescription</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportData({
                    ...reportData,
                    medicines: [...reportData.medicines, { name: "", dosage: "", duration: "", instructions: "" }]
                  })}
                  className="rounded-xl border-primary/10 text-[10px] font-black uppercase tracking-widest"
                >
                  <Pill className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {reportData.medicines.map((med, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-primary/5 rounded-2xl bg-white/50 relative group">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Medicine Name</Label>
                    <Input
                      placeholder="e.g. Paracetamol"
                      value={med.name}
                      onChange={(e) => {
                        const newMeds = [...reportData.medicines];
                        newMeds[index].name = e.target.value;
                        setReportData({ ...reportData, medicines: newMeds });
                      }}
                      className="bg-white/80 border-primary/5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Dosage</Label>
                    <Input
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...reportData.medicines];
                        newMeds[index].dosage = e.target.value;
                        setReportData({ ...reportData, medicines: newMeds });
                      }}
                      className="bg-white/80 border-primary/5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Duration</Label>
                    <Input
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => {
                        const newMeds = [...reportData.medicines];
                        newMeds[index].duration = e.target.value;
                        setReportData({ ...reportData, medicines: newMeds });
                      }}
                      className="bg-white/80 border-primary/5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-bold text-slate-400">Instructions</Label>
                    <Input
                      placeholder="e.g. After meal"
                      value={med.instructions}
                      onChange={(e) => {
                        const newMeds = [...reportData.medicines];
                        newMeds[index].instructions = e.target.value;
                        setReportData({ ...reportData, medicines: newMeds });
                      }}
                      className="bg-white/80 border-primary/5 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-rose-500 text-white shadow-lg opacity-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const newMeds = reportData.medicines.filter((_, i) => i !== index);
                      setReportData({ ...reportData, medicines: newMeds });
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Allergies (comma separated)</Label>
              <Input
                placeholder="e.g. Penicillin, Peanuts"
                value={reportData.allergies}
                onChange={(e) => setReportData({ ...reportData, allergies: e.target.value })}
                className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Additional Clinical Notes</Label>
              <Textarea
                placeholder="Any further advice or observations..."
                value={reportData.notes}
                onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                rows={3}
                className="bg-white/50 border-primary/10 rounded-2xl font-bold text-sm resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Attachments (Prescriptions, Reports, etc.)</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-white/50 rounded-xl border border-primary/5 group relative">
                    <Paperclip className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold truncate max-w-[120px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 bg-rose-500/10 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Label
                  htmlFor="file-upload"
                  className={cn(
                    "flex items-center gap-2 p-3 bg-primary/5 text-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-xl border border-dashed border-primary/30 hover:bg-primary/10 cursor-pointer transition-colors",
                    uploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? "Uploading..." : "Add File"}</span>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-primary/5">
              <Button
                variant="ghost"
                onClick={() => setIsCompleteOpen(false)}
                className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest"
              >
                Abort
              </Button>
              <Button 
                onClick={handleCompleteAppointment} 
                disabled={!reportData.diagnosis}
                className="flex-[2] h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white text-[10px] font-black uppercase tracking-widest"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Report & Complete Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md border-none bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
               <Clock3 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Session Rescheduling</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Modify timeline for {selectedAppointment?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Session Date</Label>
              <Input
                type="date"
                value={rescheduleData.date}
                onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Time Window</Label>
              <Input
                type="time"
                value={rescheduleData.time}
                onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
             <Button variant="ghost" onClick={() => setIsRescheduleOpen(false)} className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Abort
             </Button>
             <Button onClick={handleReschedule} className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
                Update Timeline
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Book Appointment Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="max-w-md border-none bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8">
          <DialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
               <Calendar className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Direct Master Booking</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Initialize formal clinical encounter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patient History Search</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input
                  placeholder="Patient Name or Health ID"
                  value={bookingData.patientName}
                  onChange={(e) => setBookingData({ ...bookingData, patientName: e.target.value })}
                  className="pl-11 h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Encounter Date</Label>
                <Input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Encounter Time</Label>
                <Input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm px-4"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Encounter Classification</Label>
              <Select value={bookingData.type} onValueChange={(v) => setBookingData({ ...bookingData, type: v })}>
                <SelectTrigger className="h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/10">
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Encounter Rationale</Label>
              <Textarea
                placeholder="Clinical reason for this direct booking..."
                value={bookingData.reason}
                onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                className="bg-white/50 border-primary/10 rounded-2xl font-bold text-sm h-24 resize-none italic"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
             <Button variant="ghost" onClick={() => setIsBookingOpen(false)} className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Cancel
             </Button>
             <Button onClick={handleBookAppointment} className="flex-1 h-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
                Finalize Booking
             </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isMedicalRecordDialogOpen} onOpenChange={setIsMedicalRecordDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
          {!viewingMedicalRecord ? (
            <div className="p-20 text-center">
               <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <div className="space-y-0">
              <DialogHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold">Medical Report</DialogTitle>
                  <DialogDescription className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Official Document</DialogDescription>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all gap-2" onClick={() => handlePrint()}>
                  <Printer className="h-4 w-4" />
                  Download PDF
                </Button>
              </DialogHeader>

              <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg print:p-8">
                {/* Report Header */}
                <div className="pb-6 border-b-2 border-primary/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-primary mb-1">Medical Report</h2>
                      <p className="text-sm text-muted-foreground font-mono">RECORD ID: {viewingMedicalRecord._id?.toUpperCase() || "N/A"}</p>
                    </div>
                    <Badge className="bg-primary text-white px-3 py-1 text-sm font-bold">
                      Official Record
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consultation Date</p>
                      <p className="font-medium">{new Date(viewingMedicalRecord.createdAt).toLocaleDateString()} at {new Date(viewingMedicalRecord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient Name</p>
                      <p className="font-medium">{viewingMedicalRecord.patient?.name || "Patient"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consulting Physician</p>
                      <p className="font-medium">Dr. {viewingMedicalRecord.doctor?.user?.name || "Doctor"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medical Facility</p>
                      <p className="font-medium">{viewingMedicalRecord.appointment?.hospital?.name || viewingMedicalRecord.hospital?.name || "MediCare+ Facility"}</p>
                    </div>
                  </div>
                </div>

                {/* Clinical Details */}
                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Primary Assessment / Reason</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                      "{viewingMedicalRecord.appointment?.reason || "General document upload and health record maintenance."}"
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Diagnosis</h3>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-lg font-semibold text-slate-800">{viewingMedicalRecord.diagnosis}</p>
                    </div>
                  </section>

                  {viewingMedicalRecord.medicines && viewingMedicalRecord.medicines.length > 0 && (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Prescription</h3>
                      <div className="border rounded-lg overflow-hidden border-slate-200">
                        <Table className="w-full text-sm">
                          <TableHeader className="bg-slate-50 border-b border-slate-200">
                            <TableRow>
                              <TableHead className="px-4 py-2 text-left font-semibold">Medicine</TableHead>
                              <TableHead className="px-4 py-2 text-left font-semibold">Dosage</TableHead>
                              <TableHead className="px-4 py-2 text-left font-semibold">Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-100">
                            {viewingMedicalRecord.medicines.map((med: any, i: number) => (
                              <TableRow key={i}>
                                <TableCell className="px-4 py-3">
                                  <p className="font-medium">{typeof med === 'string' ? med : med.name}</p>
                                  {med.instructions && <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>}
                                </TableCell>
                                <TableCell className="px-4 py-3 font-medium">{med.dosage || "N/A"}</TableCell>
                                <TableCell className="px-4 py-3 text-muted-foreground text-xs">{med.duration || "N/A"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </section>
                  )}

                  {viewingMedicalRecord.notes && (
                    <section>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Consulting Advice / Notes</h3>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                        "{viewingMedicalRecord.notes}"
                      </div>
                    </section>
                  )}

                  {viewingMedicalRecord.attachments && viewingMedicalRecord.attachments.length > 0 && (
                    <section className="print:break-inside-avoid">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Attachments & Digital Lab Reports</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {viewingMedicalRecord.attachments.map((file: any, i: number) => (
                          <div key={i} className="group relative">
                            <a
                              href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm"
                            >
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Paperclip className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{file.fileType?.split('/')[1] || 'File'}</p>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Report Footer */}
                <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-muted-foreground hidden print:block">
                  This report generated by MediCare+ Digital Health Record. Electronic document verified.
                </div>
              </div>
              
              <div className="p-8 pt-0 border-t border-primary/5 mt-4">
                 <Button onClick={() => setIsMedicalRecordDialogOpen(false)} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-[10px] font-black uppercase tracking-widest transition-all">
                    Acknowledge & Close Registry
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Medical Report</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Official Document</DialogDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all gap-2" onClick={() => handlePrint()}>
              <Printer className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogHeader>

          {selectedAppointment && (
            <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg print:p-8">
              {/* Report Header */}
              <div className="pb-6 border-b-2 border-primary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">Medical Report</h2>
                    <p className="text-sm text-muted-foreground font-mono">RECORD ID: {viewingMedicalRecord?._id?.toUpperCase() || "APP-"+selectedAppointment.id.slice(-6).toUpperCase()}</p>
                  </div>
                  <Badge className={cn("px-3 py-1 text-sm font-bold capitalize", 
                    selectedAppointment.status === 'completed' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {selectedAppointment.status === 'completed' ? "Official Record" : selectedAppointment.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consultation Date</p>
                    <p className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient Name</p>
                    <p className="font-medium">{selectedAppointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consulting Physician</p>
                    <p className="font-medium">Dr. {doctorProfile?.user?.name || "Doctor"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medical Facility</p>
                    <p className="font-medium">{doctorProfile?.hospitals?.[0]?.name || "MediCare+ Facility"}</p>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Primary Complaint / Reason</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                    "{selectedAppointment.reason}"
                  </div>
                </section>

                {viewingMedicalRecord?.diagnosis ? (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Diagnosis</h3>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-lg font-semibold text-slate-800">{viewingMedicalRecord.diagnosis}</p>
                    </div>
                  </section>
                ) : (
                  selectedAppointment.status !== 'completed' && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-600 font-bold italic">
                      Session pending clinical finalization...
                    </div>
                  )
                )}

                {viewingMedicalRecord?.medicines && viewingMedicalRecord.medicines.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Prescription</h3>
                    <div className="border rounded-lg overflow-hidden border-slate-200">
                      <Table className="w-full text-sm">
                        <TableHeader className="bg-slate-50 border-b border-slate-200">
                          <TableRow>
                            <TableHead className="px-4 py-2 text-left font-semibold">Medicine</TableHead>
                            <TableHead className="px-4 py-2 text-left font-semibold">Dosage</TableHead>
                            <TableHead className="px-4 py-2 text-left font-semibold">Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                          {viewingMedicalRecord.medicines.map((med: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="px-4 py-3">
                                <p className="font-medium">{typeof med === 'string' ? med : med.name}</p>
                                {med.instructions && <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>}
                              </TableCell>
                              <TableCell className="px-4 py-3 font-medium">{med.dosage || "N/A"}</TableCell>
                              <TableCell className="px-4 py-3 text-muted-foreground text-xs">{med.duration || "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                )}

                {(viewingMedicalRecord?.notes || selectedAppointment.notes) && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Consulting Advice / Notes</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                      "{viewingMedicalRecord?.notes || selectedAppointment.notes}"
                    </div>
                  </section>
                )}

                {viewingMedicalRecord?.attachments && viewingMedicalRecord.attachments.length > 0 && (
                  <section className="print:break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Attachments & Digital Lab Reports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {viewingMedicalRecord.attachments.map((file: any, i: number) => (
                        <div key={i} className="group relative">
                          <a
                            href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{file.fileType?.split('/')[1] || 'File'}</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Report Footer */}
              <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-muted-foreground hidden print:block">
                This report generated by MediCare+ Digital Health Record. Electronic document verified.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DoctorAppointments() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>}>
      <DoctorAppointmentsContent />
    </Suspense>
  )
}

