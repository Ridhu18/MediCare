"use client"

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { AppNavigation } from "@/components/app-navigation"
import { AppointmentBooking } from "@/components/appointment-booking"
import { AppointmentsList } from "@/components/appointments-list"
import {
  Search,
  MapPin,
  Filter,
  Hospital,
  Star,
  Clock,
  Bed,
  Phone,
  Navigation,
  ChevronRight,
  Map,
  RefreshCw,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getCurrentLocation, DEFAULT_LOCATION } from "@/lib/geolocate"

// Dynamically import the map component to avoid SSR issues
const HospitalsMap = dynamic(() => import("@/components/hospitals-map").then(mod => ({ default: mod.HospitalsMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-lg border flex items-center justify-center bg-muted">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

// Removed static interface, using dynamic data
interface HospitalData {
  id: string
  name: string
  address: string
  distance: number // calculated from lat/lng
  phone: string
  rating: number
  availableBeds: number
  totalBeds: number
  emergencyOpen: boolean
  departments: string[]
  waitTime: string
  type: string
  lat: number
  lng: number
}

// Static data removed
const initialHospitals: HospitalData[] = []

const Loading = () => null

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<HospitalData[]>(initialHospitals)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("distance")
  const [filterType, setFilterType] = useState("all")
  const [showBooking, setShowBooking] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null)
  const [activeTab, setActiveTab] = useState("search")
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const { toast } = useToast()

  const requestLocation = async (silent = false) => {
    setIsLocating(true)
    const result = await getCurrentLocation()

    setUserLocation({ lat: result.lat, lng: result.lng })
    fetchHospitals(result.lat, result.lng)

    if (result.error) {
      console.error("Location error:", result.error.message, `(Code: ${result.error.code})`)
      if (!silent) {
        toast({
          title: "Location Access Error",
          description: `${result.error.message} Using default location (Bangalore). If you previously denied access, you may need to reset site permissions in your browser settings.`,
          variant: "destructive",
        })
      }
    } else if (!silent) {
      toast({
        title: "Location Updated",
        description: "Showing hospitals near your current location.",
      })
    }

    setIsLocating(false)
  }

  useEffect(() => {
    requestLocation(true) // Silent on mount
  }, [])

  const fetchHospitals = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/hospitals?lat=${lat}&lng=${lng}&radius=10000`)
      if (res.ok) {
        const data = await res.json()
        // Calculate distance client-side if needed or rely on backend to provide it
        // For now, assuming backend returns data as is, we might need to add 'distance' property manually if missing
        // or calculate it using Haversine formula if backend doesn't return sorted distance

        // Simple distance calculation for demo (if backend doesn't return it pre-calculated)
        const dataWithDistance = data.map((h: any) => ({
          ...h,
          id: h._id, // Map _id to id
          distance: calculateDistance(lat, lng, h.lat, h.lng)
        }))
        setHospitals(dataWithDistance)
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error)
    } finally {
      setLoading(false)
    }
  }

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return parseFloat(d.toFixed(1));
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  const filteredHospitals = hospitals
    .filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase()) ||
        h.departments.some((d) => d.toLowerCase().includes(search.toLowerCase()))
      const matchesType = filterType === "all" || h.type.toLowerCase() === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "beds":
          return b.availableBeds - a.availableBeds
        case "wait":
          return parseInt(a.waitTime) - parseInt(b.waitTime)
        default:
          return a.distance - b.distance
      }
    })

  const handleBook = (hospital: HospitalData) => {
    setSelectedHospital(hospital)
    setShowBooking(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <Toaster />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64 relative min-h-screen">
        {/* Subtle Decorative Gradients */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-2%] right-[-2%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-[10%] left-[-2%] w-[20%] h-[20%] bg-accent/5 rounded-full blur-[60px]" />
        </div>

        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Hospital className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-slate-800">Medical Network</h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">National Facility Discovery</p>
                  <div className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                  {userLocation ? (
                    <Badge variant="outline" className="bg-success/5 text-success border-success/10 text-[8px] h-3.5 py-0 px-1 rounded-md flex items-center gap-1 font-black uppercase tracking-tighter">
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/5 text-warning border-warning/10 text-[8px] h-3.5 py-0 px-1 rounded-md flex items-center gap-1 font-black uppercase tracking-tighter">
                      Default
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-4 w-4 rounded-md hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all p-0", isLocating && "animate-spin")}
                    onClick={() => requestLocation(false)} 
                    disabled={isLocating}
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-background/40 backdrop-blur-md border border-primary/5 p-1 rounded-xl h-auto self-start">
              <TabsTrigger value="search" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Find Hospital</TabsTrigger>
              <TabsTrigger value="map" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5">
                <Map className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Archives</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-4 outline-none">
              <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                    <MapPin className="h-4 w-4 text-primary" />
                    Nearby Hospitals on Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <HospitalsMap
                    hospitals={filteredHospitals.map(h => ({
                      ...h,
                      lat: h.lat,
                      lng: h.lng,
                    }))}
                    userLocation={userLocation || undefined}
                    onHospitalClick={(hospital) => {
                      const foundHospital = hospitals.find(h => h.id === hospital.id)
                      if (foundHospital) {
                        handleBook(foundHospital)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-4 outline-none">
              {/* Search and Filters */}
              <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Search hospitals, departments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10 bg-white/40 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-medium text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-36 h-10 bg-white/40 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                          <SelectItem value="distance" className="text-xs font-bold">Nearest</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full sm:w-36 h-10 bg-white/40 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-[10px] uppercase tracking-widest">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                          <SelectItem value="all" className="text-xs font-bold">All Types</SelectItem>
                          <SelectItem value="government" className="text-xs font-bold">Government</SelectItem>
                          <SelectItem value="private" className="text-xs font-bold">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Count */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                    Results: {filteredHospitals.length}
                  </p>
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {userLocation ? "Location Synchronized" : "Default Coverage"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-all h-7"
                  onClick={() => setActiveTab("map")}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  View on Map
                </Button>
              </div>

              <div className="grid md:grid-cols-1 gap-3">
                {filteredHospitals.map((hospital) => (
                  <Card key={hospital.id} className="group border-none shadow-lg shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border-primary/10 bg-primary/5 text-primary">
                                  {hospital.type}
                                </Badge>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-success/5 border border-success/10 rounded-md shadow-sm shadow-success/5">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                                  <span className="text-[9px] font-bold text-success uppercase tracking-tighter">Verified Center</span>
                                </div>
                              </div>
                              <h3 className="text-lg font-bold tracking-tight text-slate-800">{hospital.name}</h3>
                              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 opacity-60" />
                                {hospital.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-3 bg-muted/20 border border-primary/5 rounded-xl group-hover:bg-white/60 transition-all">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Navigation className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Proximity</p>
                                <span className="text-xs font-bold text-slate-700">
                                  {hospital.distance < 1 ? "Under 1 km away" : `${hospital.distance} km from you`}
                                </span>
                              </div>
                            </div>
                            <div className="h-8 w-px bg-primary/10 mx-1" />
                            <div className="flex-1">
                              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mb-1">Key Departments</p>
                              <div className="flex flex-wrap gap-1">
                                {hospital.departments.slice(0, 3).map((dept) => (
                                  <span key={dept} className="text-[9px] font-bold text-slate-600 bg-white/40 px-1.5 py-0.5 rounded border border-primary/5">
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-4 flex-wrap">
                            {hospital.departments.slice(3, 8).map((dept) => (
                              <Badge key={dept} variant="secondary" className="bg-white/40 group-hover:bg-muted/40 border-primary/5 text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors">
                                {dept}
                              </Badge>
                            ))}
                            {hospital.departments.length > 8 && (
                              <Badge variant="secondary" className="bg-white/40 group-hover:bg-muted/40 border-primary/5 text-[9px] font-bold px-2 py-0.5 rounded-md transition-colors">
                                +{hospital.departments.length - 8}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="lg:w-56 p-5 lg:bg-primary/[0.01] flex flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-primary/5 relative overflow-hidden">
                          <Button
                            variant="outline"
                            className="w-full bg-white/60 hover:bg-emerald-500 hover:text-white border-emerald-200 transition-all duration-300 rounded-lg h-9 text-xs font-bold hover:scale-[1.02] active:scale-95 shadow-sm group/call"
                            onClick={() => (window.location.href = `tel:${hospital.phone.replace(/\s/g, "")}`)}
                          >
                            <Phone className="h-3.5 w-3.5 mr-2 group-hover/call:scale-110 transition-transform" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full bg-white/60 hover:bg-primary hover:text-white border-primary/20 transition-all duration-300 rounded-lg h-9 text-xs font-bold hover:scale-[1.02] active:scale-95 shadow-sm"
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, "_blank")}
                          >
                            <Navigation className="h-3.5 w-3.5 mr-2" />
                            Directions
                          </Button>
                          <Button
                            className="w-full rounded-lg h-10 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/10 transition-all duration-300 mt-1 group/book hover:scale-[1.02] active:scale-95"
                            onClick={() => handleBook(hospital)}
                          >
                            Book Appointment
                            <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover/book:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appointments" className="outline-none">
              <AppointmentsList />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Dialog */}
      <Suspense fallback={<Loading />}>
        <Dialog open={showBooking} onOpenChange={setShowBooking}>
          <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden border-none bg-background/60 backdrop-blur-xl rounded-[2rem] shadow-2xl z-[1000]">
            <DialogTitle className="sr-only">Book Appointment</DialogTitle>
            <div className="p-1">
              <AppointmentBooking
                hospitalName={selectedHospital?.name}
                hospitalId={selectedHospital?.id}
                onClose={() => setShowBooking(false)}
                onSuccess={() => {
                  setShowBooking(false)
                  setSelectedHospital(null)
                  setActiveTab("appointments")
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  )
}
