"use client"

import { useState, useEffect } from "react"
import { AppNavigation } from "@/components/app-navigation"
import { SOSButton } from "@/components/sos-button"
import { EmergencyContacts } from "@/components/emergency-contacts"
import { NearbyHospitals, Hospital as HospitalData } from "@/components/nearby-hospitals"
import { AppointmentBooking } from "@/components/appointment-booking"
import { AppointmentsList } from "@/components/appointments-list"
import {
  Activity,
  Bell,
  Calendar,
  Hospital,
  Shield,
  Ambulance,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"



export default function HomePage() {
  const [showBooking, setShowBooking] = useState(false)
  const [selectedHospital, setSelectedHospital] = useState<HospitalData | null>(null)
  const [stats, setStats] = useState({
    hospitals: 0,
    appointments: 0,
    ambulances: 5 // Mock for now
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

        // Fetch Appointments if logged in
        if (token) {
          const resApps = await fetch("http://localhost:5000/api/appointments/my", { headers })
          if (resApps.ok) {
            const apps = await resApps.json()
            const upcoming = apps.filter((a: any) =>
              (new Date(a.date) >= new Date() || new Date(a.date).toDateString() === new Date().toDateString()) &&
              (a.status === 'confirmed' || a.status === 'pending')
            ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

            setStats(prev => ({ ...prev, appointments: upcoming.length }))
            setUpcomingAppointments(upcoming.slice(0, 2))
          }
        }

        // Fetch Hospital Count (using default location for now)
        const resHosp = await fetch("http://localhost:5000/api/hospitals?lat=12.9716&lng=77.5946&radius=50000") // Wide radius to get count
        if (resHosp.ok) {
          const hospitals = await resHosp.json()
          setStats(prev => ({ ...prev, hospitals: hospitals.length }))
        }

      } catch (error) {
        console.error("Error fetching dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleBookAppointment = (hospital: HospitalData) => {
    setSelectedHospital(hospital)
    setShowBooking(true)
  }

  // Dynamic stats
  const currentStats = [
    {
      label: "Emergency Ready",
      value: "Active",
      icon: Shield,
      color: "text-success",
    },
    {
      label: "Nearby Hospitals",
      value: stats.hospitals.toString(),
      icon: Hospital,
      color: "text-primary",
    },
    {
      label: "Appointments",
      value: stats.appointments.toString(),
      icon: Calendar,
      color: "text-accent",
    },
    {
      label: "Ambulances Available",
      value: stats.ambulances.toString(),
      icon: Ambulance,
      color: "text-warning-foreground",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">MediCare+</h1>
              <p className="text-sm text-muted-foreground">Your Health, Our Priority</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-emergency rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {currentStats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-semibold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - SOS */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-emergency" />
                    Emergency SOS
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-8">
                  <SOSButton />
                </CardContent>
              </Card>

              <EmergencyContacts />
            </div>

            {/* Right Column - Hospitals & Appointments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Nearby Hospitals */}
              <NearbyHospitals onBookAppointment={handleBookAppointment} />

              {/* Appointments Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/hospitals">View All</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAppointments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments.</p>
                    ) : (
                      upcomingAppointments.map((apt: any) => (
                        <div key={apt._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${apt.status === 'confirmed' ? 'bg-primary/10' : 'bg-warning/20'}`}>
                              <Calendar className={`h-5 w-5 ${apt.status === 'confirmed' ? 'text-primary' : 'text-warning-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{apt.doctor?.user?.name || "Doctor"}</p>
                              <p className="text-sm text-muted-foreground">
                                {apt.hospital?.name || "Hospital"} • {apt.doctor?.specialization || "General"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                            <p className="text-sm text-muted-foreground">{apt.time}</p>
                            {apt.status === 'pending' && (
                              <Badge variant="outline" className="bg-warning/20 text-warning-foreground border-warning text-[10px] mt-1">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Health Tips */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Daily Health Tip</h3>
                      <p className="text-sm text-muted-foreground">
                        Stay hydrated! Drink at least 8 glasses of water daily. Proper hydration helps maintain body temperature, lubricates joints, and aids in nutrient absorption.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto z-[1100]">
          <DialogTitle className="sr-only">Book Appointment</DialogTitle>
          <AppointmentBooking
            hospitalName={selectedHospital?.name}
            onClose={() => setShowBooking(false)}
            onSuccess={() => {
              setShowBooking(false)
              setSelectedHospital(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
