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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="lg:hidden">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Bed Availability</h1>
              <p className="text-sm text-muted-foreground">
                Real-time bed tracking and management
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Beds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{availableBeds}</p>
                    <p className="text-sm text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Bed className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStats.occupied}</p>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStats.reserved}</p>
                    <p className="text-sm text-muted-foreground">Reserved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalStats.maintenance}</p>
                    <p className="text-sm text-muted-foreground">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Occupancy */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Hospital Occupancy</span>
                <span className="text-sm text-muted-foreground">
                  {totalStats.total > 0 ? Math.round((totalStats.occupied / totalStats.total) * 100) : 0}%
                </span>
              </div>
              <Progress
                value={totalStats.total > 0 ? (totalStats.occupied / totalStats.total) * 100 : 0}
                className="h-3"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>{totalStats.occupied} occupied</span>
                <span>{availableBeds} available</span>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Ward Details</h2>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="icu">ICU</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="pediatric">Pediatric</SelectItem>
                <SelectItem value="maternity">Maternity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ward Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWards.map((ward) => {
              const available = getAvailableBeds(ward)
              const occupancy = getOccupancyPercentage(ward)

              return (
                <Card key={ward._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{ward.name}</CardTitle>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${getTypeColor(ward.type)}`}
                        >
                          {ward.type.charAt(0).toUpperCase() + ward.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${available <= 2
                            ? "text-red-600"
                            : available <= 5
                              ? "text-amber-600"
                              : "text-emerald-600"
                            }`}
                        >
                          {available}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Occupancy</span>
                        <span className="font-medium">{occupancy}%</span>
                      </div>
                      <Progress
                        value={occupancy}
                        className={`h-2 ${occupancy >= 90
                          ? "[&>div]:bg-red-500"
                          : occupancy >= 75
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-emerald-500"
                          }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold">{ward.totalBeds}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <p className="text-xs text-muted-foreground">Occupied</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{ward.occupiedBeds}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "occupiedBeds",
                                  ward.occupiedBeds - 1
                                )
                              }
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "occupiedBeds",
                                  ward.occupiedBeds + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <p className="text-xs text-muted-foreground">Reserved</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{ward.reservedBeds}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "reservedBeds",
                                  ward.reservedBeds - 1
                                )
                              }
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "reservedBeds",
                                  ward.reservedBeds + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">
                          Maintenance
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{ward.maintenanceBeds}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "maintenanceBeds",
                                  ward.maintenanceBeds - 1
                                )
                              }
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() =>
                                handleBedUpdate(
                                  ward._id,
                                  "maintenanceBeds",
                                  ward.maintenanceBeds + 1
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {available <= 2 && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Critical: Low bed availability
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Bed Grid Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Bed Status Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-sm">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-amber-500" />
                  <span className="text-sm">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted-foreground" />
                  <span className="text-sm">Maintenance</span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-3">ICU Beds Visual</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const icuWard = wards.find((w) => w.type === "icu")
                    let color = "bg-emerald-500"
                    if (icuWard) {
                      if (i < icuWard.occupiedBeds) {
                        color = "bg-red-500"
                      } else if (
                        i <
                        icuWard.occupiedBeds + icuWard.reservedBeds
                      ) {
                        color = "bg-amber-500"
                      } else if (
                        i <
                        icuWard.occupiedBeds +
                        icuWard.reservedBeds +
                        icuWard.maintenanceBeds
                      ) {
                        color = "bg-muted-foreground"
                      }
                    }
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded ${color} flex items-center justify-center text-xs text-white font-medium`}
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
