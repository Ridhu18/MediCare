"use client"

import { useState, useEffect } from "react"
import { Phone, AlertTriangle, Volume2, VolumeX, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface EmergencyType {
  id: string
  label: string
  priority: "critical" | "high" | "medium"
  icon: string
}

const emergencyTypes: EmergencyType[] = [
  { id: "cardiac", label: "Heart Attack / Cardiac", priority: "critical", icon: "❤️" },
  { id: "accident", label: "Road Accident", priority: "critical", icon: "🚗" },
  { id: "breathing", label: "Breathing Difficulty", priority: "critical", icon: "🫁" },
  { id: "stroke", label: "Stroke", priority: "critical", icon: "🧠" },
  { id: "injury", label: "Severe Injury", priority: "high", icon: "🩹" },
  { id: "other", label: "Other Emergency", priority: "medium", icon: "🚨" },
]

export function SOSButton() {
  const [isPressed, setIsPressed] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [showDialog, setShowDialog] = useState(false)
  const [silentMode, setSilentMode] = useState(false)
  const [emergencyType, setEmergencyType] = useState<string>("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)

  // Initialize AudioContext on first user interaction (browser requirement)
  const initAudio = () => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      setAudioCtx(ctx)
    }
  }

  const playBeep = (freq: number, duration: number) => {
    if (silentMode || !audioCtx) return
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration)
    osc.start()
    osc.stop(audioCtx.currentTime + duration)
  }

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => console.log("Location error:", error)
      )
    }
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isPressed && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
        playBeep(440 + (3 - countdown) * 100, 0.2) // Increasing pitch beep
      }, 1000)
    } else if (isPressed && countdown === 0) {
      playBeep(880, 0.5) // Final alert sound
      triggerEmergency()
    }
    return () => clearTimeout(timer)
  }, [isPressed, countdown])

  const triggerEmergency = async () => {
    setIsEmergencyActive(true)
    setShowDialog(true)
    setIsPressed(false)
    setCountdown(3)

    // Automatically create a "pending" emergency case
    try {
      const userStr = localStorage.getItem("user")
      const user = userStr ? JSON.parse(userStr) : null

      const res = await fetch("http://localhost:5000/api/emergencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || user?._id,
          phone: user?.phone || "Unknown",
          patientName: user?.name || "Emergency User",
          emergencyType: "other",
          priority: "high",
          location: {
            name: "App SOS Trigger",
            coordinates: [location?.lng || 77.5946, location?.lat || 12.9716],
          },
          status: "incoming"
        }),
      })
      if (res.ok) {
        const data = await res.json()
        console.log("Emergency created:", data)
      }
    } catch (error) {
      console.error("Error creating SOS entry:", error)
    }
  }

  const handleSOSPress = () => {
    setIsPressed(true)
  }

  const handleSOSRelease = () => {
    if (countdown > 0) {
      setIsPressed(false)
      setCountdown(3)
    }
  }

  const callAmbulance = () => {
    window.location.href = "tel:108"
  }

  const cancelEmergency = () => {
    setShowDialog(false)
    setIsEmergencyActive(false)
    setEmergencyType("")
  }

  return (
    <>
      <div className="relative flex flex-col items-center gap-6">
        {/* Silent Mode Toggle */}
        <div className="w-full flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              initAudio()
              setSilentMode(!silentMode)
            }}
            className="text-xs hover:bg-primary/5"
          >
            {silentMode ? (
              <VolumeX className="h-4 w-4 mr-2" />
            ) : (
              <Volume2 className="h-4 w-4 mr-2" />
            )}
            {silentMode ? "Silent Mode" : "Normal Mode"}
          </Button>
        </div>

        {/* Main SOS Button */}
        <div className="relative">
          {/* Pulse Animation */}
          {isPressed && (
            <>
              <div className="absolute inset-0 rounded-full bg-emergency animate-ping opacity-30" />
              <div className="absolute inset-0 rounded-full bg-emergency animate-pulse opacity-20 scale-110" />
            </>
          )}

          <button
            onMouseDown={() => {
              initAudio();
              handleSOSPress();
            }}
            onMouseUp={handleSOSRelease}
            onMouseLeave={handleSOSRelease}
            onTouchStart={() => {
              initAudio();
              handleSOSPress();
            }}
            onTouchEnd={handleSOSRelease}
            className={cn(
              "relative w-40 h-40 rounded-full flex flex-col items-center justify-center",
              "bg-emergency text-emergency-foreground font-bold text-2xl",
              "shadow-2xl transition-all duration-200",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-emergency/50",
              isPressed && "scale-95 bg-emergency/90"
            )}
          >
            <Phone className="h-10 w-10 mb-2" />
            <span className="text-3xl font-black">SOS</span>
            {isPressed && (
              <span className="text-4xl mt-1 animate-bounce">{countdown}</span>
            )}
          </button>
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Press and hold for 3 seconds to trigger emergency alert
        </p>

        {/* Location Status */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-success">
            <MapPin className="h-4 w-4" />
            <span>GPS Location Active</span>
          </div>
        )}
      </div>

      {/* Emergency Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emergency">
              <AlertTriangle className="h-6 w-6" />
              Emergency Alert Triggered
            </DialogTitle>
            <DialogDescription>
              Select emergency type for priority handling
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={emergencyType} onValueChange={setEmergencyType}>
              <SelectTrigger>
                <SelectValue placeholder="Select emergency type" />
              </SelectTrigger>
              <SelectContent>
                {emergencyTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full ml-2",
                          type.priority === "critical" && "bg-emergency/20 text-emergency",
                          type.priority === "high" && "bg-warning/20 text-warning-foreground",
                          type.priority === "medium" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {type.priority}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {location && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Your Location</p>
                <p className="text-xs text-muted-foreground">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={callAmbulance}
                className="flex-1 bg-emergency hover:bg-emergency/90 text-emergency-foreground"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call 108 Ambulance
              </Button>
              <Button variant="outline" onClick={cancelEmergency}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {silentMode
                ? "Silent mode active - SMS will be sent without sound"
                : "Emergency contacts will be notified with your location"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
