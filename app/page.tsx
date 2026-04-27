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
  ShieldAlert,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"



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
          const resApps = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/my`, { headers })
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
        const resHosp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/hospitals?lat=12.9716&lng=77.5946&radius=50000`) // Wide radius to get count
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[5%] w-[30%] h-[30%] bg-emergency/5 rounded-full blur-[80px]" />
      </div>

      <AppNavigation />

      <main className="relative z-10 pb-20 md:pb-0 md:ml-20 lg:ml-64">
        {/* Header - Glassmorphism Refined */}
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">MediCare+ System Dashboard</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Connected Healthcare Network</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">System Status</p>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">Secure Protocol Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

        <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
          {/* Quick Stats - Premium Glass Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentStats.map((stat, i) => (
              <Card key={stat.label} className="border-none shadow-xl shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden group/stat transition-all duration-300 hover:scale-[1.02]">
                <div className={cn("absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-40", 
                  i === 0 ? "from-success to-transparent" :
                  i === 1 ? "from-primary to-transparent" :
                  i === 2 ? "from-accent to-transparent" :
                  "from-warning to-transparent"
                )} />
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl bg-white shadow-sm ring-1 ring-primary/5 group-hover/stat:rotate-6 transition-transform", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{stat.label}</p>
                      <p className="text-xl font-black text-slate-800 tracking-tight mt-0.5">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - SOS & Contacts */}
            <div className="lg:col-span-1 space-y-8">
              <Card className="relative border-none shadow-2xl shadow-emergency/10 bg-white/30 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group/sos">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emergency via-red-500 to-emergency opacity-80" />
                <CardHeader className="pt-8 pb-0 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emergency/10 ring-1 ring-emergency/20 animate-pulse">
                      <ShieldAlert className="h-6 w-6 text-emergency" />
                    </div>
                    <CardTitle className="text-lg font-black uppercase tracking-[0.2em] text-emergency">Critical SOS</CardTitle>
                    <div className="h-px w-12 bg-emergency/20" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2 pb-10">
                  <SOSButton />
                </CardContent>
              </Card>

              <EmergencyContacts />
            </div>

            {/* Right Column - Hospitals & Appointments */}
            <div className="lg:col-span-2 space-y-8">
              {/* Nearby Hospitals */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                    <Hospital className="h-5 w-5 text-primary" />
                    Nearby Medical Centers
                  </h2>
                  <Button variant="ghost" size="sm" asChild className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5">
                    <a href="/hospitals">Directory <ChevronRight className="h-3.5 w-3.5 ml-1" /></a>
                  </Button>
                </div>
                <NearbyHospitals onBookAppointment={handleBookAppointment} />
              </div>

              {/* Appointments & Health Tip Row */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Appointments Preview */}
                <Card className="border-none shadow-xl shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4 border-b border-primary/5 bg-white/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-accent" />
                        Next Sessions
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {upcomingAppointments.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-40">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No pending sessions</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingAppointments.map((apt: any) => (
                          <div key={apt._id} className="group/apt flex items-center justify-between p-3.5 bg-white/40 hover:bg-white/60 border border-primary/5 rounded-xl transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-11 w-11 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/apt:scale-110",
                                apt.status === 'confirmed' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning-foreground'
                              )}>
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{apt.doctor?.user?.name || "Dr. Medical Specialist"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground opacity-60 truncate">
                                  {apt.hospital?.name || "General Clinic"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                              <p className="text-[10px] font-bold text-muted-foreground">{apt.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Health Tip Feature */}
                <Card className="relative border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-primary/10 via-background/40 to-accent/10 backdrop-blur-md rounded-2xl overflow-hidden group/tip">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <CardContent className="p-8 h-full flex flex-col justify-between">
                    <div>
                      <div className="h-12 w-12 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 group-hover/tip:scale-110 transition-transform">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight">Daily Prime Health Tip</h3>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed opacity-80">
                        Maximize your hydration quality by sipping water consistently 
                        throughout the day. Proper hydration is the cornerstone of clinical vitality 
                        and metabolic performance.
                      </p>
                    </div>
                    <div className="pt-6 flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Optimal</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Appointment Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-none bg-background/60 backdrop-blur-2xl shadow-2xl rounded-3xl p-0">
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
