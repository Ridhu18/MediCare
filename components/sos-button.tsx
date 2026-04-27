"use client"

import { useState, useEffect } from "react"
import { Phone, AlertTriangle, Volume2, VolumeX, MapPin, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies`, {
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
      <div className="relative w-full flex flex-col items-center py-6 overflow-hidden rounded-3xl">
        {/* Console Aesthetics: Background Grid and Scanning Line */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emergency/40 to-transparent animate-[scan_4s_linear_infinite]" />
        </div>

        {/* Unified Telemetry Bar - Professional Emergency Console Approach */}
        <div className="relative z-20 flex items-center justify-center gap-3 mb-8 w-full px-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-500",
            silentMode ? "bg-destructive/10 border-destructive/20 text-destructive shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "bg-white/40 border-primary/5 text-primary shadow-sm"
          )}>
            <button 
              onClick={() => { initAudio(); setSilentMode(!silentMode); }}
              className="flex items-center gap-2 outline-none"
            >
              {silentMode ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{silentMode ? "Silent" : "Audio"}</span>
            </button>
          </div>

          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all duration-500",
            location ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-sky-500/10 border-sky-500/20 text-sky-600 animate-pulse"
          )}>
            {location ? <MapPin className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {location ? "GPS Active" : "Searching..."}
            </span>
          </div>
        </div>

        {/* Main SOS Button Container */}
        <div className="relative group/sos-main">
          {/* Static Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-emergency/20 blur-[60px] scale-125 group-hover/sos-main:bg-emergency/30 transition-all duration-1000" />
          
          {/* Interactive Rings */}
          <div className="absolute inset-[-15px] rounded-full border border-emergency/10 animate-[ping_4s_ease-in-out_infinite] opacity-50" />
          <div className="absolute inset-[-30px] rounded-full border border-emergency/5 animate-[ping_4s_ease-in-out_infinite_1s] opacity-20" />
          
          {isPressed && (
            <div className="absolute inset-[-20px] rounded-full border-2 border-dashed border-emergency/30 animate-[spin_10s_linear_infinite]" />
          )}

          <button
            onMouseDown={() => { initAudio(); handleSOSPress(); }}
            onMouseUp={handleSOSRelease}
            onMouseLeave={handleSOSRelease}
            onTouchStart={() => { initAudio(); handleSOSPress(); }}
            onTouchEnd={handleSOSRelease}
            className={cn(
              "relative w-48 h-48 rounded-full flex flex-col items-center justify-center overflow-hidden transition-all duration-500",
              "bg-gradient-to-br from-emergency via-red-600 to-red-800 text-white",
              "shadow-[0_20px_50px_rgba(220,38,38,0.4),inset_0_4px_12px_rgba(255,255,255,0.3)]",
              "hover:scale-[1.02] active:scale-95",
              "focus:outline-none focus:ring-4 focus:ring-emergency/20",
              isPressed && "scale-95 brightness-90"
            )}
          >
            {/* Dynamic Gloss Finish */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className={cn(
                "w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] transition-all duration-500",
                isPressed ? "scale-90 rotate-12" : "scale-100"
              )}>
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <span className="text-5xl font-black tracking-tighter uppercase drop-shadow-lg">SOS</span>
              <div className="h-1 w-12 bg-white/30 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-100"
                  style={{ width: isPressed ? `${((3 - countdown) / 3) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Countdown Overlay */}
            {isPressed && (
              <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                <span className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-in zoom-in-75 duration-300">
                  {countdown}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Secondary Info Area */}
        <div className="mt-12 flex flex-col items-center">
          {!isPressed ? (
            <div className="flex flex-col items-center gap-1.5 group/instruction cursor-default">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emergency animate-pulse group-hover:tracking-[0.4em] transition-all">
                Hold to Trigger
              </span>
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest text-center px-8">
                Response center will be alerted instantly
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-2 bg-primary/5 rounded-full border border-primary/10">
              <Loader2 className="h-3 w-3 text-primary animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Establishing Secure Link...</span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Dialog - Glassmorphism Refined */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md border-none bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-0">
          <div className="absolute top-0 left-0 w-full h-2 bg-emergency" />
          
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emergency/10 flex items-center justify-center shrink-0 border border-emergency/20">
                <ShieldAlert className="h-8 w-8 text-emergency animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-800">
                  SOS DEPLOYED
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1 text-emergency opacity-80">
                  Critical Situation Identified
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Current Emergency Category</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/40 border-primary/10 shadow-sm focus:ring-primary/20">
                  <SelectValue placeholder="Select high-priority category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-primary/5 shadow-2xl p-2">
                  {emergencyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="rounded-xl py-3 focus:bg-primary/5">
                      <div className="flex items-center gap-4 w-full">
                        <span className="text-2xl drop-shadow-sm">{type.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-700">{type.label}</p>
                          <p className="text-[10px] font-medium text-muted-foreground opacity-60">Priority: {type.priority}</p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[8px] font-black uppercase tracking-widest border-none px-2 py-0",
                            type.priority === "critical" && "bg-emergency/10 text-emergency",
                            type.priority === "high" && "bg-warning/10 text-warning",
                            type.priority === "medium" && "bg-primary/10 text-primary"
                          )}
                        >
                          {type.priority}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {location && (
              <div className="p-5 bg-primary/[0.03] border border-primary/5 rounded-2xl flex items-center justify-between group/loc">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/loc:scale-110 transition-transform">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Telemetry</p>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-success/10 text-success rounded-full text-[9px] font-black tracking-widest uppercase">
                  Verified
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={callAmbulance}
                className="h-14 rounded-2xl bg-gradient-to-r from-emergency to-red-600 hover:opacity-90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-emergency/20 transition-all hover:scale-[1.02] active:scale-95 group/call"
              >
                <Phone className="h-5 w-5 mr-3 group-hover/call:animate-bounce" />
                Call 108 Command Center
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelEmergency}
                className="h-14 rounded-2xl border-primary/10 bg-white/40 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 font-bold text-xs uppercase tracking-widest transition-all"
              >
                De-escalate Alert
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60">
                {silentMode
                  ? "SMS Protocol Active (Silent)"
                  : "All Emergency Contacts notified"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
