"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
    Hospital,
    MapPin,
    Phone,
    Bed,
    LogOut,
    LayoutDashboard,
    Calendar,
    Users,
    AlertTriangle,
    MessageCircle,
    RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getCurrentLocation } from "@/lib/geolocate"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface HospitalData {
    id: string
    name: string
    address: string
    phone: string
    type: string
    totalBeds: number
    availableBeds: number
    lat: number
    lng: number
    departments: string[]
}

import { AdminSidebar } from "@/components/admin-sidebar"

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState<HospitalData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingHospital, setEditingHospital] = useState<HospitalData | null>(null) // New state for editing
    const [newHospital, setNewHospital] = useState({
        name: "",
        address: "",
        phone: "",
        type: "Private",
        totalBeds: "",
        availableBeds: "",
        lat: "",
        lng: "",
        departments: "",
    })
    const [isLocating, setIsLocating] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        fetchHospitals()
    }, [])

    const fetchHospitals = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch("http://localhost:5000/api/hospitals", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                let displayHospitals = data

                const userStr = localStorage.getItem("user")
                if (userStr) {
                    const user = JSON.parse(userStr)
                    if (user.role === 'admin') {
                        if (user.hospitalIds && user.hospitalIds.length > 0) {
                            displayHospitals = data.filter((h: any) => user.hospitalIds.includes(h._id))
                        } else {
                            displayHospitals = []
                        }
                    }
                }

                setHospitals(displayHospitals)
            }
        } catch (error) {
            console.error("Error fetching hospitals:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveHospital = async () => {
        try {
            const payload = {
                ...newHospital,
                totalBeds: parseInt(newHospital.totalBeds),
                availableBeds: parseInt(newHospital.availableBeds),
                departments: newHospital.departments.split(",").map(d => d.trim()),
                lat: parseFloat(newHospital.lat),
                lng: parseFloat(newHospital.lng)
            }

            const url = editingHospital
                ? `http://localhost:5000/api/hospitals/${editingHospital.id}`
                : "http://localhost:5000/api/hospitals";

            const method = editingHospital ? "PUT" : "POST";

            const token = localStorage.getItem("token")
            const res = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                if (method === "POST") {
                    const meRes = await fetch("http://localhost:5000/api/auth/me", {
                        headers: { "Authorization": `Bearer ${token}` }
                    })
                    if (meRes.ok) {
                        const updatedUser = await meRes.json()
                        localStorage.setItem("user", JSON.stringify(updatedUser))
                    }
                }

                setIsAddDialogOpen(false)
                setEditingHospital(null) // Reset edit state
                fetchHospitals()
                setNewHospital({
                    name: "", address: "", phone: "", type: "Private",
                    totalBeds: "", availableBeds: "", lat: "", lng: "", departments: ""
                })
            }
        } catch (error) {
            console.error("Error saving hospital:", error)
        }
    }

    const handleDeleteHospital = async (id: string) => {
        if (!confirm("Are you sure you want to delete this hospital?")) return;
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`http://localhost:5000/api/hospitals/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.ok) {
                fetchHospitals()
            }
        } catch (error) {
            console.error("Error deleting hospital:", error)
        }
    }

    const startEdit = (hospital: HospitalData) => {
        setEditingHospital(hospital);
        setNewHospital({
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone,
            type: hospital.type,
            totalBeds: hospital.totalBeds.toString(),
            availableBeds: hospital.availableBeds.toString(),
            lat: hospital.lat.toString(),
            lng: hospital.lng.toString(),
            departments: hospital.departments.join(", "),
        });
        setIsAddDialogOpen(true);
    }

    const openAddDialog = () => {
        setEditingHospital(null);
        setNewHospital({
            name: "", address: "", phone: "", type: "Private",
            totalBeds: "", availableBeds: "", lat: "", lng: "", departments: ""
        });
        setIsAddDialogOpen(true);
    }

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.address.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAutoDetect = async () => {
        setIsLocating(true)
        const result = await getCurrentLocation()

        if (result.error) {
            toast({
                title: "Auto-detect Failed",
                description: result.error.message,
                variant: "destructive",
            })
        } else {
            setNewHospital(prev => ({
                ...prev,
                lat: result.lat.toString(),
                lng: result.lng.toString()
            }))
            toast({
                title: "Location Detected",
                description: `Lat: ${result.lat.toFixed(4)}, Lng: ${result.lng.toFixed(4)}`,
            })
        }
        setIsLocating(false)
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            <Toaster />
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
                            <h1 className="text-lg font-semibold">Hospital Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage registered hospitals
                            </p>
                        </div>
                    </div>
                </header>

                <div className="px-6 py-6 space-y-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search hospitals..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2" onClick={openAddDialog}>
                                            <Plus className="h-4 w-4" />
                                            Add Hospital
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>{editingHospital ? "Edit Hospital" : "Add New Hospital"}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input
                                                    placeholder="Hospital Name"
                                                    value={newHospital.name}
                                                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Address</Label>
                                                <Input
                                                    placeholder="Full Address"
                                                    value={newHospital.address}
                                                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Phone</Label>
                                                    <Input
                                                        placeholder="+91..."
                                                        value={newHospital.phone}
                                                        onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Type</Label>
                                                    <Select
                                                        value={newHospital.type}
                                                        onValueChange={(val) => setNewHospital({ ...newHospital, type: val })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Government">Government</SelectItem>
                                                            <SelectItem value="Private">Private</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Total Beds</Label>
                                                    <Input type="number"
                                                        value={newHospital.totalBeds}
                                                        onChange={(e) => setNewHospital({ ...newHospital, totalBeds: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Available Beds</Label>
                                                    <Input type="number"
                                                        value={newHospital.availableBeds}
                                                        onChange={(e) => setNewHospital({ ...newHospital, availableBeds: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Departments (comma separated)</Label>
                                                <Input
                                                    placeholder="Cardiology, Neurology..."
                                                    value={newHospital.departments}
                                                    onChange={(e) => setNewHospital({ ...newHospital, departments: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>Latitude</Label>
                                                        <Button
                                                            variant="link"
                                                            className="h-auto p-0 text-primary text-xs flex items-center gap-1"
                                                            onClick={handleAutoDetect}
                                                            disabled={isLocating}
                                                        >
                                                            <RefreshCw className={cn("h-3 w-3", isLocating && "animate-spin")} />
                                                            Auto Detect
                                                        </Button>
                                                    </div>
                                                    <Input type="number" step="any"
                                                        value={newHospital.lat}
                                                        onChange={(e) => setNewHospital({ ...newHospital, lat: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Longitude</Label>
                                                    <Input type="number" step="any"
                                                        value={newHospital.lng}
                                                        onChange={(e) => setNewHospital({ ...newHospital, lng: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <Button onClick={handleSaveHospital} className="w-full">
                                                {editingHospital ? "Update Hospital" : "Create Hospital"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Registered Hospitals ({filteredHospitals.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Start</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Beds</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHospitals.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {h.name[0]}
                                                    </div>
                                                    {h.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{h.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground w-48 truncate">
                                                    <MapPin className="h-3 w-3" />
                                                    {h.address}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Bed className="h-3 w-3 text-muted-foreground" />
                                                    {h.availableBeds}/{h.totalBeds}
                                                </div>
                                            </TableCell>
                                            <TableCell>{h.phone}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(h)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteHospital(h.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main >
        </div>
    )
}

