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
      const res = await fetch(`http://localhost:5000/api/hospitals?lat=${lat}&lng=${lng}&radius=10000`)
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

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Hospital className="h-6 w-6 text-primary" />
                Hospitals
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">Find and book appointments</p>
                {userLocation ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] h-5 py-0 px-1.5 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    Live Location
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] h-5 py-0 px-1.5 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    Default (Bangalore)
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-6 w-6 rounded-full hover:bg-muted", isLocating && "animate-spin")}
                  onClick={() => requestLocation(false)} // Explicit on click
                  disabled={isLocating}
                  title="Refresh Location"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="search">Find Hospital</TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="appointments">My Appointments</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Nearby Hospitals on Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <HospitalsMap
                    hospitals={filteredHospitals.map(h => ({
                      ...h,
                      lat: h.lat,
                      lng: h.lng,
                    }))}
                    userLocation={userLocation || undefined}
                    onHospitalClick={(hospital) => {
                      // Use type assertion since Map component might expect slightly different type or we match by ID
                      const foundHospital = hospitals.find(h => h.id === hospital.id)
                      if (foundHospital) {
                        handleBook(foundHospital)
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search hospitals, departments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="distance">Nearest</SelectItem>
                        <SelectItem value="rating">Top Rated</SelectItem>
                        <SelectItem value="beds">Most Beds</SelectItem>
                        <SelectItem value="wait">Shortest Wait</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Results Count */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  {filteredHospitals.length} hospitals found
                  {userLocation && <span className="text-xs ml-2">near your location</span>}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setActiveTab("map")}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  View on Map
                </Button>
              </div>

              {/* Hospital List */}
              <div className="space-y-4">
                {filteredHospitals.map((hospital) => (
                  <Card key={hospital.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold">{hospital.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {hospital.type}
                                </Badge>
                                {hospital.emergencyOpen && (
                                  <Badge className="bg-success/20 text-success border-success text-xs">
                                    24/7 Emergency
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {hospital.address}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Navigation className="h-4 w-4 text-primary" />
                              <span className="font-medium">{hospital.distance} km</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-warning fill-warning" />
                              <span className="font-medium">{hospital.rating}</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>~{hospital.waitTime}</span>
                            </span>
                            <span
                              className={cn(
                                "flex items-center gap-1.5",
                                hospital.availableBeds > 10
                                  ? "text-success"
                                  : hospital.availableBeds > 5
                                    ? "text-warning-foreground"
                                    : "text-emergency"
                              )}
                            >
                              <Bed className="h-4 w-4" />
                              <span className="font-medium">
                                {hospital.availableBeds}/{hospital.totalBeds} beds
                              </span>
                            </span>
                          </div>

                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {hospital.departments.slice(0, 4).map((dept) => (
                              <Badge key={dept} variant="secondary" className="text-xs">
                                {dept}
                              </Badge>
                            ))}
                            {hospital.departments.length > 4 && (
                              <Badge variant="secondary" className="text-xs">
                                +{hospital.departments.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex lg:flex-col gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 lg:flex-none bg-transparent hover:bg-success hover:text-success-foreground border-success/50 transition-colors"
                            onClick={() =>
                              (window.location.href = `tel:${hospital.phone.replace(/\s/g, "")}`)
                            }
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 lg:flex-none bg-transparent hover:bg-primary hover:text-primary-foreground border-primary/50 transition-colors"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`,
                                "_blank"
                              )
                            }
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Directions
                          </Button>
                          <Button
                            className="flex-1 lg:flex-none"
                            onClick={() => handleBook(hospital)}
                          >
                            Book Appointment
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              <AppointmentsList />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Dialog */}
      <Suspense fallback={<Loading />}>
        <Dialog open={showBooking} onOpenChange={setShowBooking}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Book Appointment</DialogTitle>
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
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  )
}
