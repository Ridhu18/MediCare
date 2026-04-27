"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Phone,
  MapPin,
  Clock,
  Ambulance,
  Heart,
  Brain,
  Car,
  Flame,
  User,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  Calendar,
  Bed,
  MessageCircle,
  Hospital,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmergencyCase {
  id: string
  patientName: string
  phone: string
  emergencyType: "cardiac" | "accident" | "stroke" | "burn" | "other"
  priority: "critical" | "high" | "medium"
  location: string
  distance: string
  time: string
  status: "incoming" | "assigned" | "en-route" | "arrived" | "completed"
  ambulanceId?: string
  eta?: string
}

const initialCases: EmergencyCase[] = [
  {
    id: "1",
    patientName: "Rahul Verma",
    phone: "+91 98765 43210",
    emergencyType: "cardiac",
    priority: "critical",
    location: "MG Road, Bangalore",
    distance: "3.2 km",
    time: "2 min ago",
    status: "incoming",
  },
  {
    id: "2",
    patientName: "Meera Joshi",
    phone: "+91 98765 43211",
    emergencyType: "accident",
    priority: "high",
    location: "Koramangala 4th Block",
    distance: "5.1 km",
    time: "5 min ago",
    status: "assigned",
    ambulanceId: "AMB-001",
    eta: "8 min",
  },
  {
    id: "3",
    patientName: "Suresh Kumar",
    phone: "+91 98765 43212",
    emergencyType: "stroke",
    priority: "critical",
    location: "Indiranagar",
    distance: "4.5 km",
    time: "8 min ago",
    status: "en-route",
    ambulanceId: "AMB-002",
    eta: "3 min",
  },
  {
    id: "4",
    patientName: "Anjali Reddy",
    phone: "+91 98765 43213",
    emergencyType: "burn",
    priority: "medium",
    location: "HSR Layout",
    distance: "7.2 km",
    time: "12 min ago",
    status: "arrived",
    ambulanceId: "AMB-003",
  },
]

interface Ambulance {
  _id: string
  ambulanceId: string
  vehicleNumber: string
  driver: string
  status: "available" | "dispatched" | "returning"
  currentLocation?: string
}

import { AdminSidebar } from "@/components/admin-sidebar"

export default function EmergencyDashboard() {
  const [cases, setCases] = useState<EmergencyCase[]>([])
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [currentTime, setCurrentTime] = useState(new Date())

  const fetchCases = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies`)
      if (res.ok) {
        const data = await res.json()
        setCases(data)
      }
    } catch (error) {
      console.error("Error fetching emergency cases:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAmbulances = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/ambulances`)
      if (res.ok) {
        const data = await res.json()
        setAmbulances(data)
      }
    } catch (error) {
      console.error("Error fetching ambulances:", error)
    }
  }

  useEffect(() => {
    fetchCases()
    fetchAmbulances()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const pollInterval = setInterval(() => {
      fetchCases()
      fetchAmbulances()
    }, 10000) // Poll for new cases and fleet updates
    return () => {
      clearInterval(timer)
      clearInterval(pollInterval)
    }
  }, [])

  const filteredCases = cases.filter((c) => {
    const matchesPriority =
      filterPriority === "all" || c.priority === filterPriority
    const matchesStatus = filterStatus === "all" || c.status === filterStatus
    return matchesPriority && matchesStatus
  })

  const getEmergencyIcon = (type: EmergencyCase["emergencyType"]) => {
    switch (type) {
      case "cardiac":
        return <Heart className="h-4 w-4" />
      case "accident":
        return <Car className="h-4 w-4" />
      case "stroke":
        return <Brain className="h-4 w-4" />
      case "burn":
        return <Flame className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: EmergencyCase["priority"]) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-amber-500 text-white"
      case "medium":
        return "bg-blue-500 text-white"
    }
  }

  const getStatusColor = (status: EmergencyCase["status"]) => {
    switch (status) {
      case "incoming":
        return "bg-red-500/10 text-red-600 border-red-200"
      case "assigned":
        return "bg-amber-500/10 text-amber-600 border-amber-200"
      case "en-route":
        return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "arrived":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      case "completed":
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const handleAssignAmbulance = async (caseId: string, ambId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "assigned", ambulanceId: ambId, eta: "10 min" }),
      })
      if (res.ok) {
        // Also update ambulance status
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/ambulances/${ambId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "dispatched" }),
        })
        fetchCases()
        fetchAmbulances()
      }
    } catch (error) {
      console.error("Error assigning ambulance:", error)
    }
  }

  const handleUpdateStatus = async (
    caseId: string,
    status: EmergencyCase["status"],
    ambId?: string
  ) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        if (status === "completed" && ambId) {
          // Free up the ambulance
          await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/ambulances/${ambId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "available", currentLocation: "Returning to base" }),
          })
          fetchAmbulances()
        }
        fetchCases()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const availableAmbulances = ambulances.filter(
    (a) => a.status === "available"
  )

  const stats = {
    total: cases.length,
    critical: cases.filter((c) => c.priority === "critical").length,
    incoming: cases.filter((c) => c.status === "incoming").length,
    active: cases.filter(
      (c) => c.status !== "completed" && c.status !== "incoming"
    ).length,
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  Emergency Priority Dashboard
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time emergency case management
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-mono font-bold">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString()}
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Cases</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.critical}</p>
                    <p className="text-sm text-muted-foreground">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.incoming}</p>
                    <p className="text-sm text-muted-foreground">
                      Pending Assignment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Ambulance className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {availableAmbulances.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ambulances Ready
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Emergency Cases */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Active Emergency Cases</h2>
                <div className="flex gap-2">
                  <Select
                    value={filterPriority}
                    onValueChange={setFilterPriority}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="en-route">En Route</SelectItem>
                      <SelectItem value="arrived">Arrived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredCases.map((emergencyCase) => (
                  <Card
                    key={emergencyCase.id}
                    className={`transition-all ${emergencyCase.priority === "critical"
                      ? "border-red-200 bg-red-50/50 dark:bg-red-950/20"
                      : ""
                      }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-lg ${getPriorityColor(emergencyCase.priority)}`}
                          >
                            {getEmergencyIcon(emergencyCase.emergencyType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold">
                                {emergencyCase.patientName}
                              </h3>
                              <Badge className={getPriorityColor(emergencyCase.priority)}>
                                {emergencyCase.priority.toUpperCase()}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={getStatusColor(emergencyCase.status)}
                              >
                                {emergencyCase.status.replace("-", " ")}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize mt-1">
                              {emergencyCase.emergencyType} Emergency
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {emergencyCase.location} ({emergencyCase.distance})
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {emergencyCase.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {emergencyCase.time}
                              </span>
                            </div>
                            {emergencyCase.ambulanceId && (
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <Ambulance className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {emergencyCase.ambulanceId}
                                </span>
                                {emergencyCase.eta && (
                                  <Badge variant="secondary">
                                    ETA: {emergencyCase.eta}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {emergencyCase.status === "incoming" && (
                            <Select
                              onValueChange={(value) =>
                                handleAssignAmbulance(emergencyCase.id, value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Assign Ambulance" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableAmbulances.map((amb) => (
                                  <SelectItem key={amb._id} value={amb.ambulanceId}>
                                    {amb.ambulanceId} - {amb.driver}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {emergencyCase.status === "assigned" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(emergencyCase.id, "en-route")
                              }
                            >
                              Mark En Route
                            </Button>
                          )}
                          {emergencyCase.status === "en-route" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(emergencyCase.id, "arrived")
                              }
                            >
                              Mark Arrived
                            </Button>
                          )}
                          {emergencyCase.status === "arrived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 bg-transparent"
                              onClick={() =>
                                handleUpdateStatus(emergencyCase.id, "completed", emergencyCase.ambulanceId)
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Ambulance Fleet */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Ambulance Fleet</h2>
              <div className="space-y-3">
                {ambulances.map((ambulance) => (
                  <Card key={ambulance._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          className={`${ambulance.status === "available"
                            ? "bg-emerald-100"
                            : ambulance.status === "dispatched"
                              ? "bg-red-100"
                              : "bg-amber-100"
                            }`}
                        >
                          <AvatarFallback>
                            <Ambulance
                              className={`h-5 w-5 ${ambulance.status === "available"
                                ? "text-emerald-600"
                                : ambulance.status === "dispatched"
                                  ? "text-red-600"
                                  : "text-amber-600"
                                }`}
                            />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{ambulance.ambulanceId}</p>
                            <Badge
                              variant="outline"
                              className={
                                ambulance.status === "available"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                  : ambulance.status === "dispatched"
                                    ? "bg-red-500/10 text-red-600 border-red-200"
                                    : "bg-amber-500/10 text-amber-600 border-amber-200"
                              }
                            >
                              {ambulance.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ambulance.vehicleNumber}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-sm">
                            <User className="h-3 w-3" />
                            {ambulance.driver}
                          </div>
                          {ambulance.currentLocation && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {ambulance.currentLocation}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
