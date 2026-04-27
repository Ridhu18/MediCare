"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppNavigation } from "@/components/app-navigation"
import { SOSButton } from "@/components/sos-button"
import { EmergencyContacts } from "@/components/emergency-contacts"
import {
  FileText,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Info,
  ExternalLink,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

const emergencyNumbers = [
  { name: "Ambulance", number: "108", description: "National Emergency Ambulance" },
  { name: "Police", number: "100", description: "Police Emergency" },
  { name: "Fire", number: "101", description: "Fire Department" },
  { name: "Women Helpline", number: "181", description: "Women Safety" },
  { name: "Child Helpline", number: "1098", description: "Child Protection" },
]

const firstAidGuides = [
  {
    title: "Heart Attack",
    steps: [
      "Call 108 immediately",
      "Help the person sit down and stay calm",
      "Loosen any tight clothing",
      "If prescribed, help them take aspirin or nitroglycerin",
      "If unconscious, perform CPR if trained",
    ],
  },
  {
    title: "Choking",
    steps: [
      "Ask 'Are you choking?' - if they can't respond",
      "Stand behind and lean them forward",
      "Give 5 sharp back blows between shoulder blades",
      "Give 5 abdominal thrusts (Heimlich maneuver)",
      "Alternate until object is dislodged or help arrives",
    ],
  },
  {
    title: "Severe Bleeding",
    steps: [
      "Call 108 if bleeding is severe",
      "Apply direct pressure with clean cloth",
      "Keep the injured part elevated if possible",
      "Apply pressure bandage if available",
      "Don't remove embedded objects",
    ],
  },
  {
    title: "Burns",
    steps: [
      "Cool the burn under running water for 10-20 minutes",
      "Don't apply ice, butter, or toothpaste",
      "Remove jewelry/tight items near burn area",
      "Cover with clean, non-stick bandage",
      "Seek medical help for serious burns",
    ],
  },
]

export default function EmergencyPage() {
  const [emergencyHistory, setEmergencyHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const userStr = localStorage.getItem("user")
        if (!userStr) {
          setLoading(false)
          return
        }
        const user = JSON.parse(userStr)
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies/my/${user.id || user._id}`)
        if (res.ok) {
          const data = await res.json()
          setEmergencyHistory(data)
        }
      } catch (error) {
        console.error("Error fetching emergency history:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])
  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emergency/10 ring-1 ring-emergency/20 text-emergency">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">
                  Emergency Command
                </h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">High-Fidelity Response System</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* SOS Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="relative border-none shadow-2xl shadow-emergency/10 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group/sos">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emergency via-red-500 to-emergency opacity-80" />
                
                <CardHeader className="pt-8 pb-0 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emergency/10 ring-1 ring-emergency/20 animate-pulse">
                      <ShieldAlert className="h-6 w-6 text-emergency" />
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-[0.2em] text-emergency">Critical SOS</CardTitle>
                    <div className="h-px w-12 bg-emergency/20" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-2 pb-10">
                  <SOSButton />
                </CardContent>
              </Card>

              <EmergencyContacts />

              {/* Emergency Numbers */}
              <Card className="border-none shadow-lg shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-primary/5 bg-white/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Direct Services
                    </CardTitle>
                    <Info className="h-3.5 w-3.5 text-muted-foreground opacity-40 hover:opacity-100 cursor-help transition-opacity" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                  {emergencyNumbers.map((item) => (
                    <a
                      key={item.number}
                      href={`tel:${item.number}`}
                      className="group/num flex items-center justify-between p-3 rounded-xl hover:bg-white/60 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover/num:bg-primary/10 transition-colors">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium opacity-60 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 group-hover/num:border-primary/30 transition-all">
                        <span className="text-[11px] font-black text-primary font-mono">{item.number}</span>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* First Aid Guides */}
              <Card className="border-none shadow-lg shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="pb-0 border-b border-primary/5 bg-white/20">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2 py-4">
                    <FileText className="h-4 w-4 text-accent" />
                    Interactive Life-Saving Guides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {firstAidGuides.map((guide, index) => (
                      <AccordionItem key={guide.title} value={`item-${index}`} className="border-primary/5 px-6">
                        <AccordionTrigger className="text-sm font-bold text-slate-700 hover:no-underline hover:text-primary transition-colors py-4">
                          <span className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-[10px] text-primary">{index + 1}</span>
                            {guide.title}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pb-4 space-y-3">
                            <div className="p-3 bg-muted/20 border border-primary/5 rounded-xl space-y-2">
                              {guide.steps.map((step, i) => (
                                <div key={i} className="flex gap-3">
                                  <div className="mt-1 h-3.5 w-3.5 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">{step}</p>
                                </div>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest h-8 rounded-lg border-primary/10 bg-white/40 hover:bg-primary hover:text-white transition-all">
                              Download Detailed guide
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Emergency History */}
              <Card className="border-none shadow-lg shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-primary/5 bg-white/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground opacity-60" />
                      Incident Timeline
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 h-8">
                      <Link href="/history?tab=emergencies">
                        Full Access
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Synchronizing records...</p>
                    </div>
                  ) : emergencyHistory.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-primary/10 bg-primary/[0.01]">
                      <p className="text-xs font-medium text-muted-foreground italic opacity-60">Complete security. No incident records found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {emergencyHistory.map((emergency) => (
                        <div
                          key={emergency._id}
                          className="group/history p-4 bg-white/40 hover:bg-white/60 border border-primary/5 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-primary/5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 group-hover/history:translate-x-0.5 transition-transform duration-300">
                                <h4 className="text-sm font-bold text-slate-800 capitalize leading-none">{emergency.emergencyType} Alert</h4>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0 rounded-md border-none",
                                    emergency.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                                  )}
                                >
                                  {emergency.status === "completed" ? "Resolved" : "In Progress"}
                                </Badge>
                              </div>
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                                <p className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                                  <Clock className="h-3 w-3 opacity-60 text-primary" />
                                  {new Date(emergency.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })} • {new Date(emergency.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="flex items-center gap-2 text-[10px] font-medium text-slate-500 truncate">
                                  <MapPin className="h-3 w-3 opacity-60 text-primary" />
                                  {emergency.location?.name || "Location Sync Active"}
                                </p>
                              </div>
                            </div>
                            {emergency.hospitalId && (
                              <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/10 sm:w-48 group-hover/history:border-primary/30 transition-all">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Verified Response</p>
                                  <p className="text-[10px] font-bold text-slate-700 truncate">{emergency.hospitalId.name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Offline SOS Info */}
              <Card className="border-none shadow-lg shadow-primary/5 bg-primary/[0.02] border-dashed border border-primary/20 rounded-2xl overflow-hidden group/offline">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover/offline:scale-110 transition-transform duration-500">
                      <ShieldAlert className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                        Offline Guard System
                        <Badge className="bg-primary/5 text-primary text-[8px] font-black tracking-widest border-none">BETA</Badge>
                      </h3>
                      <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        No internet? Our system automatically switches to <span className="text-primary font-bold">Encrypted SMS SOS</span>. Your live coordinates and health summary will be sent to verified responders via telco networks.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg text-xs font-bold border-primary/10 bg-white/40 hover:bg-primary hover:text-white transition-all">
                          Configure SMS Protocol
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-all">
                          Security Whitepaper
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
