"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import {
  MapPin,
  Phone,
  Clock,
  Bed,
  Navigation,
  Star,
  ChevronRight,
  Map,
  Hospital,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { getCurrentLocation } from "@/lib/geolocate"

// Dynamically import the map component to avoid SSR issues
const HospitalsMap = dynamic(() => import("@/components/hospitals-map").then(mod => ({ default: mod.HospitalsMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-lg border flex items-center justify-center bg-muted">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
})

export interface Hospital {
  id: string
  name: string
  address: string
  distance: number
  phone: string
  rating: number
  availableBeds: number
  totalBeds: number
  emergencyOpen: boolean
  departments: string[]
  waitTime: string
  lat: number
  lng: number
}

const mockHospitals: Hospital[] = []

interface NearbyHospitalsProps {
  onBookAppointment?: (hospital: Hospital) => void
}

export function NearbyHospitals({ onBookAppointment }: NearbyHospitalsProps) {
  const [radius, setRadius] = useState<"5" | "10" | "20">("10")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)

  useEffect(() => {
    const locateAndFetch = async () => {
      setLoading(true)
      const result = await getCurrentLocation()
      setUserLocation({ lat: result.lat, lng: result.lng })
      fetchHospitals(result.lat, result.lng, radius)
    }
    locateAndFetch()
  }, [radius])

  const fetchHospitals = async (lat: number, lng: number, r: string) => {
    setLoading(true)
    try {
      // Convert km radius to meters (roughly) or pass as query param if backend supports
      // Assuming backend supports lat, lng, radius (in m)
      const radiusMeters = parseInt(r) * 1000
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/hospitals?lat=${lat}&lng=${lng}&radius=${radiusMeters}`)

      if (res.ok) {
        const data = await res.json()
        const mapped = data.map((h: any) => ({
          id: h._id,
          name: h.name,
          address: h.address,
          distance: calculateDistance(lat, lng, h.lat, h.lng),
          phone: h.phone,
          rating: h.rating || 4.5, // Default if missing
          availableBeds: h.beds?.available || 0,
          totalBeds: h.beds?.total || 0,
          emergencyOpen: true, // Assuming true for now
          departments: h.departments || [],
          waitTime: "15 min", // Mock for now
          lat: h.lat,
          lng: h.lng
        })).filter((h: any) => h.distance <= parseInt(r))

        setHospitals(mapped)
      }
    } catch (error) {
      console.error("Error fetching hospitals", error)
    } finally {
      setLoading(false)
    }
  }

  // Haversine formula
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

  return (
    <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-md rounded-2xl overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-primary/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest">
              Nearby Hospitals
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <Tabs value={radius} onValueChange={(v) => setRadius(v as "5" | "10" | "20")}>
              <TabsList className="bg-background/40 backdrop-blur-md border border-primary/5 p-0.5 rounded-lg h-7">
                <TabsTrigger value="5" className="rounded-md px-2 py-0 text-[10px] font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-6">5km</TabsTrigger>
                <TabsTrigger value="10" className="rounded-md px-2 py-0 text-[10px] font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-6">10km</TabsTrigger>
                <TabsTrigger value="20" className="rounded-md px-2 py-0 text-[10px] font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-6">20km</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="h-4 w-[1px] bg-primary/10 mx-1" />
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")}>
              <TabsList className="bg-background/40 backdrop-blur-md border border-primary/5 p-0.5 rounded-lg h-7">
                <TabsTrigger value="list" className="rounded-md px-2 py-0 text-[10px] font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-6">List</TabsTrigger>
                <TabsTrigger value="map" className="rounded-md px-2 py-0 text-[10px] font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all h-6 flex items-center gap-1">
                  <Map className="h-2.5 w-2.5" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {viewMode === "map" ? (
          <div className="rounded-xl overflow-hidden border border-primary/5 shadow-inner">
            <HospitalsMap
              hospitals={filteredHospitals}
              userLocation={userLocation || undefined}
              onHospitalClick={onBookAppointment}
              height="350px"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {filteredHospitals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <div className="p-3 rounded-full bg-muted/20 mb-3">
                  <Hospital className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  No hospitals in {radius} km
                </p>
              </div>
            ) : (
              filteredHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="group p-3 border border-primary/5 rounded-xl bg-white/40 hover:bg-white/70 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold tracking-tight text-slate-800 truncate">{hospital.name}</h3>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mb-2">
                        {hospital.address}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span className="flex items-center gap-1 opacity-70">
                          <Navigation className="h-3 w-3 text-primary" />
                          {hospital.distance}km
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2.5 bg-white/60 border border-primary/10 hover:bg-primary hover:text-white transition-all font-bold text-[9px] uppercase tracking-widest gap-1.5 hover:scale-[1.02] active:scale-95 shadow-sm"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank')}
                      >
                        <Navigation className="h-3 w-3" />
                        Direction
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 rounded-lg px-2.5 bg-white/60 border border-emerald-200 hover:bg-emerald-500 hover:text-white transition-all shadow-sm group/call font-bold text-[9px] uppercase tracking-widest gap-1.5 hover:scale-[1.02] active:scale-95"
                        onClick={() => window.location.href = `tel:${hospital.phone.replace(/\s/g, "")}`}
                      >
                        <Phone className="h-3 w-3 group-hover/call:scale-110 transition-transform" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 rounded-lg px-3 font-bold text-[9px] uppercase tracking-widest shadow-lg shadow-primary/5 transition-all ml-0.5 hover:scale-[1.02] active:scale-95"
                        onClick={() => onBookAppointment?.(hospital)}
                      >
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
