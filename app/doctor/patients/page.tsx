"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

const navItems = [
  { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/patients", icon: Users, label: "Patients" },
  { href: "/doctor/schedule", icon: Clock, label: "Schedule" },
  { href: "/doctor/profile", icon: User, label: "Profile" },
]

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

  useEffect(() => {
    if (selectedPatient) {
      const fetchPatientDetails = async () => {
        setDetailsLoading(true)
        try {
          const token = localStorage.getItem("token")

          // Fetch Appointment History
          const historyRes = await fetch(`http://localhost:5000/api/appointments/patient/${selectedPatient.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (historyRes.ok) {
            setPatientHistory(await historyRes.json())
          }

          // Fetch Medical Records
          const recordsRes = await fetch(`http://localhost:5000/api/medical-records/patient/${selectedPatient.id}`, {
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
        const res = await fetch("http://localhost:5000/api/appointments/doctor", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()

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
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                item.href === "/doctor/patients"
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
            <div className="flex items-center gap-4">
              <Link href="/doctor" className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Patients</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your patient records
                </p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Add New Patient</DialogTitle>
                <DialogHeader>
                  <p className="text-sm text-muted-foreground mt-2">
                    Patient registration form will go here
                  </p>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, condition, or Health ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patients List */}
          <div className="grid gap-4">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {patient.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{patient.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} years, {patient.gender} • Health ID: {patient.healthId}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusColor(patient.status)}
                        >
                          {patient.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Condition</p>
                          <p className="font-medium">{patient.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Visit</p>
                          <p className="font-medium">
                            {new Date(patient.lastVisit).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Visits</p>
                          <p className="font-medium">{patient.totalVisits}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{patient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        {patient.nextAppointment && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Next: {new Date(patient.nextAppointment).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = `tel:${patient.phone.replace(/\s/g, "")}`
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPatient(patient)
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Link href={`/doctor/appointments?patient=${patient.name}`}>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Appointment
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPatient && (
            <>
              <DialogHeader>
                <DialogTitle>Patient Details</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="records">Medical Records</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age & Gender</p>
                      <p className="font-medium">
                        {selectedPatient.age} years, {selectedPatient.gender}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedPatient.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Health ID</p>
                      <p className="font-medium">{selectedPatient.healthId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        variant="outline"
                        className={getStatusColor(selectedPatient.status)}
                      >
                        {selectedPatient.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Condition</p>
                    <p className="font-medium">{selectedPatient.condition}</p>
                  </div>
                </TabsContent>
                <TabsContent value="history">
                  <div className="space-y-4">
                    {detailsLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Loading history...</p>
                    ) : patientHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No previous appointments found.</p>
                    ) : (
                      <div className="space-y-3">
                        {patientHistory.map((apt) => (
                          <div key={apt._id} className="p-4 border rounded-lg flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{new Date(apt.date).toLocaleDateString()} • {apt.time}</p>
                              <p className="text-sm text-muted-foreground">{apt.reason}</p>
                              <Badge variant="outline" className="mt-1">
                                {apt.status}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{apt.hospital?.name || "Clinic"}</p>
                              <p className="text-xs text-muted-foreground">Dr. {apt.doctor?.user?.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="records">
                  <div className="space-y-4">
                    {detailsLoading ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Loading records...</p>
                    ) : medicalRecords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No medical records found.</p>
                    ) : (
                      <div className="space-y-4">
                        {medicalRecords.map((record) => (
                          <Card key={record._id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{record.diagnosis}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(record.date).toLocaleDateString()} • Dr. {record.doctor?.user?.name}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => window.print()}>
                                  <FileDown className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                              {record.medicines && record.medicines.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Prescription</p>
                                  <div className="grid grid-cols-1 gap-2">
                                    {record.medicines.map((med: any, i: number) => (
                                      <div key={i} className="text-sm p-2 bg-primary/5 rounded border border-primary/10">
                                        <span className="font-semibold">{med.name}</span> — {med.dosage} ({med.duration})
                                        {med.instructions && <p className="text-xs italic text-muted-foreground mt-1">{med.instructions}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.attachments && record.attachments.length > 0 && (
                                <div>
                                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Attachments</p>
                                  <div className="flex flex-wrap gap-2">
                                    {record.attachments.map((file: any, i: number) => (
                                      <a
                                        key={i}
                                        href={`http://localhost:5000${file.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-muted rounded-lg border hover:bg-muted/80 transition-colors"
                                      >
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-medium">{file.name}</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {record.notes && (
                                <div>
                                  <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Doctor Notes</p>
                                  <p className="text-sm text-muted-foreground">{record.notes}</p>
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

