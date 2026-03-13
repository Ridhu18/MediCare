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
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="lg:hidden">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Appointments</h1>
              <p className="text-sm text-muted-foreground">
                Manage appointment requests
              </p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients, doctors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="today">
                Today
                <Badge variant="secondary" className="ml-2">
                  {filterAppointments("today").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {["today", "upcoming", "past", "all"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {filterAppointments(tab).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No appointments found
                    </CardContent>
                  </Card>
                ) : (
                  filterAppointments(tab).map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback>
                                {apt.patientName.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{apt.patientName}</h3>
                                <Badge
                                  variant="outline"
                                  className={cn("text-xs", statusConfig[apt.status].className)}
                                >
                                  {statusConfig[apt.status].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {apt.doctorName} • {apt.department}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {new Date(apt.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {apt.time}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {apt.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-success hover:bg-success/90 text-success-foreground"
                                  onClick={() => handleAction("confirmed", apt.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive bg-transparent"
                                  onClick={() => handleAction("rejected", apt.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAppointment(apt)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      {/* Appointment Details Dialog */}
      <Suspense fallback={<Loading />}>
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                View and manage appointment information
              </DialogDescription>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedAppointment.patientName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAppointment.patientName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Health ID: {selectedAppointment.healthId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedAppointment.patientPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedAppointment.patientEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p className="font-medium">{selectedAppointment.doctorName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedAppointment.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium">{selectedAppointment.time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm mb-1">Reason for Visit</p>
                  <p className="p-3 bg-muted rounded-lg text-sm">{selectedAppointment.reason}</p>
                </div>

                {selectedAppointment.status === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => handleAction("confirmed", selectedAppointment.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive bg-transparent"
                      onClick={() => handleAction("rejected", selectedAppointment.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  )
}

