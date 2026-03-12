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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const mockAppointments: Appointment[] = []

const statusConfig = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "bg-warning/20 text-warning-foreground border-warning",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-success/20 text-success border-success",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-muted text-muted-foreground border-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-destructive/20 text-destructive border-destructive",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/20 text-destructive border-destructive",
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
    const socket = io("http://localhost:5000")

    socket.on("appointment_created", (data) => {
      console.log("Appointment created notification:", data)
      fetchAppointments()
    })

    socket.on("appointment_updated", (data) => {
      console.log("Appointment updated notification:", data)
      fetchAppointments()
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token")
      // If no token, maybe empty or redirect? For now just return
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch("http://localhost:5000/api/appointments/my", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Fetch medical records to get remarks for completed appointments
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date)
      aptDate.setHours(0, 0, 0, 0)

      // Basic date comparison logic
      const isPast = new Date(apt.date) < new Date() && new Date(apt.date).toDateString() !== new Date().toDateString()
      const isToday = new Date(apt.date).toDateString() === new Date().toDateString()

      switch (tab) {
        case "upcoming":
          return (
            (isToday || new Date(apt.date) > new Date()) &&
            (apt.status === "pending" || apt.status === "confirmed")
          )
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Appointments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upcoming">
              Upcoming
              <Badge variant="secondary" className="ml-2">
                {filterAppointments("upcoming").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {["upcoming", "past", "cancelled"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3">
              {filterAppointments(tab).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {tab} appointments
                </div>
              ) : (
                filterAppointments(tab).map((appointment) => {
                  const status = statusConfig[appointment.status]
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={appointment.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">
                              {appointment.hospitalName}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", status.className)}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              <span>
                                {appointment.doctorName} •{" "}
                                {appointment.department}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(appointment.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {appointment.time}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm">
                            <span className="text-muted-foreground">
                              Reason:{" "}
                            </span>
                            {appointment.reason}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedAppointment(appointment)}>
                              View Details
                            </DropdownMenuItem>
                            {appointment.status === "pending" && (
                              <DropdownMenuItem className="text-destructive">
                                Cancel Appointment
                              </DropdownMenuItem>
                            )}
                            {appointment.status === "confirmed" && (
                              <>
                                <DropdownMenuItem>Reschedule</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Cancel Appointment
                                </DropdownMenuItem>
                              </>
                            )}
                            {appointment.status === "completed" && (
                              <DropdownMenuItem>Book Again</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Full information about your appointment
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Hospital</p>
                  <p className="font-semibold">{selectedAppointment.hospitalName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Doctor</p>
                  <p className="font-semibold">{selectedAppointment.doctorName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Department</p>
                  <p className="font-semibold">{selectedAppointment.department}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Status</p>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusConfig[selectedAppointment.status].className)}
                  >
                    {statusConfig[selectedAppointment.status].label}
                  </Badge>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedAppointment.date)}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium">Time</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedAppointment.time}
                  </p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t">
                <p className="text-sm text-muted-foreground font-medium">Reason for Visit</p>
                <div className="p-3 bg-muted rounded-lg text-sm text-foreground">
                  {selectedAppointment.reason}
                </div>
              </div>

              {selectedAppointment.attachments && selectedAppointment.attachments.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4" />
                    Patient Attachments
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedAppointment.attachments.map((file, idx) => (
                      file.url.startsWith("medical-record:") || file.fileType === "text/reference" ? (
                        <button
                          key={idx}
                          disabled={fetchingRecord}
                          onClick={() => {
                            if (file.url.startsWith("medical-record:")) {
                              const id = file.url.split(":")[1];
                              fetchMedicalRecordDetail(id);
                            } else {
                              alert("Detailed view is not available for this record (old summary reference).");
                            }
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-all active:scale-95 group w-full disabled:opacity-50"
                          title="Click to view full medical record"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="text-xs font-bold truncate">{fetchingRecord ? "Loading..." : file.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <a
                          key={idx}
                          href={file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Paperclip className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs font-medium truncate">{file.name}</span>
                          </div>
                          <CheckCircle2 className="h-3 w-3 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )
                    ))}
                  </div>
                </div>
              )}

              {selectedAppointment.status === "completed" && (selectedAppointment.diagnosis || selectedAppointment.doctorNotes) && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-semibold text-primary">Doctor&apos;s Assessment</p>

                  {selectedAppointment.diagnosis && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Diagnosis</p>
                      <div className="p-3 bg-success/5 border border-success/10 rounded-lg text-sm font-medium">
                        {selectedAppointment.diagnosis}
                      </div>
                    </div>
                  )}

                  {selectedAppointment.doctorNotes && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Doctor&apos;s Remarks</p>
                      <div className="p-3 bg-muted rounded-lg text-sm italic">
                        &quot;{selectedAppointment.doctorNotes}&quot;
                      </div>
                    </div>
                  )}

                  {selectedAppointment.medicines && selectedAppointment.medicines.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prescribed Medicines</p>
                      <div className="space-y-2">
                        {selectedAppointment.medicines.map((med: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-primary/5 border border-primary/10">
                            <div>
                              <p className="text-sm font-semibold">{med.name}</p>
                              {med.instructions && (
                                <p className="text-xs text-muted-foreground">{med.instructions}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-[10px] py-0 h-5">
                                {med.dosage}
                              </Badge>
                              {med.duration && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{med.duration}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedAppointment(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                          viewingMedicalRecord.medicines.map((m: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-success/10 text-success border-success/20 text-[10px] font-bold">
                              <Pill className="h-2.5 w-2.5 mr-1" />
                              {m}
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
    </Card>
  )
}
