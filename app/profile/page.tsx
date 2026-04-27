"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { AppNavigation } from "@/components/app-navigation"
import Link from "next/link"
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
  History,
  Upload,
  Printer,
  Download,
  Activity,
  Key,
  Lock,
  Globe,
  Languages,
  Moon,
  Sun,
  Monitor,
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
import { useReactToPrint } from "react-to-print"
import { useRef } from "react"
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


// stats are now handled inside the component to be dynamic

// Menu items are now built dynamically in the component to show counts

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
  const [counts, setCounts] = useState({
    appointments: 0,
    emergencies: 0,
    reports: 0
  })
  const [records, setRecords] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [appLanguage, setAppLanguage] = useState("English")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const allRecordsPrintRef = useRef<HTMLDivElement>(null)

  const handlePrintAll = useReactToPrint({
    contentRef: allRecordsPrintRef,
    documentTitle: `${userProfile.name}_Medical_History`
  })

  const menuItems = [
    { icon: User, label: "Personal Information", onClick: () => setIsEditing(true) },
    { icon: Lock, label: "Privacy & Security", onClick: () => setIsPrivacyOpen(true) },
    { icon: FileText, label: `Medical Reports (${counts.reports})`, href: "/history?tab=reports" },
    { icon: History, label: `Emergency History (${counts.emergencies})`, href: "/history?tab=emergencies" },
    { icon: Settings, label: "App Settings", onClick: () => setIsSettingsOpen(true) },
  ]

  const stats = [
    { label: "Appointments", value: counts.appointments.toString(), icon: Calendar },
    { label: "Emergencies", value: counts.emergencies.toString(), icon: Heart },
    { label: "Reports", value: counts.reports.toString(), icon: FileText },
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
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

        const headers = { Authorization: `Bearer ${token}` }
        
        // Fetch Counts for Stats
        const [resRecords, resEmergencies, resAppointments] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/my`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/emergencies/my/${data._id || data.id}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/my`, { headers })
        ])

        const newCounts = { ...counts }
        if (resRecords.ok) {
          const recordsData = await resRecords.json()
          setRecords(recordsData)
          newCounts.reports = recordsData.length
        }
        if (resEmergencies.ok) newCounts.emergencies = (await resEmergencies.json()).length
        if (resAppointments.ok) newCounts.appointments = (await resAppointments.json()).length
        
        setCounts(newCounts)
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/generate-abha`, {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading("Processing document...")
    
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const fileData = await res.json()
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            diagnosis: `Self Upload: ${fileData.name}`,
            attachments: [fileData]
          })
        })

        if (createRes.ok) {
          toast.success("Medical document added to your history", { id: toastId })
          fetchProfile() // Refresh counts
        } else {
          toast.error("Failed to link document to profile", { id: toastId })
        }
      } else {
        toast.error("Upload failed", { id: toastId })
      }
    } catch (error) {
      console.error("Upload error", error)
      toast.error("An error occurred during upload", { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/avatar`, {
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
        {/* Premium Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent h-64 -z-10" />
          
          <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-800">Account Profile</h1>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Personal Health Identity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md">
                  Verified Patient
                </Badge>
              </div>
            </div>
          </header>

          <div className="px-6 py-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl scale-100 group-hover:scale-105 transition-transform duration-300">
                  <AvatarImage
                    src={userProfile.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${userProfile.profileImage}` : ""}
                    alt={userProfile.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                    {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "RS"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="profile-upload"
                  className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all"
                  title="Update Profile Picture"
                >
                  <Camera className="h-5 w-5" />
                  <input
                    id="profile-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>

              <div className="text-center md:text-left space-y-1 pb-2">
                <h2 className="text-3xl font-extrabold tracking-tight">{userProfile.name || "Patient Name"}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {userProfile.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {userProfile.memberSince}
                  </span>
                </div>
              </div>

              <div className="md:ml-auto flex flex-col items-center md:items-end gap-3 pb-2">
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button onClick={openEdit} className="gap-2 shadow-lg">
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Personal Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" value={formData.email} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Residential Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="City, Country"
                        />
                      </div>
                      <Button className="w-full mt-4" onClick={handleUpdateProfile}>
                        Apply Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 space-y-8">
          {/* Floating Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm group hover:bg-primary/5 transition-colors duration-300">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Essential Info */}
            <div className="lg:col-span-8 space-y-8">
              {/* Health Identity */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Health Identity</h3>
                </div>
                <Card className="overflow-hidden border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-primary/60 font-medium">ABHA Health ID Number</p>
                        <p className="text-2xl font-mono font-bold tracking-tighter text-primary">
                          {userProfile.healthId}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {userProfile.healthId === "Not Linked" || !userProfile.healthId ? (
                          <Button 
                            className="bg-primary hover:bg-primary/90 text-white px-8"
                            onClick={handleGenerateAbha}
                            disabled={isGeneratingAbha}
                          >
                            {isGeneratingAbha ? "Linking..." : "Link ABHA ID"}
                          </Button>
                        ) : (
                          <Badge className="bg-primary text-white px-4 py-1.5 text-sm">
                            Verified Identity
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Personal Details Dashboard */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Personal Details</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase">Phone Number</p>
                        <p className="font-semibold">{userProfile.phone || "Not Provided"}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase">Residential Address</p>
                        <p className="font-semibold">{userProfile.address || "Not Provided"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Notification Preferences */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">App Preferences</h3>
                </div>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {[
                      { key: 'appointments', label: 'Appointment Reminders', desc: 'Alerts for upcoming consultations' },
                      { key: 'emergencies', label: 'Emergency Alerts', desc: 'Critical alerts and health SOS updates' },
                      { key: 'healthTips', label: 'Health Insights', desc: 'Daily wellness tips and personalized advice' },
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between p-4 px-6 hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-semibold">{pref.label}</p>
                          <p className="text-xs text-muted-foreground">{pref.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[pref.key as keyof typeof notifications]}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [pref.key]: checked })
                          }
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column: Quick Links & Actions */}
            <div className="lg:col-span-4 space-y-8">
              {/* Functional Quick Actions */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    className="w-full justify-start gap-3 h-12 bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Activity className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                    <span className="font-semibold">{uploading ? "Uploading..." : "Upload Medical Document"}</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 hover:bg-muted/50 transition-all border-dashed border-2"
                    onClick={handlePrintAll}
                  >
                    <Printer className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">Export Health History (PDF)</span>
                  </Button>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Access</h3>
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col">
                      {menuItems.map((item) => {
                        const Content = (
                          <div className="flex items-center justify-between p-4 px-5 hover:bg-primary/5 transition-all group border-b last:border-0 cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                          </div>
                        )

                        return item.href ? (
                          <Link key={item.label} href={item.href}>
                            {Content}
                          </Link>
                        ) : (
                          <div key={item.label} onClick={item.onClick}>
                            {Content}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Privacy & Security Dialog */}
              <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Privacy & Security
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Password Management</h4>
                      <Button variant="outline" className="w-full justify-between">
                        <span>Change Account Password</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Account Security</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Two-Factor Authentication</Label>
                          <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Biometric Login</Label>
                          <p className="text-xs text-muted-foreground">Use FaceID or Fingerprint</p>
                        </div>
                        <Switch checked />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Data Privacy</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Share Health Data</Label>
                          <p className="text-xs text-muted-foreground">Allow research and insights</p>
                        </div>
                        <Switch />
                      </div>
                    </div>

                    <Button className="w-full mt-2" onClick={() => setIsPrivacyOpen(false)}>Close Settings</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* App Settings Dialog */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Application Settings
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Appearance</h4>
                      <div className="flex items-center justify-between bg-muted/30 p-1 rounded-lg">
                        <Button 
                          variant={theme === 'light' ? 'secondary' : 'ghost'} 
                          className="flex-1 gap-1 h-8 text-xs"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-3.5 w-3.5" /> Light
                        </Button>
                        <Button 
                          variant={theme === 'dark' ? 'secondary' : 'ghost'} 
                          className="flex-1 gap-1 h-8 text-xs"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-3.5 w-3.5" /> Dark
                        </Button>
                        <Button 
                          variant={theme === 'system' ? 'secondary' : 'ghost'} 
                          className="flex-1 gap-1 h-8 text-xs"
                          onClick={() => setTheme('system')}
                        >
                          <Monitor className="h-3.5 w-3.5" /> System
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Region & Language</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                             <Languages className="h-4 w-4" /> App Language
                          </Label>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => toast.info("Language selection coming soon!")}>
                            {appLanguage}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-2">
                             <Globe className="h-4 w-4" /> Units of Measure
                          </Label>
                          <Badge variant="outline">Metric (kg, cm)</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Data Management</h4>
                      <Button variant="outline" className="w-full text-destructive border-destructive/10 hover:bg-destructive/5 gap-2">
                        Clear local cache & session
                      </Button>
                    </div>

                    <Button className="w-full mt-2" onClick={() => setIsSettingsOpen(false)}>Save & Exit</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Sign Out Card */}
              <Card className="border-destructive/10 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-xs text-destructive/60 font-medium uppercase mb-3">Account Security</p>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Securely Sign Out
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center px-4">
                <p className="text-xs text-muted-foreground">
                   MediCare+ Healthcare v2.4.0 <br/>
                  Secure Patient Portal • 2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Print Container for Export */}
        <div className="hidden">
          <div ref={allRecordsPrintRef} className="p-10 space-y-8 bg-white text-slate-900 min-h-screen">
            <div className="flex justify-between items-start pb-8 border-b-2 border-primary">
              <div>
                <h1 className="text-4xl font-bold text-primary flex items-center gap-2">
                  MediCare+
                </h1>
                <p className="text-xl font-bold text-slate-800 mt-2">Comprehensive Patient Health Record</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">Generated On</p>
                <p>{new Date().toLocaleDateString('en-GB')}</p>
                <p>{new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Patient Details</p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                  <p className="text-slate-600">{userProfile.email}</p>
                  <p className="text-slate-600">{userProfile.phone}</p>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Digital Healthcare Account</p>
                <div className="space-y-1">
                  <p className="text-slate-600">ABHA Health ID</p>
                  <p className="text-2xl font-mono font-bold tracking-tighter text-primary">{userProfile.healthId}</p>
                  <p className="text-xs text-slate-500">Verified Patient Identity</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                <History className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Medical Activity Summary</h3>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 rounded-xl border bg-slate-50 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase">Total Appointments</p>
                  <p className="text-3xl font-bold mt-1">{counts.appointments}</p>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase">Emergency SOS events</p>
                  <p className="text-3xl font-bold mt-1">{counts.emergencies}</p>
                </div>
                <div className="p-4 rounded-xl border bg-slate-50 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase">Stored Reports</p>
                  <p className="text-3xl font-bold mt-1">{counts.reports}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-bold text-lg text-slate-800">Recent Medical Records</h4>
                {records.length > 0 ? (
                  <div className="space-y-6">
                    {records.map((record, index) => (
                      <div key={record._id} className="p-5 border rounded-xl bg-white space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">Case #{index + 1}</span>
                            <h5 className="text-lg font-bold mt-1">{record.diagnosis}</h5>
                          </div>
                          <p className="text-sm font-mono font-bold text-slate-500">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                          <p><strong>Treating Physician:</strong> {record.doctor?.user?.name || "Self-Uploaded"}</p>
                          <p><strong>Medical Facility:</strong> {record.appointment?.hospital?.name || record.hospital?.name || "N/A"}</p>
                        </div>
                        {record.medicines && record.medicines.length > 0 && (
                          <div className="pt-2 border-t text-sm">
                            <p className="font-bold mb-2">Prescribed Regimen:</p>
                            <div className="flex flex-wrap gap-2">
                              {record.medicines.map((m: any, i: number) => (
                                <span key={i} className="bg-slate-100 px-3 py-1 rounded-full text-xs font-medium border">
                                  {m.name} ({m.dosage})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic py-10 text-center border-2 border-dashed rounded-xl">No medical records found in the digital vault.</p>
                )}
              </div>
            </div>

            <div className="pt-20 text-center space-y-2 border-t border-slate-200 mt-auto">
              <p className="text-xs font-bold text-slate-400">OFFICIAL HEALTH SUMMARY • GENERATED VIA MEDICARE+ SECURE PORTAL</p>
              <p className="text-[10px] text-slate-300">This document is a digital compilation of verified healthcare interactions and patient-uploaded records. QR code for verification available in the Digital Health Card section.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
