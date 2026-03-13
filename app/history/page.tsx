"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useReactToPrint } from "react-to-print"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Download,
  FileText,
  Ambulance,
  Building2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Paperclip,
  Printer,
  History,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AppNavigation } from "@/components/app-navigation"

interface EmergencyRecord {
  id: string
  date: string
  time: string
  type: string
  location: string
  hospital: string
  ambulanceTime: string
  status: "completed" | "cancelled"
}

interface AppointmentRecord {
  id: string
  date: string
  time: string
  hospital: string
  department: string
  doctor: string
  status: "completed" | "cancelled" | "no-show"
  notes?: string
}

interface MedicalRecord {
  _id: string
  doctor: { user: { name: string } }
  diagnosis: string
  medicines: Array<{ name: string; dosage: string; duration: string; instructions: string }>
  allergies: string[]
  notes: string
  attachments?: Array<{ name: string; url: string; fileType: string }>
  date: string
  appointment: any
  hospital?: { name: string }
}

// Local types for the component
interface Emergency {
  _id: string
  emergencyType: string
  status: string
  createdAt: string
  location?: { name: string }
  priority: string
  hospitalId?: { name: string }
}

function HistoryContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "appointments"
  
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [emergencies, setEmergencies] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [userName, setUserName] = useState("Patient")
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [selectedEmergency, setSelectedEmergency] = useState<any | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)
  const [isEmergencyDetailOpen, setIsEmergencyDetailOpen] = useState(false)
  const [isAppointmentDetailOpen, setIsAppointmentDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(tabParam)
  
  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
  })

  // Sync active tab with query param if it changes
  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")
      if (!token || !userStr) return
      
      const user = JSON.parse(userStr)
      setUserName(user.name)

      const headers = { Authorization: `Bearer ${token}` }

      // Fetch Medical Records
      const resRecords = await fetch("http://localhost:5000/api/medical-records/my", { headers })
      if (resRecords.ok) setMedicalRecords(await resRecords.json())

      // Fetch Emergencies
      const resEmergencies = await fetch(`http://localhost:5000/api/emergencies/my/${user.id || user._id}`, { headers })
      if (resEmergencies.ok) setEmergencies(await resEmergencies.json())

      // Fetch Appointments
      const resAppointments = await fetch("http://localhost:5000/api/appointments/my", { headers })
      if (resAppointments.ok) setAppointments(await resAppointments.json())

    } catch (error) {
      console.error("Error fetching history data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "no-show":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">
            No Show
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 -z-10 pointer-events-none" />
      
      <main className="md:ml-20 lg:ml-64 pb-20">
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">Medical History</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                  Comprehensive Incident Timeline
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 bg-white/40 border-primary/5 hover:bg-primary hover:text-white transition-all font-bold text-xs">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-background/40 backdrop-blur-sm group hover:bg-red-500/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{emergencies.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Emergencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-background/40 backdrop-blur-sm group hover:bg-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{appointments.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-background/40 backdrop-blur-sm group hover:bg-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:scale-110 transition-transform">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      {appointments.filter((a: any) => a.status === "completed").length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-background/40 backdrop-blur-sm group hover:bg-blue-500/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:scale-110 transition-transform">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight">
                      {[...new Set(appointments.map((a: any) => a.hospital?._id))].filter(Boolean).length}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Hospitals Visited</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex justify-end pt-2">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-44 bg-background/50 backdrop-blur-sm border-primary/10 focus:ring-primary/20 transition-all rounded-xl h-10">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Total History</SelectItem>
                <SelectItem value="month">Current Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Current Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* History Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 p-1 bg-background/40 backdrop-blur-md rounded-2xl border border-primary/5 h-12 shadow-sm">
              <TabsTrigger value="emergencies" className="gap-2 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <Ambulance className="h-4 w-4" />
                <span className="font-semibold text-xs">Emergencies</span>
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold text-xs">Appointments</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2 rounded-xl transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <FileText className="h-4 w-4" />
                <span className="font-semibold text-xs">Medical Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emergencies" className="space-y-4 pt-4 outline-none">
              {emergencies.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground/60 italic">No emergency records found.</p>
              ) : (
                emergencies.map((record: any) => (
                  <Card key={record._id} className="border-primary/5 bg-background/40 backdrop-blur-sm group hover:scale-[1.01] transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500/40" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-red-500/10">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold capitalize">{record.emergencyType} Emergency</h3>
                              <Badge className={cn("capitalize", 
                                record.status === 'completed' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"
                              )}>
                                {record.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(record.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {record.location?.name || "Location Shared"}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-primary" />
                                {record.hospitalId?.name || "Requesting Hospital..."}
                              </span>
                              <Badge variant="outline" className={cn("text-[10px]", 
                                record.priority === 'critical' ? "text-red-600 border-red-200" : "text-amber-600 border-amber-200"
                              )}>
                                {record.priority} Priority
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl border-primary/10 shadow-sm group"
                          onClick={() => {
                            setSelectedEmergency(record)
                            setIsEmergencyDetailOpen(true)
                          }}
                        >
                          <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          View Case Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4 pt-4 outline-none">
              {appointments.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground/60 italic">No appointments found.</p>
              ) : (
                appointments.map((record: any) => (
                  <Card key={record._id} className="border-primary/5 bg-background/40 backdrop-blur-sm group hover:scale-[1.01] transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg leading-none">{record.doctor?.specialization || "General Consultation"}</h3>
                              {getStatusBadge(record.status)}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mt-2">
                              Dr. {record.doctor?.user?.name || "Doctor"} at {record.hospital?.name || "Facility"}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(record.date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {record.time}
                              </span>
                            </div>
                            {record.reason && (
                              <p className="text-sm mt-3 p-3 bg-muted/30 border border-primary/5 rounded-xl text-muted-foreground leading-relaxed">
                                <span className="font-bold text-[10px] text-primary block mb-1 uppercase tracking-widest">Reason for visit</span>
                                {record.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl border-primary/10 shadow-sm group"
                          onClick={() => {
                            setSelectedAppointment(record)
                            setIsAppointmentDetailOpen(true)
                          }}
                        >
                          <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          View Summary
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            <TabsContent value="reports" className="space-y-4 pt-4 outline-none">
              {loading ? (
                <p className="text-center py-12 text-muted-foreground/60 italic">Synching with healthcare network...</p>
              ) : medicalRecords.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground/60 italic">No medical reports found.</p>
              ) : (
                medicalRecords.map((record) => (
                  <Card key={record._id} className="border-primary/5 bg-background/40 backdrop-blur-sm group hover:scale-[1.01] transition-all duration-300 hover:shadow-lg overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg leading-none">{record.diagnosis}</h3>
                            <p className="text-sm font-medium text-muted-foreground mt-2">
                              Dr. {record.doctor?.user?.name || "Doctor"} • {formatDate(record.date)}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {record.medicines.slice(0, 3).map((m, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-bold bg-primary/5 text-primary border-primary/10 rounded-lg">
                                  {m.name}
                                </Badge>
                              ))}
                              {record.medicines.length > 3 && (
                                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground/60 border-none">
                                  +{record.medicines.length - 3} MORE
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all rounded-xl border-primary/10 shadow-sm group"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          Analyze Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AppNavigation />
      <Dialog open={selectedRecord !== null} onOpenChange={(open) => !open && setSelectedRecord(null)}>
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

          {selectedRecord && (
            <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg print:p-8">
              {/* Report Header */}
              <div className="pb-6 border-b-2 border-primary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">Medical Report</h2>
                    <p className="text-sm text-muted-foreground font-mono">RECORD ID: {selectedRecord._id.toUpperCase()}</p>
                  </div>
                  <Badge className="bg-primary text-white px-3 py-1 text-sm font-bold">
                    Official Record
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consultation Date</p>
                    <p className="font-medium">{new Date(selectedRecord.date).toLocaleDateString()} at {new Date(selectedRecord.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient Name</p>
                    <p className="font-medium">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consulting Physician</p>
                    <p className="font-medium">Dr. {selectedRecord.doctor?.user?.name || "Self-Uploaded"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medical Facility</p>
                    <p className="font-medium">{selectedRecord.appointment?.hospital?.name || selectedRecord.hospital?.name || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Primary Complaint / Reason</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                    "{selectedRecord.appointment?.reason || "General document upload and health record maintenance."}"
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Diagnosis</h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-lg font-semibold text-slate-800">{selectedRecord.diagnosis}</p>
                  </div>
                </section>

                {selectedRecord.medicines && selectedRecord.medicines.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Prescription</h3>
                    <div className="border rounded-lg overflow-hidden border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">Medicine</th>
                            <th className="px-4 py-2 text-left font-semibold">Dosage</th>
                            <th className="px-4 py-2 text-left font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRecord.medicines.map((med, i) => (
                            <tr key={i}>
                              <td className="px-4 py-3">
                                <p className="font-medium">{med.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>
                              </td>
                              <td className="px-4 py-3 font-medium">{med.dosage}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">{med.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {selectedRecord.notes && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Consulting Advice / Notes</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                      "{selectedRecord.notes}"
                    </div>
                  </section>
                )}

                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <section className="print:break-inside-avoid">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Attachments & Digital Lab Reports</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedRecord.attachments.map((file, i) => (
                        <div key={i} className="group relative">
                          <a
                            href={`http://localhost:5000${file.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-slate-100 hover:border-primary/20 hover:bg-white transition-all shadow-sm"
                          >
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                              <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{file.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{file.fileType.split('/')[1] || 'File'}</p>
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
                This report includes patient-uploaded documents. MediCare+ Digital Health Record.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={isAppointmentDetailOpen} onOpenChange={setIsAppointmentDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Appointment Summary</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Visit Verification</DialogDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all gap-2" onClick={() => handlePrint()}>
              <FileText className="h-4 w-4" />
              Download Log
            </Button>
          </DialogHeader>

          {selectedAppointment && (
            <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg shadow-sm border print:p-8">
              {/* Report Header */}
              <div className="pb-6 border-b-2 border-primary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">Appointment Summary</h2>
                    <p className="text-sm text-muted-foreground font-mono">APP ID: {selectedAppointment._id?.toUpperCase() || "N/A"}</p>
                  </div>
                  <Badge className={cn("px-3 py-1 text-sm font-bold capitalize", 
                    selectedAppointment.status === 'completed' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                  )}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Date & Time</p>
                    <p className="font-medium">{formatDate(selectedAppointment.date)} at {selectedAppointment.time}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient Name</p>
                    <p className="font-medium">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consulting Physician</p>
                    <p className="font-medium">Dr. {selectedAppointment.doctor?.user?.name || "Doctor"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Medical Facility</p>
                    <p className="font-medium">{selectedAppointment.hospital?.name || "Facility"}</p>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Specialization</h3>
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-lg font-semibold text-slate-800">{selectedAppointment.doctor?.specialization || "General Medicine"}</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Reason for Visit</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed">
                    {selectedAppointment.reason || "Scheduled follow-up or general consultation."}
                  </div>
                </section>

                {selectedAppointment.notes && (
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Doctor's Notes</h3>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm leading-relaxed italic">
                      "{selectedAppointment.notes}"
                    </div>
                  </section>
                )}
              </div>

              {/* Report Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-muted-foreground">
                <p>Digital Health System • Appointment Dashboard</p>
                <p>Printed: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Emergency Record Detail Dialog */}
      <Dialog open={isEmergencyDetailOpen} onOpenChange={setIsEmergencyDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-red-600">Emergency Incident Report</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-red-500 uppercase tracking-widest mt-1">SOS Documentation</DialogDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-red-500/10 hover:bg-red-600 hover:text-white transition-all gap-2" onClick={() => handlePrint()}>
              <FileText className="h-4 w-4" />
              Download Case
            </Button>
          </DialogHeader>

          {selectedEmergency && (
            <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg shadow-sm border print:p-8">
              {/* Report Header */}
              <div className="pb-6 border-b-2 border-primary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1 capitalize">{selectedEmergency.emergencyType} Emergency Report</h2>
                    <p className="text-sm text-muted-foreground font-mono">CASE ID: {selectedEmergency._id.toUpperCase()}</p>
                  </div>
                  <Badge className={cn("px-3 py-1 text-sm font-bold capitalize", 
                    selectedEmergency.priority === 'critical' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {selectedEmergency.priority} Priority
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Incident Date & Time</p>
                    <p className="font-medium">{new Date(selectedEmergency.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Patient Name</p>
                    <p className="font-medium">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Responding Facility</p>
                    <p className="font-medium">{selectedEmergency.hospitalId?.name || "Emergency Medical Services"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Current Status</p>
                    <p className="font-medium capitalize">{selectedEmergency.status.replace('-', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Incident Location</h3>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{selectedEmergency.location?.name || "GPS Coordinates Shared"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lat: {selectedEmergency.location?.coordinates[1].toFixed(6)}, Lng: {selectedEmergency.location?.coordinates[0].toFixed(6)}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Primary Assessment</h3>
                  <div className="p-4 bg-red-50/30 rounded-lg border border-red-100">
                    <p className="text-sm leading-relaxed text-slate-700">
                      Emergency triggered via SOS button. Immediate response requested for <strong>{selectedEmergency.emergencyType}</strong> symptoms. 
                      Priority handled as <strong>{selectedEmergency.priority}</strong>.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Response Timeline</h3>
                  <div className="space-y-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    <div className="flex items-center gap-4 relative pl-6">
                      <div className="absolute left-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                      <div className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                        <span className="font-bold">SOS Triggered:</span> {new Date(selectedEmergency.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    {selectedEmergency.hospitalId && (
                      <div className="flex items-center gap-4 relative pl-6">
                        <div className="absolute left-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
                        <div className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                          <span className="font-bold">Assigned to:</span> {selectedEmergency.hospitalId.name}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 relative pl-6">
                      <div className="absolute left-0 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                      <div className="flex-1 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                        <span className="font-bold">Latest Update:</span> Status changed to {selectedEmergency.status}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Report Footer */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-[10px] text-muted-foreground">
                <p>Digital Health System • SOS Incident Report</p>
                <p>Page 1 of 1</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <HistoryContent />
    </Suspense>
  )
}
