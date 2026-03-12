"use client"

import { useState, useEffect } from "react"
import { AppNavigation } from "@/components/app-navigation"
import { SOSButton } from "@/components/sos-button"
import { EmergencyContacts } from "@/components/emergency-contacts"
import {
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
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
        const res = await fetch(`http://localhost:5000/api/emergencies/my/${user.id || user._id}`)
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
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-emergency" />
                Emergency
              </h1>
              <p className="text-sm text-muted-foreground">Quick access to emergency services</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* SOS Section */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-emergency/30 bg-emergency/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-emergency">SOS Emergency</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-6">
                  <SOSButton />
                </CardContent>
              </Card>

              <EmergencyContacts />

              {/* Emergency Numbers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    Emergency Numbers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {emergencyNumbers.map((item) => (
                    <a
                      key={item.number}
                      href={`tel:${item.number}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{item.number}</span>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* First Aid Guides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    First Aid Guides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {firstAidGuides.map((guide, index) => (
                      <AccordionItem key={guide.title} value={`item-${index}`}>
                        <AccordionTrigger className="text-left">
                          {guide.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            {guide.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Emergency History */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Emergency History
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">Loading history...</div>
                  ) : emergencyHistory.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No emergency records found.</div>
                  ) : (
                    emergencyHistory.map((emergency) => (
                      <div
                        key={emergency._id}
                        className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold capitalize">{emergency.emergencyType} Emergency</h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs capitalize",
                                  emergency.status === "completed" ? "bg-success/20 text-success border-success" : "bg-warning/20 text-warning border-warning"
                                )}
                              >
                                {emergency.status === "completed" ? "Resolved" : emergency.status.replace("-", " ")}
                              </Badge>
                            </div>
                            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                              <p className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                {new Date(emergency.createdAt).toLocaleDateString()} at {new Date(emergency.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" />
                                {emergency.location?.name || "Location Not Specified"}
                              </p>
                            </div>
                          </div>
                          {emergency.hospitalId && (
                            <div className="text-right text-sm">
                              <p className="text-muted-foreground">Treated at</p>
                              <p className="font-medium">{emergency.hospitalId.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Offline SOS Info */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Offline SOS Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Even without internet, you can trigger an SOS via SMS. Your location and emergency contacts will receive an alert automatically. Make sure to grant SMS permissions for this feature.
                      </p>
                      <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                        Configure Offline SOS
                      </Button>
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
