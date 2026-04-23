"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Bed,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  LayoutDashboard,
  Calendar,
  User,
  MessageCircle,
  Hospital,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Ward {
  _id: string
  name: string
  type: "general" | "icu" | "emergency" | "pediatric" | "maternity"
  totalBeds: number
  occupiedBeds: number
  reservedBeds: number
  maintenanceBeds: number
}



import { AdminSidebar } from "@/components/admin-sidebar"

export default function BedsPage() {
  const [wards, setWards] = useState<Ward[]>([])
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    fetchWards()
  }, [])

  const fetchWards = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/wards")
      if (res.ok) {
        const data = await res.json()
        setWards(data)
      }
    } catch (err) {
      console.error("Error fetching wards:", err)
    }
  }

  const filteredWards =
    filterType === "all"
      ? wards
      : wards.filter((w) => w.type === filterType)

  const totalStats = wards.reduce(
    (acc, ward) => ({
      total: acc.total + ward.totalBeds,
      occupied: acc.occupied + ward.occupiedBeds,
      reserved: acc.reserved + ward.reservedBeds,
      maintenance: acc.maintenance + ward.maintenanceBeds,
    }),
    { total: 0, occupied: 0, reserved: 0, maintenance: 0 }
  )

  const availableBeds =
    totalStats.total -
    totalStats.occupied -
    totalStats.reserved -
    totalStats.maintenance

  const getAvailableBeds = (ward: Ward) =>
    ward.totalBeds - ward.occupiedBeds - ward.reservedBeds - ward.maintenanceBeds

  const getOccupancyPercentage = (ward: Ward) =>
    Math.round((ward.occupiedBeds / ward.totalBeds) * 100)

  const getTypeColor = (type: Ward["type"]) => {
    switch (type) {
      case "general":
        return "bg-blue-500/10 text-blue-600 border-blue-200"
      case "icu":
        return "bg-red-500/10 text-red-600 border-red-200"
      case "emergency":
        return "bg-amber-500/10 text-amber-600 border-amber-200"
      case "pediatric":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200"
      case "maternity":
        return "bg-pink-500/10 text-pink-600 border-pink-200"
    }
  }

  const handleBedUpdate = async (
    wardId: string,
    field: keyof Ward,
    value: number
  ) => {
    try {
      const res = await fetch(`http://localhost:5000/api/wards/${wardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: Math.max(0, value) }),
      })
      if (res.ok) {
        fetchWards()
      }
    } catch (err) {
      console.error("Error updating ward:", err)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500">
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/40 hover:bg-white/60 border border-primary/5 shadow-sm rounded-xl transition-all">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-800">Bed Management</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-0.5">
                Real-time facility capacity tracking
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-background/40 backdrop-blur-xl border-primary/5 shadow-lg shadow-primary/5 hover:bg-white/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">{totalStats.total}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Total Beds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 backdrop-blur-xl border-emerald-500/10 shadow-lg shadow-emerald-500/5 hover:bg-white/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">{availableBeds}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mt-0.5">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 backdrop-blur-xl border-red-500/10 shadow-lg shadow-red-500/5 hover:bg-white/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-red-500/10 text-red-600 shadow-inner">
                    <Bed className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">{totalStats.occupied}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70 mt-0.5">Occupied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 backdrop-blur-xl border-amber-500/10 shadow-lg shadow-amber-500/5 hover:bg-white/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">{totalStats.reserved}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/70 mt-0.5">Reserved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-background/40 backdrop-blur-xl border-primary/5 shadow-lg shadow-primary/5 hover:bg-white/40 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-slate-200 text-slate-600 shadow-inner">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight text-slate-800">{totalStats.maintenance}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Occupancy */}
          <Card className="bg-background/40 backdrop-blur-xl border-primary/5 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black uppercase tracking-widest text-slate-800">Overall Hospital Occupancy</span>
                <Badge variant="outline" className="bg-white/60 border-primary/10 text-primary font-black">
                  {totalStats.total > 0 ? Math.round((totalStats.occupied / totalStats.total) * 100) : 0}% Filled
                </Badge>
              </div>
              <Progress
                value={totalStats.total > 0 ? (totalStats.occupied / totalStats.total) * 100 : 0}
                className="h-4 bg-primary/10 rounded-full overflow-hidden"
              />
              <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-80">
                <span>{totalStats.occupied} Occupied</span>
                <span>{availableBeds} Available</span>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <div className="flex justify-between items-center bg-background/40 backdrop-blur-xl p-4 rounded-2xl border border-primary/5 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-slate-800">Ward Operations</h2>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] h-11 bg-white/60 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-xs hover:border-primary/20 hover:bg-white/80 transition-colors">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                <SelectItem value="all" className="text-xs font-bold rounded-lg cursor-pointer">All Wards</SelectItem>
                <SelectItem value="general" className="text-xs font-bold rounded-lg cursor-pointer">General</SelectItem>
                <SelectItem value="icu" className="text-xs font-bold rounded-lg cursor-pointer">ICU</SelectItem>
                <SelectItem value="emergency" className="text-xs font-bold rounded-lg cursor-pointer">Emergency</SelectItem>
                <SelectItem value="pediatric" className="text-xs font-bold rounded-lg cursor-pointer">Pediatric</SelectItem>
                <SelectItem value="maternity" className="text-xs font-bold rounded-lg cursor-pointer">Maternity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ward Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredWards.map((ward) => {
              const available = getAvailableBeds(ward)
              const occupancy = getOccupancyPercentage(ward)

              return (
                <Card key={ward._id} className="bg-background/40 backdrop-blur-xl border-primary/5 hover:bg-white/60 transition-colors shadow-lg shadow-primary/5 flex flex-col">
                  <CardHeader className="pb-4 border-b border-primary/5 bg-white/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-black tracking-tight text-slate-800">{ward.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`mt-1.5 font-bold text-[9px] uppercase tracking-widest border-none px-2 py-0.5 ${getTypeColor(ward.type)}`}
                        >
                          {ward.type.charAt(0).toUpperCase() + ward.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className={`flex items-center justify-center h-10 w-10 rounded-xl shadow-inner ${
                          available <= 2 ? "bg-red-500/10" : available <= 5 ? "bg-amber-500/10" : "bg-emerald-500/10"
                        }`}>
                          <p
                            className={`text-xl font-black ${
                              available <= 2 ? "text-red-600" : available <= 5 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {available}
                          </p>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1 opacity-70">Available</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                        <span>Occupancy</span>
                        <span className={occupancy >= 90 ? "text-red-500" : occupancy >= 75 ? "text-amber-500" : "text-emerald-500"}>{occupancy}%</span>
                      </div>
                      <Progress
                        value={occupancy}
                        className={`h-2.5 bg-primary/10 rounded-full ${occupancy >= 90
                          ? "[&>div]:bg-red-500"
                          : occupancy >= 75
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-emerald-500"
                          }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Total</p>
                        <p className="text-xl font-black text-slate-700">{ward.totalBeds}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex flex-col justify-between group/stat">
                        <p className="text-[9px] font-black uppercase tracking-widest text-red-600/70 mb-0.5">Occupied</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-black text-red-700">{ward.occupiedBeds}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-red-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "occupiedBeds", ward.occupiedBeds - 1)}
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-red-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "occupiedBeds", ward.occupiedBeds + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex flex-col justify-between group/stat">
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-600/70 mb-0.5">Reserved</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-black text-amber-700">{ward.reservedBeds}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-amber-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "reservedBeds", ward.reservedBeds - 1)}
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-amber-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "reservedBeds", ward.reservedBeds + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-col justify-between group/stat">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Maintenance</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-black text-slate-700">{ward.maintenanceBeds}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover/stat:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-slate-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "maintenanceBeds", ward.maintenanceBeds - 1)}
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md hover:bg-white bg-white/50 text-slate-600 shadow-sm"
                              onClick={() => handleBedUpdate(ward._id, "maintenanceBeds", ward.maintenanceBeds + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {available <= 2 && (
                      <div className="flex items-center gap-3 p-3 mt-4 rounded-xl bg-red-50 border border-red-100/50 text-red-600">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest">
                          Critical: Low Capacity
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bed Grid Visualization */}
          <Card className="bg-background/40 backdrop-blur-xl border-primary/5 shadow-lg shadow-primary/5 mb-8">
            <CardHeader className="bg-white/20 border-b border-primary/5 pb-4">
              <CardTitle className="text-base font-black tracking-tight text-slate-800">Capacity Matrix Model</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-6 border-b border-primary/5 pb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-emerald-500 shadow-inner" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-red-500 shadow-inner" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-amber-500 shadow-inner" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-slate-400 shadow-inner" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Maintenance</span>
                </div>
              </div>

              <div className="mt-6 p-5 bg-white/40 border border-primary/5 rounded-xl shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">ICU Capacity Matrix</p>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const icuWard = wards.find((w) => w.type === "icu")
                    let color = "bg-emerald-500 shadow-emerald-500/20"
                    if (icuWard) {
                      if (i < icuWard.occupiedBeds) {
                        color = "bg-red-500 shadow-red-500/20"
                      } else if (
                        i <
                        icuWard.occupiedBeds + icuWard.reservedBeds
                      ) {
                        color = "bg-amber-500 shadow-amber-500/20"
                      } else if (
                        i <
                        icuWard.occupiedBeds +
                        icuWard.reservedBeds +
                        icuWard.maintenanceBeds
                      ) {
                        color = "bg-slate-400 shadow-slate-400/20"
                      }
                    }
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-xl ${color} flex items-center justify-center text-[10px] text-white font-black shadow-lg transition-transform hover:scale-110 cursor-default`}
                      >
                        {i + 1}
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
