"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MoreVertical,
  Paperclip,
  FileText,
  History as HistoryIcon,
  ExternalLink,
  Pill,
  Stethoscope,
  ChevronRight,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { cn } from "@/lib/utils"
import io from "socket.io-client"

interface Appointment {
  id: string
  hospitalName: string
  doctorName: string
  department: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected"
  reason: string
  diagnosis?: string
  doctorNotes?: string
  medicines?: any[]
  attachments?: Array<{
    name: string
    url: string
    fileType: string
  }>
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    icon: AlertCircle,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  confirmed: {
    label: "Scheduled",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  completed: {
    label: "Concluded",
    icon: CheckCircle2,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  rejected: {
    label: "Declined",
    icon: XCircle,
    className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
}

export function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [activeTab, setActiveTab] = useState("upcoming")
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
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
      }
    } catch (error) {
      console.error("Error fetching medical record detail:", error)
    } finally {
      setFetchingRecord(false)
    }
  }

  useEffect(() => {
    const socket = io("http://localhost:5000")
    socket.on("appointment_created", () => fetchAppointments())
    socket.on("appointment_updated", () => fetchAppointments())
    return () => { socket.disconnect() }
  }, [])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch("http://localhost:5000/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const recordsRes = await fetch("http://localhost:5000/api/medical-records/my", {
          headers: { Authorization: `Bearer ${token}` }
        })
        let records: any[] = []
        if (recordsRes.ok) {
          records = await recordsRes.json()
        }

        const mapped = data.map((apt: any) => {
          const record = records.find(r => r.appointment?._id === apt._id || r.appointment === apt._id)
          return {
            id: apt._id,
            hospitalName: apt.hospital?.name || "Unknown Hospital",
            doctorName: apt.doctor?.user?.name || "Unknown Doctor",
            department: apt.doctor?.specialization || "General",
            date: apt.date,
            time: apt.time,
            status: apt.status,
            reason: apt.reason,
            diagnosis: record?.diagnosis,
            doctorNotes: record?.notes,
            medicines: record?.medicines,
            attachments: apt.attachments
          }
        })
        setAppointments(mapped)
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

  const filterAppointments = (tab: string) => {
    return appointments.filter((apt) => {
      const isPast = new Date(apt.date) < new Date() && new Date(apt.date).toDateString() !== new Date().toDateString()
      const isToday = new Date(apt.date).toDateString() === new Date().toDateString()

      switch (tab) {
        case "upcoming":
          return (isToday || new Date(apt.date) > new Date()) && (apt.status === "pending" || apt.status === "confirmed")
        case "past":
          return isPast || apt.status === "completed"
        case "cancelled":
          return apt.status === "cancelled" || apt.status === "rejected"
        default:
          return true
      }
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
     return (
        <div className="flex items-center justify-center py-20">
           <RefreshCw className="h-8 w-8 text-primary animate-spin opacity-20" />
        </div>
     )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 px-1">
         <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Medical Registry</h2>
         <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[10px] h-5 font-black uppercase tracking-tighter">
            {appointments.length} Records
         </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-transparent">
        <TabsList className="bg-background/40 backdrop-blur-md border border-primary/5 p-1 rounded-2xl h-auto self-start mb-6">
          <TabsTrigger 
            value="upcoming" 
            className="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            Active
          </TabsTrigger>
          <TabsTrigger 
            value="past" 
            className="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            History
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled" 
            className="rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            Revoked
          </TabsTrigger>
        </TabsList>

        {["upcoming", "past", "cancelled"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 outline-none focus-visible:ring-0">
            {filterAppointments(tab).length === 0 ? (
              <div className="text-center py-20 bg-primary/5 border border-dashed border-primary/10 rounded-[2.5rem]">
                <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/5">
                  <HistoryIcon className="h-8 w-8 text-primary/30" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Registry Silence</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-10">
                  No clinical records found for the &quot;{tab}&quot; cycle.
                </p>
              </div>
            ) : (
              filterAppointments(tab).map((appointment) => {
                const status = statusConfig[appointment.status] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <Card
                    key={appointment.id}
                    className="group border-none shadow-xl shadow-primary/5 bg-background/40 backdrop-blur-md rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
                              {appointment.hospitalName}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border", status.className)}
                            >
                              <StatusIcon className="h-2.5 w-2.5 mr-1.5" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-primary/5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">Consultant</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {appointment.doctorName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-primary/5">
                              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Stethoscope className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">Specialty</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                  {appointment.department}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-6 px-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {formatDate(appointment.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary opacity-60" />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                                {appointment.time}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 p-3 bg-primary/5 rounded-2xl border border-primary/5 border-dashed">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-1">
                              <span className="font-black normal-case not-italic text-primary mr-1">Reason:</span>
                              &quot;{appointment.reason}&quot;
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 flex-1 lg:flex-none rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-primary/5 text-slate-400 hover:text-primary transition-all active:scale-95 border border-primary/5"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-12 w-12 flex-1 lg:flex-none rounded-2xl bg-white/40 dark:bg-white/5 hover:bg-primary/5 text-slate-400 transition-all active:scale-95 border border-primary/5">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border-primary/10 shadow-2xl p-2 min-w-[180px]">
                              <DropdownMenuItem 
                                onClick={() => setSelectedAppointment(appointment)}
                                className="rounded-xl px-4 py-3 text-xs font-bold gap-3 focus:bg-primary/5 focus:text-primary transition-all cursor-pointer"
                              >
                                <FileText className="h-4 w-4" />
                                View Full Case
                              </DropdownMenuItem>
                              {appointment.status === "pending" && (
                                <DropdownMenuItem className="rounded-xl px-4 py-3 text-xs font-bold gap-3 text-rose-500 focus:bg-rose-50 focus:text-rose-600 transition-all cursor-pointer">
                                  <XCircle className="h-4 w-4" />
                                  Recall Request
                                </DropdownMenuItem>
                              )}
                              {appointment.status === "confirmed" && (
                                <>
                                  <DropdownMenuItem className="rounded-xl px-4 py-3 text-xs font-bold gap-3 focus:bg-primary/5 focus:text-primary transition-all cursor-pointer">
                                    <Clock className="h-4 w-4" />
                                    Reschedule
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl px-4 py-3 text-xs font-bold gap-3 text-rose-500 focus:bg-rose-50 focus:text-rose-600 transition-all cursor-pointer">
                                    <XCircle className="h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                              {appointment.status === "completed" && (
                                <DropdownMenuItem className="rounded-xl px-4 py-3 text-xs font-bold gap-3 focus:bg-primary/5 focus:text-primary transition-all cursor-pointer">
                                  <RefreshCw className="h-4 w-4" />
                                  Book Again
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-background/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl">
          <DialogTitle className="sr-only">Appointment Details</DialogTitle>
          {selectedAppointment && (
            <div className="flex flex-col">
              <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Appointment Case</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic">Registry Entry #{selectedAppointment.id.slice(-6)}</p>
                  </div>
                  <Badge className={cn("ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-none", (statusConfig[selectedAppointment.status] || statusConfig.pending).className)}>
                    {(statusConfig[selectedAppointment.status] || statusConfig.pending).label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDate(selectedAppointment.date)}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedAppointment.time}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hospital</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{selectedAppointment.hospitalName}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consultant</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{selectedAppointment.doctorName}</span>
                   </div>
                </div>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <AlertCircle className="h-2 w-2 text-primary" />
                    Clinical Reason
                  </div>
                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/5 italic text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    &quot;{selectedAppointment.reason}&quot;
                  </div>
                </div>

                {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      <Paperclip className="h-2 w-2 text-primary" />
                      Associated Documents
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedAppointment.attachments.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (file.url.startsWith("medical-record:")) {
                              fetchMedicalRecordDetail(file.url.split(":")[1]);
                            } else {
                              window.open(file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`, "_blank");
                            }
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-primary/5 hover:border-primary/20 transition-all group group/btn"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover/btn:bg-primary/20 transition-colors">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{file.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAppointment.status === "completed" && (selectedAppointment.diagnosis || selectedAppointment.doctorNotes) && (
                  <div className="space-y-4 pt-4 border-t border-primary/5">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary">Clinical Assessment</h4>
                    {selectedAppointment.diagnosis && (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Diagnosis</span>
                         <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedAppointment.diagnosis}</p>
                      </div>
                    )}
                    {selectedAppointment.doctorNotes && (
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-primary/5 rounded-2xl border-dashed">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes from Consultant</span>
                         <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">&quot;{selectedAppointment.doctorNotes}&quot;</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-primary/5 flex justify-end gap-3 rounded-b-[2.5rem]">
                <Button variant="ghost" onClick={() => setSelectedAppointment(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Dismiss</Button>
                <Button onClick={() => setSelectedAppointment(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20">Confirmed Acknowledgement</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Medical Record Detail Dialog */}
      <Dialog open={isMedicalRecordDialogOpen} onOpenChange={setIsMedicalRecordDialogOpen}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh] p-0 border-none bg-background/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl">
          <DialogTitle className="sr-only">Medical Record Detail</DialogTitle>
          {viewingMedicalRecord && (
            <div className="flex flex-col">
              <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <HistoryIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Clinical Narrative</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic">Official Diagnostic Report</p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Primary Diagnosis</p>
                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{viewingMedicalRecord.diagnosis}</p>
                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Calendar className="h-4 w-4 opacity-50" />
                        {new Date(viewingMedicalRecord.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      {viewingMedicalRecord.doctor?.user?.name && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <User className="h-4 w-4 opacity-50" />
                          Dr. {viewingMedicalRecord.doctor.user.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-primary/5 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Originating Facility</p>
                      <div className="flex items-center gap-2 text-lg font-black text-slate-700 dark:text-slate-200">
                        <MapPin className="h-5 w-5 text-primary" />
                        {viewingMedicalRecord.appointment?.hospital?.name || "Independent Registry"}
                      </div>
                    </div>
                    <Badge className="mt-4 self-start bg-success/10 text-success border-none text-[8px] font-black uppercase tracking-widest">Digital Asset Verified</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-3xl border border-primary/5 space-y-6">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                      <Stethoscope className="h-4 w-4" />
                      Assessment Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Treatment Schema</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingMedicalRecord.medicines?.length > 0 ? (
                            viewingMedicalRecord.medicines.map((m: any, i: number) => {
                              const medName = typeof m === 'string' ? m : m.name;
                              return (
                                <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold px-3 py-1 rounded-full">
                                  <Pill className="h-3 w-3 mr-1.5" />
                                  {medName}
                                </Badge>
                              );
                            })
                          ) : <p className="text-xs text-slate-400 italic">No medicinal entries record.</p>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immunological Hazards</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingMedicalRecord.allergies?.length > 0 ? (
                            viewingMedicalRecord.allergies.map((a: string, i: number) => (
                              <Badge key={i} variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none text-[10px] font-bold px-3 py-1 rounded-full">
                                <AlertCircle className="h-3 w-3 mr-1.5" />
                                {a}
                              </Badge>
                            ))
                          ) : <p className="text-xs text-slate-400 italic font-medium">Safe - No allergies reported</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewingMedicalRecord.notes && (
                    <div className="p-6 rounded-3xl border border-primary/5 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <FileText className="h-4 w-4 opacity-50" />
                        Consultant Remarks
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        &quot;{viewingMedicalRecord.notes}&quot;
                      </div>
                    </div>
                  )}

                  {viewingMedicalRecord.attachments?.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <Paperclip className="h-4 w-4 opacity-50" />
                        Supporting Evidence
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {viewingMedicalRecord.attachments.map((file: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => window.open(file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`, "_blank")}
                            className="flex flex-col items-start gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group group/card w-full"
                          >
                            <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center group-hover/card:bg-primary/10 transition-colors">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 w-full text-left">
                              <p className="text-xs font-black truncate text-slate-800 dark:text-slate-100">{file.name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter opacity-60">{file.fileType?.split('/')?.[1] || 'DOC'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-primary/5 flex justify-end">
                <Button onClick={() => setIsMedicalRecordDialogOpen(false)} className="rounded-2xl font-black uppercase tracking-widest text-[10px] px-8 py-6 h-auto shadow-lg shadow-primary/20">Close Narrative</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
