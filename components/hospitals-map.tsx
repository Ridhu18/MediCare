"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import {
  MapPin,
  Phone,
  Clock,
  Bed,
  Star,
  Navigation,
  Hospital as HospitalIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  })
}

interface Hospital {
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

interface HospitalsMapProps {
  hospitals: Hospital[]
  userLocation?: { lat: number; lng: number }
  onHospitalClick?: (hospital: Hospital) => void
  height?: string
}

// Component to center map on user location or first hospital
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [map, center])
  return null
}

export function HospitalsMap({
  hospitals,
  userLocation,
  onHospitalClick,
  height = "600px",
}: HospitalsMapProps) {
  const mapRef = useRef<L.Map | null>(null)

  // Default center (Bangalore, India) or user location or first hospital
  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : hospitals.length > 0
      ? [hospitals[0].lat, hospitals[0].lng]
      : [12.9716, 77.5946] // Bangalore coordinates

  const getMarkerColor = (hospital: Hospital) => {
    if (hospital.availableBeds > 10) return "#22c55e" // green
    if (hospital.availableBeds > 5) return "#f59e0b" // amber
    return "#ef4444" // red
  }

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <div style="
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">🏥</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    })
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          tileSize={256}
        />
        <MapCenter center={defaultCenter} />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "user-marker",
              html: `
                <div style="
                  background-color: #2563eb;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
              `,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="text-sm font-medium">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Hospital markers */}
        {hospitals.map((hospital) => {
          const color = getMarkerColor(hospital)
          return (
            <Marker
              key={hospital.id}
              position={[hospital.lat, hospital.lng]}
              icon={createCustomIcon(color)}
              eventHandlers={{
                // Removed click handler to prevent auto-opening booking
              }}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="p-2 space-y-2 min-w-[250px]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{hospital.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hospital.address}
                      </p>
                    </div>
                    {hospital.emergencyOpen && (
                      <Badge className="bg-success/20 text-success border-success text-xs">
                        24/7
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-primary" />
                      {hospital.distance} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      {hospital.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
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
                      <Bed className="h-3 w-3" />
                      {hospital.availableBeds}/{hospital.totalBeds}
                    </span>
                  </div>

                  <div className="flex gap-1 flex-wrap">
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

                  <div className="flex gap-1 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[10px] h-7 px-1 bg-transparent hover:bg-success hover:text-success-foreground border-success/50"
                      onClick={() =>
                        (window.location.href = `tel:${hospital.phone.replace(/\s/g, "")}`)
                      }
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-[10px] h-7 px-1 bg-transparent hover:bg-primary hover:text-primary-foreground border-primary/50"
                      onClick={() =>
                        window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${hospital.lat},${hospital.lng}`, '_blank')
                      }
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-[10px] h-7 px-1"
                      onClick={() => {
                        onHospitalClick?.(hospital)
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

