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
      const res = await fetch(`http://localhost:5000/api/hospitals?lat=${lat}&lng=${lng}&radius=${radiusMeters}`)

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Nearby Hospitals
          </CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={radius} onValueChange={(v) => setRadius(v as "5" | "10" | "20")}>
              <TabsList className="h-8">
                <TabsTrigger value="5" className="text-xs px-3">5 km</TabsTrigger>
                <TabsTrigger value="10" className="text-xs px-3">10 km</TabsTrigger>
                <TabsTrigger value="20" className="text-xs px-3">20 km</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "map")}>
              <TabsList className="h-8">
                <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
                <TabsTrigger value="map" className="text-xs px-3 flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "map" ? (
          <div className="space-y-3">
            <HospitalsMap
              hospitals={filteredHospitals}
              userLocation={userLocation || undefined}
              onHospitalClick={onBookAppointment}
              height="400px"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHospitals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hospitals found within {radius} km
              </p>
            ) : (
              filteredHospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{hospital.name}</h3>
                        {hospital.emergencyOpen && (
                          <Badge variant="outline" className="text-success border-success text-xs">
                            24/7 Emergency
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {hospital.address}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3.5 w-3.5 text-primary" />
                          {hospital.distance} km
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                          {hospital.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          ~{hospital.waitTime}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            hospital.availableBeds > 10
                              ? "text-success"
                              : hospital.availableBeds > 5
                                ? "text-warning-foreground"
                                : "text-emergency"
                          )}
                        >
                          <Bed className="h-3.5 w-3.5" />
                          {hospital.availableBeds}/{hospital.totalBeds} beds
                        </span>
                      </div>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {hospital.departments.slice(0, 3).map((dept) => (
                          <Badge key={dept} variant="secondary" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                        {hospital.departments.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{hospital.departments.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap bg-transparent"
                        onClick={() => window.location.href = `tel:${hospital.phone.replace(/\s/g, "")}`}
                      >
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        Call
                      </Button>
                      <Button
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => onBookAppointment?.(hospital)}
                      >
                        Book
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
