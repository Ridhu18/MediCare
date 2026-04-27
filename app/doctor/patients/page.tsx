"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Plus,
  History as HistoryIcon,
  Activity,
  FileDown,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Removed inline navItems

interface Patient {
  id: string
  name: string
  age: number
  gender: "Male" | "Female" | "Other"
  phone: string
  email: string
  healthId: string
  lastVisit: string
  nextAppointment?: string
  condition: string
  status: "stable" | "monitoring" | "improving" | "critical"
  totalVisits: number
}

const patients: Patient[] = []

export default function DoctorPatients() {
  const [search, setSearch] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // New states for patient details
  const [patientHistory, setPatientHistory] = useState<any[]>([])
  const [medicalRecords, setMedicalRecords] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [profile, setProfile] = useState<any>({
    name: "",
    profileImage: "",
    specialization: "",
    department: ""
  })

  useEffect(() => {
    if (selectedPatient) {
      const fetchPatientDetails = async () => {
        setDetailsLoading(true)
        try {
          const token = localStorage.getItem("token")

          // Fetch Appointment History
          const historyRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/patient/${selectedPatient.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (historyRes.ok) {
            setPatientHistory(await historyRes.json())
          }

          // Fetch Medical Records
          const recordsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/patient/${selectedPatient.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (recordsRes.ok) {
            setMedicalRecords(await recordsRes.json())
          }

        } catch (error) {
          console.error("Error fetching patient details", error)
        } finally {
          setDetailsLoading(false)
        }
      }
      fetchPatientDetails()
    }
  }, [selectedPatient])

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/doctor`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setProfile({
            name: data.user?.name || "",
            profileImage: data.user?.profileImage || "",
            specialization: data.specialization || "",
            department: data.department || ""
          })
          // Extract unique patients from appointments
          const patientMap = new Map<string, Patient>()

          data.forEach((apt: any) => {
            const pId = apt.patient?._id
            if (!pId) return;

            if (!patientMap.has(pId)) {
              patientMap.set(pId, {
                id: pId,
                name: apt.patient.name,
                email: apt.patient.email,
                phone: apt.patient.phone,
                age: 0, // Not available
                gender: "Other", // Not available
                healthId: "N/A",
                lastVisit: apt.date,
                condition: "Unknown", // Needs medical history
                status: "stable",
                totalVisits: 0
              })
            }

            const p = patientMap.get(pId)!
            p.totalVisits += 1
            if (new Date(apt.date) > new Date(p.lastVisit)) {
              p.lastVisit = apt.date
            }
            // If status is pending or confirmed and date > today, set next appointment
            if ((apt.status === 'confirmed' || apt.status === 'pending') && new Date(apt.date) > new Date()) {
              if (!p.nextAppointment || new Date(apt.date) < new Date(p.nextAppointment)) {
                p.nextAppointment = apt.date
              }
            }
          })

          setPatients(Array.from(patientMap.values()))
        }
      } catch (error) {
        console.error("Error fetching patients", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.condition.toLowerCase().includes(search.toLowerCase()) ||
      patient.healthId.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: Patient["status"]) => {
    switch (status) {
      case "stable":
        return "bg-success/20 text-success border-success"
      case "monitoring":
        return "bg-warning/20 text-warning-foreground border-warning"
      case "improving":
        return "bg-primary/20 text-primary border-primary"
      case "critical":
        return "bg-emergency/20 text-emergency-foreground border-emergency"
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
              <div className="h-12 w-12 rounded-[1.25rem] bg-emergency/10 flex items-center justify-center text-emergency shadow-sm ring-1 ring-emergency/5">
                <Users className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Patient Records</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Connected Healthcare Network</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    New Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-background/60 backdrop-blur-2xl border-none shadow-2xl rounded-3xl">
                  <DialogTitle className="text-lg font-black tracking-tight text-slate-800 uppercase">Add New Patient</DialogTitle>
                  <div className="py-10 text-center space-y-4">
                    <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground max-w-[200px] mx-auto opacity-60 tracking-tight">
                      Standard patient registration protocol will be initiated here.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                <AvatarImage src={profile.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${profile.profileImage}` : ""} className="object-cover" />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                  {profile.name ? profile.name.split(" ").map((n: any) => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="px-6 py-10 space-y-10">
          {/* Search */}
          <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Query patient names, conditions, or Health IDs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 pl-11 bg-white/50 border-primary/10 rounded-2xl focus:ring-primary/20 font-bold text-sm transition-all hover:bg-white"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="group border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2.5rem] overflow-hidden hover:scale-[1.01] transition-all duration-500 cursor-pointer"
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-8">
                    <Avatar className="h-16 w-16 border-4 border-background shadow-xl rounded-full">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-black rounded-full">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight transition-colors group-hover:text-primary">{patient.name}</h3>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {patient.age}Y • {patient.gender} • <span className="opacity-60 text-[10px]">HEALTH ID: {patient.healthId}</span>
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border-none", getStatusColor(patient.status))}
                        >
                          {patient.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-primary/5">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Diagnosis</p>
                          <p className="text-sm font-bold text-slate-700">{patient.condition}</p>
                        </div>
                        <div className="space-y-1 border-x border-primary/5 px-8">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Past Visit</p>
                          <p className="text-sm font-bold text-slate-700">
                            {new Date(patient.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Encounters</p>
                          <p className="text-sm font-bold text-slate-700">{patient.totalVisits} Transitions</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-6 mt-6">
                        <div className="flex items-center gap-2.5 text-slate-500">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Phone className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold">{patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-500">
                          <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-bold truncate">{patient.email}</span>
                        </div>
                        {patient.nextAppointment && (
                          <div className="flex items-center gap-2.5 text-primary">
                            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                              <Calendar className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight">
                              NEXT: {new Date(patient.nextAppointment).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 mt-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `tel:${patient.phone.replace(/\s/g, "")}`
                          }}
                          className="h-10 px-6 rounded-xl font-bold text-xs bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 mr-2" />
                          Quick Dial
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPatient(patient)
                          }}
                          className="h-10 px-6 rounded-xl font-bold text-xs bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 mr-2" />
                          Full History
                        </Button>
                        <Link href={`/doctor/appointments?patient=${patient.name}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-10 px-6 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                            <Calendar className="h-3.5 w-3.5 mr-2" />
                            Set Session
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Patient Details Dialog */}
      <Dialog open={selectedPatient !== null} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-none bg-background/60 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] p-8">
          {selectedPatient && (
            <>
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/5">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Patient Record</DialogTitle>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Identity Verification Complete</p>
                  </div>
                </div>
              </DialogHeader>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl h-auto gap-1 mb-8">
                  <TabsTrigger value="overview" className="flex-1 py-3 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Overview</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 py-3 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">History</TabsTrigger>
                  <TabsTrigger value="records" className="flex-1 py-3 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary transition-all">Medical Records</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-8 outline-none focus-visible:ring-0">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-slate-50/50 rounded-[2rem] border border-primary/5">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name</p>
                      <p className="text-sm font-bold text-slate-800">{selectedPatient.name}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Bio Profile</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedPatient.age}Y • {selectedPatient.gender}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mobile Signal</p>
                      <p className="text-sm font-bold text-slate-800">{selectedPatient.phone}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Digital Gateway</p>
                      <p className="text-sm font-bold text-slate-800">{selectedPatient.email}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Health Identity</p>
                      <p className="text-sm font-bold text-slate-800">{selectedPatient.healthId}</p>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Status</p>
                      <Badge
                        variant="secondary"
                        className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border-none", getStatusColor(selectedPatient.status))}
                      >
                        {selectedPatient.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Chief Complaint / Condition</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight leading-relaxed">{selectedPatient.condition}</p>
                  </div>
                </TabsContent>
                <TabsContent value="history" className="outline-none focus-visible:ring-0">
                  <div className="space-y-6">
                    {detailsLoading ? (
                       <div className="py-20 text-center animate-pulse">
                         <div className="h-10 w-10 bg-slate-200 rounded-full mx-auto mb-4" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-300">Retrieving Timeline...</p>
                       </div>
                    ) : patientHistory.length === 0 ? (
                      <div className="py-20 text-center space-y-4 opacity-40">
                         <HistoryIcon className="h-12 w-12 mx-auto text-slate-300" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">Empty Encounter History</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patientHistory.map((apt) => (
                          <div key={apt._id} className="p-6 bg-white/40 border border-primary/5 rounded-[2rem] flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all duration-500">
                            <div className="flex items-center gap-6">
                              <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Calendar className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                                  {new Date(apt.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} • {apt.time}
                                </p>
                                <p className="text-xs font-bold text-slate-500 mt-0.5">{apt.reason}</p>
                                <Badge variant="secondary" className="mt-2 bg-slate-100 text-[8px] font-black uppercase tracking-widest py-0.5 px-2 rounded-md">
                                  {apt.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">MediCare+ Clinic</p>
                              <p className="text-[11px] font-bold text-slate-700 mt-1">Dr. {apt.doctor?.user?.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="records" className="outline-none focus-visible:ring-0">
                  <div className="space-y-8">
                    {detailsLoading ? (
                       <div className="py-20 text-center animate-pulse">
                         <div className="h-10 w-10 bg-slate-200 rounded-full mx-auto mb-4" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-300">Syncing Records...</p>
                       </div>
                    ) : medicalRecords.length === 0 ? (
                      <div className="py-20 text-center space-y-4 opacity-40">
                         <FileText className="h-12 w-12 mx-auto text-slate-300" />
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Verified Records</p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {medicalRecords.map((record) => (
                          <Card key={record._id} className="border-primary/5 bg-white/40 shadow-sm rounded-[2rem] overflow-hidden group/record hover:shadow-xl transition-all duration-500">
                            <CardHeader className="p-8 pb-4 border-b border-primary/5 bg-slate-50/50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg font-black text-slate-800 tracking-tight">{record.diagnosis}</CardTitle>
                                  <div className="flex items-center gap-3 mt-2">
                                     <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                                       Verified Data
                                     </Badge>
                                     <span className="text-[10px] font-bold text-slate-400">
                                       {new Date(record.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} • Dr. {record.doctor?.user?.name}
                                     </span>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => window.print()}
                                  className="h-10 px-4 rounded-xl bg-white shadow-sm font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                                >
                                  <FileDown className="h-3.5 w-3.5 mr-2 text-primary" />
                                  Download Report
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                              {record.medicines && record.medicines.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Active Prescription Protocol</p>
                                  <div className="grid grid-cols-1 gap-3">
                                    {record.medicines.map((med: any, i: number) => (
                                      <div key={i} className="p-4 bg-white/60 rounded-[1.25rem] border border-primary/5 flex items-center justify-between group/med hover:bg-white transition-all">
                                        <div className="flex items-center gap-4">
                                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                                            {i + 1}
                                          </div>
                                          <div>
                                            <p className="text-sm font-black text-slate-800">{med.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-tight">{med.dosage} — {med.duration}</p>
                                          </div>
                                        </div>
                                        {med.instructions && (
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight italic opacity-60">
                                            {med.instructions}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.attachments && record.attachments.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attached Diagnostics</p>
                                  <div className="flex flex-wrap gap-3">
                                    {record.attachments.map((file: any, i: number) => (
                                      <a
                                        key={i}
                                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${file.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 px-5 py-3 bg-slate-100/50 hover:bg-primary/5 hover:text-primary rounded-[1.25rem] transition-all duration-300 group/file"
                                      >
                                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover/file:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-widest">{file.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.notes && (
                                <div className="p-6 bg-slate-50/80 rounded-[1.5rem] border-l-4 border-primary/20">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Clinical Narrative</p>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{record.notes}"</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

