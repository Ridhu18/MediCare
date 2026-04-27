"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DoctorSidebar } from "@/components/doctor-sidebar"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Stethoscope,
  User,
  LogOut,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// Removed inline navItems

interface TimeSlot {
  id: string
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

const defaultSchedule: TimeSlot[] = [
  { id: "1", day: "Monday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "2", day: "Tuesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "3", day: "Wednesday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "4", day: "Thursday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "5", day: "Friday", startTime: "09:00", endTime: "17:00", isAvailable: true },
  { id: "6", day: "Saturday", startTime: "09:00", endTime: "13:00", isAvailable: true },
  { id: "7", day: "Sunday", startTime: "", endTime: "", isAvailable: false },
]

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState<TimeSlot[]>(defaultSchedule)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [newSchedule, setNewSchedule] = useState<Partial<TimeSlot>>({
    startTime: "",
    endTime: "",
    isAvailable: true,
  })

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>({
    name: "",
    profileImage: "",
    specialization: "",
    department: ""
  })

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setProfile({
            name: data.user?.name || "",
            profileImage: data.user?.profileImage || "",
            specialization: data.specialization || "",
            department: data.department || ""
          })
          if (data.availability && data.availability.length > 0) {
            // Parse availabilities: ["Monday 09:00-17:00", ...]
            const newSchedule = defaultSchedule.map(day => {
              const found = data.availability.find((s: string) => s.startsWith(day.day))
              if (found) {
                const [_, times] = found.split(' ')
                const [start, end] = times.split('-')
                return { ...day, startTime: start, endTime: end, isAvailable: true }
              }
              return { ...day, isAvailable: false }
            })
            setSchedule(newSchedule)
          }
        }
      } catch (error) {
        console.error("Error fetching schedule", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSchedule()
  }, [])

  const saveToBackend = async (updatedSchedule: TimeSlot[]) => {
    try {
      const token = localStorage.getItem("token")
      // Convert to string array
      const availability = updatedSchedule
        .filter(s => s.isAvailable && s.startTime && s.endTime)
        .map(s => `${s.day} ${s.startTime}-${s.endTime}`)

      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availability })
      })
    } catch (e) {
      console.error("Error saving schedule", e)
    }
  }

  const handleToggleDay = (dayId: string) => {
    const updated = schedule.map((s) =>
      s.id === dayId ? { ...s, isAvailable: !s.isAvailable } : s
    )
    setSchedule(updated)
    saveToBackend(updated)
  }

  const handleSaveDay = (dayId: string) => {
    if (newSchedule.startTime && newSchedule.endTime) {
      const updated = schedule.map((s) =>
        s.id === dayId
          ? {
            ...s,
            startTime: newSchedule.startTime!,
            endTime: newSchedule.endTime!,
            isAvailable: true,
          }
          : s
      )
      setSchedule(updated)
      setEditingDay(null)
      setNewSchedule({ startTime: "", endTime: "", isAvailable: true })
      saveToBackend(updated)
    }
  }

  const getAvailableSlots = (day: TimeSlot) => {
    if (!day.isAvailable || !day.startTime || !day.endTime) return []
    const slots: string[] = []
    const start = timeSlots.indexOf(day.startTime)
    const end = timeSlots.indexOf(day.endTime)
    if (start !== -1 && end !== -1) {
      for (let i = start; i <= end; i++) {
        slots.push(timeSlots[i])
      }
    }
    return slots
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DoctorSidebar />

      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent h-96 -z-10" />

        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.25rem] bg-emergency/10 flex items-center justify-center text-emergency shadow-sm ring-1 ring-emergency/5">
                <Clock className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Schedule Management</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Manage your working hours</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className="h-10 px-6 font-black uppercase tracking-widest text-[10px] bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 gap-2"
              >
                {isEditing ? (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit className="h-3.5 w-3.5" />
                    Edit Schedule
                  </>
                )}
              </Button>
              <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                <AvatarImage src={profile.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${profile.profileImage}` : ""} className="object-cover" />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                  {profile.name ? profile.name.split(" ").map((n: any) => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="px-6 py-10 space-y-10">
          {/* Weekly Schedule */}
          <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-800">Weekly Availability</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {schedule.map((day) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-24">
                        <p className="font-medium">{day.day}</p>
                      </div>
                      {day.isAvailable ? (
                        editingDay === day.id ? (
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex-1 space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Start Time</Label>
                              <Select
                                value={newSchedule.startTime}
                                onValueChange={(value) =>
                                  setNewSchedule({ ...newSchedule, startTime: value })
                                }
                              >
                                <SelectTrigger className="h-12 bg-white/50 border-primary/10 rounded-2xl focus:ring-primary/20 font-bold text-sm transition-all hover:bg-white">
                                  <SelectValue placeholder="Start Time" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-primary/10">
                                  {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <span className="pt-6 font-bold text-muted-foreground opacity-40">to</span>
                            <div className="flex-1 space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">End Time</Label>
                              <Select
                                value={newSchedule.endTime}
                                onValueChange={(value) =>
                                  setNewSchedule({ ...newSchedule, endTime: value })
                                }
                              >
                                <SelectTrigger className="h-12 bg-white/50 border-primary/10 rounded-2xl focus:ring-primary/20 font-bold text-sm transition-all hover:bg-white">
                                  <SelectValue placeholder="End Time" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-primary/10">
                                  {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="pt-6 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveDay(day.id)}
                                disabled={!newSchedule.startTime || !newSchedule.endTime}
                                className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                              >
                                <Save className="h-5 w-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingDay(null)
                                  setNewSchedule({ startTime: "", endTime: "", isAvailable: true })
                                }}
                                className="h-12 px-5 rounded-2xl font-bold text-sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-6 flex-1">
                            <Badge
                              variant="secondary"
                              className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg"
                            >
                              Available
                            </Badge>
                            <span className="text-sm font-bold text-slate-600">
                              {day.startTime} - {day.endTime}
                            </span>
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingDay(day.id)
                                  setNewSchedule({
                                    startTime: day.startTime,
                                    endTime: day.endTime,
                                    isAvailable: true,
                                  })
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg">
                          Not Available
                        </Badge>
                      )}
                    </div>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDay(day.id)}
                      >
                        {day.isAvailable ? (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Slots Preview */}
          <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-800">Time Slots Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {schedule
                  .filter((day) => day.isAvailable)
                  .map((day) => (
                    <div key={day.id} className="p-6 bg-white/40 border border-primary/5 rounded-[2rem] shadow-sm group hover:bg-white/60 transition-all duration-500">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-emerald-500" />
                         {day.day}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableSlots(day).map((slot) => (
                          <Badge key={slot} variant="secondary" className="bg-white text-primary border border-primary/5 text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

