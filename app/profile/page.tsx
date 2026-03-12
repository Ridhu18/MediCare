"use client"

import { useState, useEffect } from "react"
import { AppNavigation } from "@/components/app-navigation"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Camera,
  Settings,
  FileText,
  Heart,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { toast } from "sonner"

const initialState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  healthId: "",
  memberSince: "",
  profileImage: "",
}


const stats = [
  { label: "Appointments", value: "12", icon: Calendar },
  { label: "Emergencies", value: "2", icon: Heart },
  { label: "Reports", value: "8", icon: FileText },
]

const menuItems = [
  { icon: User, label: "Personal Information", href: "#" },
  { icon: Shield, label: "Privacy & Security", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: FileText, label: "Medical Reports", href: "#" },
  { icon: Settings, label: "App Settings", href: "#" },
]

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState(initialState)
  const [formData, setFormData] = useState(initialState)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isGeneratingAbha, setIsGeneratingAbha] = useState(false)
  const [notifications, setNotifications] = useState({
    appointments: true,
    emergencies: true,
    healthTips: false,
    promotions: false,
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const date = new Date(data.createdAt || Date.now())
        const memberSince = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })

        setUserProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          healthId: data.healthId || "Not Linked",
          memberSince,
          profileImage: data.profileImage || "",
        })
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          healthId: data.healthId || "",
          memberSince,
          profileImage: data.profileImage || "",
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile", error)
      toast.error("Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")

      const data = await response.json()
      setUserProfile((prev) => ({
        ...prev,
        name: data.name,
        phone: data.phone,
        address: data.address,
      }))

      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }

  const openEdit = () => {
    setIsEditing(true)
  }

  const handleGenerateAbha = async () => {
    try {
      setIsGeneratingAbha(true)
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/auth/generate-abha", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to generate ABHA ID")

      const data = await response.json()

      setUserProfile((prev) => ({
        ...prev,
        healthId: data.healthId,
      }))
      setFormData((prev) => ({
        ...prev,
        healthId: data.healthId,
      }))

      toast.success("ABHA Health ID generated successfully")
    } catch (error) {
      toast.error("Failed to generate ABHA Health ID")
    } finally {
      setIsGeneratingAbha(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/auth/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload image")

      const data = await response.json()
      setUserProfile((prev) => ({
        ...prev,
        profileImage: data.profileImage,
      }))
      toast.success("Profile picture updated")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload profile picture")
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Profile
              </h1>
              <p className="text-sm text-muted-foreground">Manage your account settings</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={userProfile.profileImage ? `http://localhost:5000${userProfile.profileImage}` : ""}
                          alt={userProfile.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                          {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "RS"}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="profile-upload"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="profile-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                    <h2 className="text-xl font-semibold mt-4">{userProfile.name}</h2>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    <Badge variant="outline" className="mt-2">
                      Member since {userProfile.memberSince}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    {stats.map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                          <stat.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-semibold mt-2">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Health ID */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">ABHA Health ID</p>
                        <p className="font-mono font-medium">{userProfile.healthId}</p>
                      </div>
                    </div>
                    {(userProfile.healthId === "Not Linked" || !userProfile.healthId) && (
                      <Button
                        size="sm"
                        onClick={handleGenerateAbha}
                        disabled={isGeneratingAbha}
                      >
                        {isGeneratingAbha ? "Generating..." : "Generate"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={openEdit}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Full Name</Label>
                            <Input
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input value={formData.email} disabled className="bg-muted" />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                              }
                            />
                          </div>
                          <Button className="w-full" onClick={handleUpdateProfile}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{userProfile.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{userProfile.address}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Appointment Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about upcoming appointments
                      </p>
                    </div>
                    <Switch
                      checked={notifications.appointments}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, appointments: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Emergency Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Critical health and emergency notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emergencies}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emergencies: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Health Tips</p>
                      <p className="text-sm text-muted-foreground">
                        Daily health tips and reminders
                      </p>
                    </div>
                    <Switch
                      checked={notifications.healthTips}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, healthTips: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Promotional Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Offers and health camps near you
                      </p>
                    </div>
                    <Switch
                      checked={notifications.promotions}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, promotions: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Menu Items */}
              <Card>
                <CardContent className="p-0">
                  {menuItems.map((item, index) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Logout */}
              <Button variant="outline" className="w-full text-destructive hover:text-destructive bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
