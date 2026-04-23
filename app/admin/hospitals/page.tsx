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
                <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="lg:hidden">
                            <Button variant="ghost" size="icon" className="hover:bg-primary/5">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-800">Hospital Management</h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                                Manage registered hospitals
                            </p>
                        </div>
                    </div>
                </header>

                <div className="px-6 py-6 space-y-6">
                    <Card className="border-primary/5 bg-background/40 backdrop-blur-xl">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search hospitals..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white/50 border-primary/10 transition-colors hover:border-primary/30 focus-visible:ring-primary/20 h-10"
                                    />
                                </div>
                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2 h-10 px-6 font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={openAddDialog}>
                                            <Plus className="h-4 w-4" />
                                            Add Hospital
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl max-h-[90vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-2xl rounded-[2rem] shadow-2xl">
                                        <DialogHeader className="p-6 pb-4 bg-white/40 border-b border-primary/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                                                    <Hospital className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <DialogTitle className="text-xl font-black tracking-tight text-slate-800 text-left">
                                                        {editingHospital ? "Edit Hospital" : "Add New Hospital"}
                                                    </DialogTitle>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 text-left mt-0.5">
                                                        {editingHospital ? "Update facility details" : "Register a new medical facility"}
                                                    </p>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Name</Label>
                                                <Input
                                                    placeholder="Hospital Name"
                                                    value={newHospital.name}
                                                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                                                    className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Address</Label>
                                                <Input
                                                    placeholder="Full Address"
                                                    value={newHospital.address}
                                                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                                                    className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Phone</Label>
                                                    <Input
                                                        placeholder="+91..."
                                                        value={newHospital.phone}
                                                        onChange={(e) => setNewHospital({ ...newHospital, phone: e.target.value })}
                                                        className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Type</Label>
                                                    <Select
                                                        value={newHospital.type}
                                                        onValueChange={(val) => setNewHospital({ ...newHospital, type: val })}
                                                    >
                                                        <SelectTrigger className="h-11 bg-white/60 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-xs hover:border-primary/20 hover:bg-white/80 transition-colors">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                                                            <SelectItem value="Government" className="text-xs font-bold rounded-lg cursor-pointer">Government</SelectItem>
                                                            <SelectItem value="Private" className="text-xs font-bold rounded-lg cursor-pointer">Private</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Total Beds</Label>
                                                    <Input type="number"
                                                        value={newHospital.totalBeds}
                                                        onChange={(e) => setNewHospital({ ...newHospital, totalBeds: e.target.value })}
                                                        className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Available Beds</Label>
                                                    <Input type="number"
                                                        value={newHospital.availableBeds}
                                                        onChange={(e) => setNewHospital({ ...newHospital, availableBeds: e.target.value })}
                                                        className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Departments (comma separated)</Label>
                                                <Input
                                                    placeholder="Cardiology, Neurology..."
                                                    value={newHospital.departments}
                                                    onChange={(e) => setNewHospital({ ...newHospital, departments: e.target.value })}
                                                    className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Latitude</Label>
                                                        <Button
                                                            variant="link"
                                                            className="h-auto p-0 px-0.5 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
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
                                                        className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Longitude</Label>
                                                    <Input type="number" step="any"
                                                        value={newHospital.lng}
                                                        onChange={(e) => setNewHospital({ ...newHospital, lng: e.target.value })}
                                                        className="h-11 bg-white/60 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs transition-colors hover:border-primary/20 hover:bg-white/80"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 pt-4 bg-muted/20 border-t border-primary/5">
                                            <Button onClick={handleSaveHospital} className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                                                {editingHospital ? "Update Hospital" : "Create Hospital"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/5 bg-background/40 backdrop-blur-xl overflow-hidden">
                        <CardHeader className="border-b border-primary/5 bg-white/40 pb-4">
                            <CardTitle className="text-lg font-black text-slate-800 tracking-tight">Registered Hospitals ({filteredHospitals.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-primary/5">
                                        <TableRow className="border-primary/5 hover:bg-transparent">
                                            <TableHead className="font-bold text-slate-700 pl-4 w-[250px]">Hospital</TableHead>
                                            <TableHead className="font-bold text-slate-700 w-[120px]">Type</TableHead>
                                            <TableHead className="font-bold text-slate-700 w-[300px]">Location</TableHead>
                                            <TableHead className="font-bold text-slate-700 w-[120px]">Beds (Avail/Total)</TableHead>
                                            <TableHead className="font-bold text-slate-700">Contact</TableHead>
                                            <TableHead className="text-right font-bold text-slate-700 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                <TableBody>
                                    {filteredHospitals.map((h) => (
                                        <TableRow key={h.id} className="border-primary/5 hover:bg-white/40 group transition-colors">
                                            <TableCell className="pl-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/10 flex items-center justify-center text-primary font-bold font-mono">
                                                        {h.name ? h.name.slice(0, 2).toUpperCase() : "H"}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 tracking-tight truncate max-w-[180px]" title={h.name}>{h.name}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn(
                                                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0 border-0",
                                                        h.type === "Private" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                                                    )}
                                                >
                                                    {h.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 max-w-[280px]">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <span className="truncate" title={h.address}>{h.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 px-2 py-1 w-max rounded-md bg-indigo-500/10 text-indigo-600 font-bold text-xs">
                                                    <Bed className="h-3.5 w-3.5" />
                                                    {h.availableBeds} / {h.totalBeds}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    {h.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors" 
                                                        onClick={() => startEdit(h)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors" 
                                                        onClick={() => handleDeleteHospital(h.id)}
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
            </main >
        </div>
    )
}

