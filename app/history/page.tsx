"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
}

const emergencyHistory: EmergencyRecord[] = [
  {
    id: "E001",
    date: "2026-01-15",
    time: "14:30",
    type: "Cardiac Emergency",
    location: "MG Road, Bangalore",
    hospital: "Apollo Hospital",
    ambulanceTime: "8 min",
    status: "completed",
  },
  {
    id: "E002",
    date: "2025-12-20",
    time: "09:15",
    type: "Accident",
    location: "Koramangala",
    hospital: "Fortis Hospital",
    ambulanceTime: "12 min",
    status: "completed",
  },
  {
    id: "E003",
    date: "2025-11-05",
    time: "22:45",
    type: "General Emergency",
    location: "Indiranagar",
    hospital: "Manipal Hospital",
    ambulanceTime: "6 min",
    status: "completed",
  },
]

const appointmentHistory: AppointmentRecord[] = [
  {
    id: "A001",
    date: "2026-01-18",
    time: "10:00",
    hospital: "Apollo Hospital",
    department: "Cardiology",
    doctor: "Dr. Rajesh Kumar",
    status: "completed",
    notes: "Regular checkup, all reports normal",
  },
  {
    id: "A002",
    date: "2026-01-10",
    time: "15:30",
    hospital: "Fortis Hospital",
    department: "Orthopedics",
    doctor: "Dr. Amit Patel",
    status: "completed",
    notes: "Follow-up for knee pain",
  },
  {
    id: "A003",
    date: "2025-12-28",
    time: "11:00",
    hospital: "Manipal Hospital",
    department: "General Medicine",
    doctor: "Dr. Priya Sharma",
    status: "cancelled",
  },
  {
    id: "A004",
    date: "2025-12-15",
    time: "09:30",
    hospital: "Apollo Hospital",
    department: "Neurology",
    doctor: "Dr. Sneha Reddy",
    status: "no-show",
  },
  {
    id: "A005",
    date: "2025-11-20",
    time: "14:00",
    hospital: "Narayana Health",
    department: "Dermatology",
    doctor: "Dr. Vikram Singh",
    status: "completed",
    notes: "Skin allergy treatment prescribed",
  },
]

export default function HistoryPage() {
  const [filterPeriod, setFilterPeriod] = useState("all")
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/medical-records/my", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMedicalRecords(data)
      }
    } catch (error) {
      console.error("Error fetching medical records", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
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
    <div className="min-h-screen bg-background pb-20">
      <main className="md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">History & Reports</h1>
                <p className="text-sm text-muted-foreground">
                  View your emergency and appointment history
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{emergencyHistory.length}</p>
                    <p className="text-sm text-muted-foreground">Emergencies</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {appointmentHistory.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Appointments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        appointmentHistory.filter((a) => a.status === "completed")
                          .length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-sm text-muted-foreground">
                      Hospitals Visited
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="flex justify-end">
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* History Tabs */}
          <Tabs defaultValue="appointments">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="emergencies" className="gap-2">
                <Ambulance className="h-4 w-4" />
                Emergencies
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2">
                <Calendar className="h-4 w-4" />
                Appointments
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Medical Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="emergencies" className="space-y-4 mt-4">
              {emergencyHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-red-500/10">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{record.type}</h3>
                            {getStatusBadge(record.status)}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {record.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {record.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 text-primary" />
                              {record.hospital}
                            </span>
                            <span className="flex items-center gap-1">
                              <Ambulance className="h-3 w-3 text-primary" />
                              Response: {record.ambulanceTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <FileText className="h-4 w-4" />
                        View Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="appointments" className="space-y-4 mt-4">
              {appointmentHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{record.department}</h3>
                            {getStatusBadge(record.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {record.doctor} at {record.hospital}
                          </p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(record.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {record.time}
                            </span>
                          </div>
                          {record.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded">
                              Notes: {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <FileText className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="reports" className="space-y-4 mt-4">
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Loading reports...</p>
              ) : medicalRecords.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No medical reports found.</p>
              ) : (
                medicalRecords.map((record) => (
                  <Card key={record._id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-emerald-500/10">
                            <FileText className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{record.diagnosis}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Dr. {record.doctor?.user?.name || "Doctor"} • {formatDate(record.date)}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {record.medicines.slice(0, 2).map((m, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">
                                  {m.name}
                                </Badge>
                              ))}
                              {record.medicines.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{record.medicines.length - 2} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-transparent"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <FileText className="h-4 w-4" />
                          View Report
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
      {/* View Report Dialog */}
      <Dialog
        open={selectedRecord !== null}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl font-bold">Medical Report</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Date: {selectedRecord && formatDate(selectedRecord.date)}
          </p>

          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-primary mb-2">Diagnosis</h3>
              <p className="text-sm border p-3 rounded-lg bg-muted/30">
                {selectedRecord?.diagnosis}
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-primary mb-2">Prescription</h3>
              <div className="space-y-2">
                {selectedRecord?.medicines.map((med, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.instructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{med.dosage}</p>
                      <p className="text-xs text-muted-foreground">{med.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {selectedRecord?.allergies && selectedRecord.allergies.length > 0 && (
              <section>
                <h3 className="font-semibold text-primary mb-2">Known Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.allergies.map((a, i) => (
                    <Badge key={i} variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">
                      {a}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {selectedRecord?.notes && (
              <section>
                <h3 className="font-semibold text-primary mb-2">Doctor's Notes</h3>
                <p className="text-sm p-3 bg-muted rounded-lg border italic">
                  "{selectedRecord.notes}"
                </p>
              </section>
            )}

            {selectedRecord?.attachments && selectedRecord.attachments.length > 0 && (
              <section>
                <h3 className="font-semibold text-primary mb-2">Attachments</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.attachments.map((file, i) => (
                    <a
                      key={i}
                      href={`http://localhost:5000${file.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-muted rounded-lg border hover:bg-muted/80 transition-colors"
                    >
                      <Paperclip className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium">{file.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="flex justify-between items-center pt-6 border-t font-medium text-sm">
              <p>Doctor: Dr. {selectedRecord?.doctor?.user?.name}</p>
              <Button
                className="gap-2"
                onClick={() => window.print()}
              >
                <Download className="h-4 w-4" />
                Download / Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
