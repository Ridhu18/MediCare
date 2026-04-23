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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  UserPlus
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// Match backend schema
interface Doctor {
  _id: string
  user: {
    _id: string
    name: string
    email: string
    phone: string
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
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleSaveDoctor = async () => {
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

      const url = editingDoctor 
        ? `http://localhost:5000/api/doctors/${editingDoctor._id}`
        : "http://localhost:5000/api/doctors";
      
      const method = editingDoctor ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsAddDialogOpen(false)
        setEditingDoctor(null)
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
        console.error("Failed to save doctor:", error)
        alert("Failed to save doctor: " + (error.message || "Unknown error"))
      }
    } catch (e) {
      console.error("Error saving doctor:", e)
      alert("Error saving doctor")
    }
  }

  const startEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setNewDoctor({
      name: doctor.user?.name || "",
      email: doctor.user?.email || "",
      phone: doctor.user?.phone || "",
      department: doctor.department || "",
      specialization: doctor.specialization || "",
      experience: doctor.experience?.toString() || "",
      hospitalIds: doctor.hospitals?.map(h => h._id) || []
    })
    setIsAddDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingDoctor(null)
    setNewDoctor({
      name: "",
      email: "",
      phone: "",
      department: "",
      specialization: "",
      experience: "",
      hospitalIds: []
    })
    setIsAddDialogOpen(true)
  }

  const handleDeleteDoctor = async (id: string) => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:5000/api/doctors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        setDoctors(doctors.filter((d) => d._id !== id))
        toast.success("Doctor deleted successfully")
      } else {
        const error = await res.json()
        toast.error("Failed to delete doctor: " + (error.message || "Unknown error"))
      }
    } catch (e) {
      console.error("Error deleting doctor:", e)
      toast.error("Error deleting doctor")
    } finally {
      setIsDeleting(false)
      setDoctorToDelete(null)
    }
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
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="lg:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Doctor Management</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5 dark:text-slate-400">
                Manage doctors and their availability
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-primary/5 bg-background/40 backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 transition-transform group-hover:scale-110">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stats.total}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 mt-0.5">Total Doctors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/5 bg-background/40 backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 transition-transform group-hover:scale-110">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stats.available}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-500 mt-0.5">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/5 bg-background/40 backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 transition-transform group-hover:scale-110">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stats.busy}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 dark:text-amber-500 mt-0.5">Busy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/5 bg-background/40 backdrop-blur-xl hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-500/10 transition-transform group-hover:scale-110">
                    <Bed className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{stats.offDuty}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500/70 dark:text-slate-400 mt-0.5">Off Duty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-primary/5 bg-background/40 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 border-primary/10 transition-colors hover:border-primary/30 focus-visible:ring-primary/20 h-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full md:w-48 bg-white/50 border-primary/10 h-10">
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
                  <SelectTrigger className="w-full md:w-40 bg-white/50 border-primary/10 h-10">
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
                    <Button className="gap-2 h-10 px-6 font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={openAddDialog}>
                      <Plus className="h-4 w-4" />
                      Add Doctor
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                    <DialogHeader className="p-6 pb-4 bg-white/40 border-b border-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                          <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                          <DialogTitle className="text-xl font-black tracking-tight text-slate-800 text-left">
                            {editingDoctor ? "Edit Doctor Profile" : "Add New Doctor"}
                          </DialogTitle>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 text-left mt-0.5">
                            {editingDoctor ? "Update specialist information" : "Register a new specialist"}
                          </p>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Full Name</Label>
                        <Input
                          placeholder="Dr. John Doe"
                          value={newDoctor.name}
                          onChange={(e) =>
                            setNewDoctor({ ...newDoctor, name: e.target.value })
                          }
                          className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Email</Label>
                          <Input
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={newDoctor.email}
                            onChange={(e) =>
                              setNewDoctor({ ...newDoctor, email: e.target.value })
                            }
                            className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Phone</Label>
                          <Input
                            placeholder="+91 98765 43210"
                            value={newDoctor.phone}
                            onChange={(e) =>
                              setNewDoctor({ ...newDoctor, phone: e.target.value })
                            }
                            className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Department</Label>
                        <Select
                          value={newDoctor.department}
                          onValueChange={(value) =>
                            setNewDoctor({ ...newDoctor, department: value })
                          }
                        >
                          <SelectTrigger className="h-11 bg-white/60 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-xs hover:border-primary/20 hover:bg-white/80 transition-colors">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept} className="text-xs font-bold rounded-lg cursor-pointer">
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-0.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hospitals</Label>
                          <p className="text-[9px] font-black uppercase text-primary/60">Select Multiple</p>
                        </div>
                        <div className="border border-primary/5 rounded-xl p-3 h-36 overflow-y-auto space-y-1.5 bg-white/40 hover:border-primary/20 transition-colors">
                          {hospitals.map(h => (
                            <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/60 transition-colors">
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
                                className="border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-md"
                              />
                              <Label htmlFor={`h-${h.id}`} className="cursor-pointer font-bold text-xs text-slate-700 flex-1">{h.name}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Specialization</Label>
                          <Input
                            placeholder="e.g., Cardiology"
                            value={newDoctor.specialization}
                            onChange={(e) =>
                              setNewDoctor({
                                ...newDoctor,
                                specialization: e.target.value,
                              })
                            }
                            className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Experience (years)</Label>
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
                            className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="p-6 pt-4 bg-muted/20 border-t border-primary/5">
                      <Button onClick={handleSaveDoctor} className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                        {editingDoctor ? "Save Changes" : "Register Doctor"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Table */}
          <Card className="border-primary/5 bg-background/40 backdrop-blur-xl overflow-hidden">
            <CardHeader className="border-b border-primary/5 bg-white/40 dark:bg-white/5 pb-4">
              <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Doctors Directory ({filteredDoctors.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-primary/5 dark:bg-primary/10">
                    <TableRow className="border-primary/5 hover:bg-transparent">
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Doctor</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Department</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Contact</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Experience</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Mobile Number</TableHead>
                      <TableHead className="font-bold text-slate-700 dark:text-slate-200">Status</TableHead>
                      <TableHead className="text-right font-bold text-slate-700 dark:text-slate-200 pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id} className="border-primary/5 hover:bg-white/40 group transition-colors">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10 dark:border-primary/30">
                              <AvatarFallback className="bg-primary/5 dark:bg-primary/10 text-primary font-bold font-mono">
                                {doctor.user?.name?.[0] || "D"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">{doctor.user?.name || "Unknown"}</p>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-400 mt-0.5">
                                {doctor.specialization}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0 border-primary/20 bg-primary/5 text-primary/80">
                            {doctor.department || "General"}
                          </Badge>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {doctor.hospitals?.map(h => (
                              <span key={h._id} className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
                                {h.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-32">
                              {doctor.user?.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 px-2 py-1 w-max rounded-md bg-amber-500/10 text-amber-600 font-bold text-xs">
                            <Clock className="h-3.5 w-3.5" />
                            {doctor.experience} yrs
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 px-2 py-1 w-max rounded-md bg-primary/5 text-primary font-bold text-xs">
                            <Phone className="h-3.5 w-3.5" />
                            {doctor.user?.phone || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0 border-0",
                              doctor.status === 'available' ? "bg-emerald-500/10 text-emerald-600" : 
                              doctor.status === 'busy' ? "bg-amber-500/10 text-amber-600" :
                              "bg-slate-100 text-slate-500"
                            )}
                          >
                            {doctor.status || 'available'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(doctor);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDoctorToDelete(doctor._id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!doctorToDelete} onOpenChange={(open) => !open && setDoctorToDelete(null)}>
          <AlertDialogContent className="border-none bg-background/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-black tracking-tight text-slate-800">Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-bold text-muted-foreground pt-2">
                This action is irreversible. This will permanently remove the doctor profile and their associated credentials from the clinical registry.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-6">
              <AlertDialogCancel className="rounded-xl border-primary/10 font-bold hover:bg-slate-100 transition-colors">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => doctorToDelete && handleDeleteDoctor(doctorToDelete)}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
              >
                {isDeleting ? "Processing..." : "Confirm Deletion"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
