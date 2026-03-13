"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  Clock,
  Stethoscope,
  LayoutDashboard,
  Calendar,
  Bed,
  AlertTriangle,
  MessageCircle,
  Hospital,
  LogOut,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"

// Match backend schema
interface Doctor {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    profileImage: string
  }
  hospitals: { _id: string, name: string }[]
  department: string
  specialization: string
  experience: number
  status: "available" | "busy" | "off-duty"
  patients: number
  rating: number
  phone?: string
}

// Removed static initialDoctors
const initialDoctors: Doctor[] = []

const departments = [
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Emergency",
  "Pediatrics",
  "General Medicine",
  "Surgery",
  "Dermatology",
]

import { AdminSidebar } from "@/components/admin-sidebar"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    specialization: "",
    experience: "",
    hospitalIds: [] as string[],
  })

  const [hospitals, setHospitals] = useState<any[]>([])
  const [adminHospitalIds, setAdminHospitalIds] = useState<string[]>([])

  useEffect(() => {
    fetchAdminAndData()
  }, [])

  const fetchAdminAndData = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch admin profile
      const userRes = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })

      let ids: string[] = []
      if (userRes.ok) {
        const userData = await userRes.json()
        ids = userData.hospitalIds || []
        setAdminHospitalIds(ids)
      }

      // Fetch all hospitals and filter
      const hospRes = await fetch("http://localhost:5000/api/hospitals")
      if (hospRes.ok) {
        let hospData = await hospRes.json()
        // Filter out only hospitals assigned to this admin
        if (ids.length > 0) {
          hospData = hospData.filter((h: any) => ids.includes(h.id))
        }
        setHospitals(hospData)
      }

      // Fetch all doctors and filter
      const docsRes = await fetch("http://localhost:5000/api/doctors")
      if (docsRes.ok) {
        let docsData = await docsRes.json()
        if (ids.length > 0) {
          docsData = docsData.filter((d: any) =>
            d.hospitals?.some((h: any) => ids.includes(h._id))
          )
        }
        setDoctors(docsData)
      }
    } catch (e) {
      console.error("Error fetching data:", e)
    }
  }



  const filteredDoctors = doctors.filter((doctor) => {
    // Handle potentially nested or missing fields safely
    const name = doctor.user?.name || "Unknown"
    const dept = doctor.department || "General" // Or specialization

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDepartment =
      filterDepartment === "all" || dept === filterDepartment
    const matchesStatus =
      filterStatus === "all" || doctor.status === filterStatus

    return matchesSearch && matchesDepartment && matchesStatus
  })

  const handleAddDoctor = async () => {
    try {
      const payload = {
        name: newDoctor.name,
        email: newDoctor.email,
        phone: newDoctor.phone,
        department: newDoctor.department,
        specialization: newDoctor.specialization,
        experience: newDoctor.experience,
        hospitalIds: newDoctor.hospitalIds,
        consultationFee: 500,
      }

      const res = await fetch("http://localhost:5000/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsAddDialogOpen(false)
        setNewDoctor({
          name: "",
          email: "",
          phone: "",
          department: "",
          specialization: "",
          experience: "",
          hospitalIds: []
        })
        fetchAdminAndData()
      } else {
        const error = await res.json()
        console.error("Failed to add doctor:", error)
        alert("Failed to add doctor: " + (error.message || "Unknown error"))
      }
    } catch (e) {
      console.error("Error adding doctor:", e)
      alert("Error adding doctor")
    }
  }

  const handleDeleteDoctor = (id: string) => {
    setDoctors(doctors.filter((d) => d._id !== id))
  }

  const handleStatusChange = (id: string, status: Doctor["status"]) => {
    setDoctors(
      doctors.map((d) => (d._id === id ? { ...d, status } : d))
    )
  }

  const getStatusColor = (status: Doctor["status"]) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      case "busy":
        return "bg-amber-500/10 text-amber-600 border-amber-200"
      case "off-duty":
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const stats = {
    total: doctors.length,
    available: doctors.filter((d) => d.status === "available").length,
    busy: doctors.filter((d) => d.status === "busy").length,
    offDuty: doctors.filter((d) => d.status === "off-duty").length,
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
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Doctor Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage doctors and their availability
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Doctors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.available}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.busy}</p>
                    <p className="text-sm text-muted-foreground">Busy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.offDuty}</p>
                    <p className="text-sm text-muted-foreground">Off Duty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="off-duty">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Doctor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          placeholder="Dr. John Doe"
                          value={newDoctor.name}
                          onChange={(e) =>
                            setNewDoctor({ ...newDoctor, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={newDoctor.email}
                            onChange={(e) =>
                              setNewDoctor({ ...newDoctor, email: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={newDoctor.phone}
                            onChange={(e) =>
                              setNewDoctor({ ...newDoctor, phone: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                          value={newDoctor.department}
                          onValueChange={(value) =>
                            setNewDoctor({ ...newDoctor, department: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Hospitals (Select multiple)</Label>
                        <div className="border rounded-md p-3 h-32 overflow-y-auto space-y-2 bg-muted/5">
                          {hospitals.map(h => (
                            <div key={h.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`h-${h.id}`}
                                checked={newDoctor.hospitalIds.includes(h.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewDoctor({ ...newDoctor, hospitalIds: [...newDoctor.hospitalIds, h.id] })
                                  } else {
                                    setNewDoctor({ ...newDoctor, hospitalIds: newDoctor.hospitalIds.filter(id => id !== h.id) })
                                  }
                                }}
                              />
                              <Label htmlFor={`h-${h.id}`} className="cursor-pointer font-normal">{h.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Specialization</Label>
                          <Input
                            placeholder="e.g., Cardiology"
                            value={newDoctor.specialization}
                            onChange={(e) =>
                              setNewDoctor({
                                ...newDoctor,
                                specialization: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Experience (years)</Label>
                          <Input
                            type="number"
                            placeholder="10"
                            value={newDoctor.experience}
                            onChange={(e) =>
                              setNewDoctor({
                                ...newDoctor,
                                experience: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddDoctor} className="w-full">
                        Add Doctor
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Doctors ({filteredDoctors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Patients</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {doctor.user?.name?.[0] || "D"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{doctor.user?.name || "Unknown"}</p>
                              <p className="text-sm text-muted-foreground">
                                {doctor.specialization}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doctor.department || "General"}</Badge>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {doctor.hospitals?.map(h => (
                              <span key={h._id} className="text-[10px] bg-primary/10 text-primary px-1 rounded">
                                {h.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-32">
                                {doctor.user?.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.experience} years</TableCell>
                        <TableCell>{doctor.patients || 0}</TableCell>
                        <TableCell>
                          <Badge variant={doctor.status === 'available' ? "default" : "secondary"}>
                            {doctor.status || 'available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
