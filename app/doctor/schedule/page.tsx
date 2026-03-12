"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
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
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/patients", icon: Users, label: "Patients" },
  { href: "/doctor/schedule", icon: Clock, label: "Schedule" },
  { href: "/doctor/profile", icon: User, label: "Profile" },
]

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

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/api/doctors/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
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

      await fetch("http://localhost:5000/api/doctors/me", {
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">MediCare+</h1>
              <p className="text-xs text-muted-foreground">Doctor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                item.href === "/doctor/schedule"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <Link href="/auth" className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/doctor" className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Schedule Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your availability and working hours
                </p>
              </div>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </>
              )}
            </Button>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Weekly Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
            </CardHeader>
            <CardContent>
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
                          <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                              <Label className="text-xs">Start Time</Label>
                              <Select
                                value={newSchedule.startTime}
                                onValueChange={(value) =>
                                  setNewSchedule({ ...newSchedule, startTime: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Start" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <span className="pt-6">to</span>
                            <div className="flex-1">
                              <Label className="text-xs">End Time</Label>
                              <Select
                                value={newSchedule.endTime}
                                onValueChange={(value) =>
                                  setNewSchedule({ ...newSchedule, endTime: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="End" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSaveDay(day.id)}
                              disabled={
                                !newSchedule.startTime || !newSchedule.endTime
                              }
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingDay(null)
                                setNewSchedule({ startTime: "", endTime: "", isAvailable: true })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 flex-1">
                            <Badge
                              variant="outline"
                              className="bg-success/20 text-success border-success"
                            >
                              Available
                            </Badge>
                            <span className="text-sm text-muted-foreground">
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
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Available Time Slots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule
                  .filter((day) => day.isAvailable)
                  .map((day) => (
                    <div key={day.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3">{day.day}</h3>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableSlots(day).map((slot) => (
                          <Badge key={slot} variant="secondary" className="text-xs">
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

