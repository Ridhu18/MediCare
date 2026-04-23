"use client"

import { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Shield, 
  Bell,
  Camera,
  Save,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Hospital,
  Stethoscope,
  Bed,
  ChevronRight,
  Activity,
  Key,
  Globe,
  Languages
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })
  const [adminStats, setAdminStats] = useState({
    hospitals: 0,
    doctors: 0,
    beds: 0
  })

  useEffect(() => {
    fetchProfileAndStats()
  }, [])

  const fetchProfileAndStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const [userRes, docRes, hospRes] = await Promise.all([
        fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/doctors", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/hospitals", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (userRes.ok) {
        const data = await userRes.json()
        setUser(data)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || ""
        })
        
        // Filter stats if admin is assigned to specific hospitals
        const adminHospitalIds = data.hospitalIds || []
        
        let docsCount = 0
        if (docRes.ok) {
          const docs = await docRes.json()
          docsCount = adminHospitalIds.length > 0 
            ? docs.filter((d: any) => d.hospitals?.some((h: any) => adminHospitalIds.includes(h._id))).length
            : docs.length
        }

        let hospCount = 0
        if (hospRes.ok) {
          const hosps = await hospRes.json()
          hospCount = adminHospitalIds.length > 0
            ? hosps.filter((h: any) => adminHospitalIds.includes(h.id || h._id)).length
            : hosps.length
        }

        setAdminStats({
          hospitals: hospCount,
          doctors: docsCount,
          beds: hospCount * 50 // Mocking bed count logic
        })
      }
    } catch (e) {
      console.error("Error fetching data:", e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const updatedUser = await res.json()
        setUser(updatedUser)
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (e) {
      console.error("Error updating profile:", e)
      toast.error("An error occurred")
    } finally {
      setIsSaving(false)
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUser((prev: any) => ({ ...prev, profileImage: data.profileImage }))
        toast.success("Profile picture updated")
      }
    } catch (error) {
      toast.error("Failed to upload image")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AdminSidebar />

      <main className="flex-1 overflow-auto relative bg-slate-50/50 dark:bg-slate-950/20 md:ml-20 lg:ml-64 transition-all duration-500 min-h-screen">
        {/* Premium Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent h-64 -z-10" />
          
          <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.25rem] bg-emergency/10 flex items-center justify-center text-emergency shadow-sm ring-1 ring-emergency/5">
                <Settings className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-none">Admin Console Settings</h1>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">Control Center Identity </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <Badge variant="secondary" className="hidden md:flex bg-primary/5 text-primary border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                 Verified Administrator
               </Badge>
               <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                 <AvatarImage src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : ""} className="object-cover" />
                 <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                   {user?.name ? user.name.split(" ").map((n: any) => n[0]).join("") : "A"}
                 </AvatarFallback>
               </Avatar>
            </div>
          </div>
        </header>

          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl scale-100 group-hover:scale-105 transition-transform duration-500 rounded-full">
                <AvatarImage
                  src={user?.profileImage ? `http://localhost:5000${user.profileImage}` : ""}
                  alt={user?.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-black rounded-full">
                  {user?.name ? user.name.split(" ").map((n: any) => n[0]).join("") : "A"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="admin-profile-upload"
                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all ring-4 ring-background"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="admin-profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="text-center md:text-left space-y-2 pb-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100 italic">{user?.name || "Administrator"}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Full System Access
                </span>
              </div>
            </div>
              <div className="md:ml-auto pb-4">
                <Button onClick={handleUpdateProfile} disabled={isSaving} className="gap-2 h-12 px-8 font-black uppercase tracking-widest text-xs bg-primary shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 space-y-8">
          {/* Admin Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-primary/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest dark:text-slate-400">Managed Hospitals</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">{adminStats.hospitals}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Hospital className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-emerald-500/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest dark:text-slate-400">Registered Doctors</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">{adminStats.doctors}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Stethoscope className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-amber-500/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest dark:text-slate-400">Available Beds</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">{adminStats.beds}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Bed className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Essential Settings */}
            <div className="lg:col-span-8 space-y-8">
              {/* Personal Information */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Account Details</h3>
                </div>
                <Card className="border-primary/5 bg-background/40 dark:bg-white/5 backdrop-blur-xl shadow-sm rounded-[2rem]">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white dark:hover:bg-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white dark:hover:bg-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Office Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="pl-10 h-12 bg-white/50 dark:bg-white/5 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white dark:hover:bg-white/10"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Theme Selection */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Sun className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Interface Appearance</h3>
                </div>
                <Card className="border-primary/5 bg-background/40 dark:bg-white/5 backdrop-blur-xl shadow-sm rounded-[2rem]">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      <div>
                        <p className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">System Theme</p>
                        <p className="text-xs text-muted-foreground font-bold dark:text-slate-400">Customize how MediCare+ looks on your device</p>
                      </div>
                      <div className="flex items-center gap-3 bg-primary/5 p-2 rounded-[2rem] border border-primary/10 shadow-inner">
                        <Button 
                          variant={theme === 'light' ? 'default' : 'ghost'} 
                          onClick={() => setTheme('light')}
                          className={cn(
                            "gap-2 rounded-[1.5rem] px-6 h-11 text-[10px] font-black uppercase tracking-widest transition-all",
                            theme === 'light' ? "bg-white text-primary shadow-lg hover:bg-white" : "text-slate-500 dark:text-slate-400 hover:bg-primary/5"
                          )}
                        >
                          <Sun className="h-4 w-4" />
                          Light
                        </Button>
                        <Button 
                          variant={theme === 'dark' ? 'default' : 'ghost'} 
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "gap-2 rounded-[1.5rem] px-6 h-11 text-[10px] font-black uppercase tracking-widest transition-all",
                            theme === 'dark' ? "bg-slate-900 text-white shadow-lg hover:bg-slate-900" : "text-slate-500 dark:text-slate-400 hover:bg-primary/5"
                          )}
                        >
                          <Moon className="h-4 w-4" />
                          Dark
                        </Button>
                        <Button 
                          variant={theme === 'system' ? 'default' : 'ghost'} 
                          onClick={() => setTheme('system')}
                          className={cn(
                            "gap-2 rounded-[1.5rem] px-6 h-11 text-[10px] font-black uppercase tracking-widest transition-all",
                            theme === 'system' ? "bg-primary text-white shadow-lg  hover:bg-primary" : "text-slate-500 dark:text-slate-400 hover:bg-primary/5"
                          )}
                        >
                          <Monitor className="h-4 w-4" />
                          System
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column: Quick Links & Security */}
            <div className="lg:col-span-4 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Security Actions</h3>
                </div>
                <div className="space-y-4">
                  <Card className="border-primary/5 bg-background/40 backdrop-blur-xl group cursor-pointer hover:bg-primary/5 transition-all rounded-[2rem]">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Change Password</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest dark:text-slate-400">Secure Credentials</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                  <Card className="border-primary/5 bg-background/40 backdrop-blur-xl group cursor-pointer hover:bg-emerald-500/5 transition-all rounded-[2rem]">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">2FA Settings</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest dark:text-slate-400">Dual Protection</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">ACTIVE</Badge>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4 px-1">
                  <Settings className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-100">Quick Access</h3>
                </div>
                <Card className="border-primary/5 bg-background/40 backdrop-blur-xl overflow-hidden shadow-sm rounded-[2rem]">
                  <CardContent className="p-0">
                    <div className="divide-y divide-primary/5">
                      {[
                        { icon: Activity, label: "System Health", val: "Optimal" },
                        { icon: Globe, label: "Region & units", val: "Metric" },
                        { icon: Languages, label: "App Language", val: "English" },
                        { icon: Bell, label: "Notification Log", val: "None" }
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between p-5 hover:bg-white dark:hover:bg-white/5 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                              <item.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{item.label}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <div className="pt-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                  MediCare+ Admin Console v2.5.1
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
