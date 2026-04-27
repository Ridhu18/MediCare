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
  Save,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Camera,
  Heart,
  Star,
  Shield,
  Loader2,
  FileText,
  Settings,
  Sun,
  Moon,
  Monitor,
  Activity,
  Key,
  Globe,
  Languages
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTheme } from "next-themes"

// Removed inline navItems

export default function DoctorProfile() {
  const { theme, setTheme } = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    specialization: "",
    experience: 0,
    qualification: "",
    licenseNumber: "",
    address: "",
    bio: "",
    profileImage: "",
  })
  const [stats, setStats] = useState({
    totalAppointments: 0,
    uniquePatients: 0,
    rating: 4.8
  })

  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchProfileAndStats()
  }, [])

  const fetchProfileAndStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const [profileRes, apptRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments/doctor`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile({
          name: data.user?.name || "",
          email: data.user?.email || "",
          phone: data.user?.phone || "",
          department: data.department || "Cardiology",
          specialization: data.specialization || "",
          experience: parseInt(data.experience) || 0,
          qualification: data.qualification || "",
          licenseNumber: data.licenseNumber || "",
          address: data.address || "",
          bio: data.bio || "",
          profileImage: data.user?.profileImage || "",
        })
      }

      if (apptRes.ok) {
        const appts = await apptRes.json()
        setStats({
          totalAppointments: appts.length,
          uniquePatients: new Set(appts.map((a: any) => a.patient?.email)).size,
          rating: 4.8 // Mocking rating
        })
      }
    } catch (error) {
      console.error("Error fetching data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setIsEditing(false)
        toast.success("Profile updated successfully")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (e) {
      console.error("Error updating profile", e)
      toast.error("Error updating profile")
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(prev => ({ ...prev, profileImage: data.profileImage }))
        toast.success("Profile picture updated")
      } else {
        toast.error("Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Error uploading image")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <DoctorSidebar />

      {/* Main Content */}
      <main className="relative z-10 md:ml-20 lg:ml-64 transition-all duration-500 bg-slate-50/50 dark:bg-slate-950/20 min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent h-96 -z-10" />

        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[1.25rem] bg-emergency/10 flex items-center justify-center text-emergency shadow-sm ring-1 ring-emergency/5">
                <User className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">Physician Profile</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-80">Professional Identity Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden md:flex bg-emerald-500/5 text-emerald-600 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                Verified Specialist
              </Badge>
              <Avatar className="h-9 w-9 border-2 border-background shadow-md">
                <AvatarImage src={profile.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${profile.profileImage}` : ""} className="object-cover" />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                  {profile.name ? profile.name.split(" ").map(n => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase tracking-widest">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest px-6">
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Changes
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="gap-2 bg-primary shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest px-6">
                  Edit Professional Profile
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="px-6 py-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-2xl scale-100 group-hover:scale-105 transition-transform duration-500 rounded-full">
                <AvatarImage
                  src={profile.profileImage ? `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${profile.profileImage}` : ""}
                  alt={profile.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-black rounded-full">
                  {profile.name ? profile.name.split(" ").map(n => n[0]).join("") : "DR"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-upload-physician"
                className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all ring-4 ring-background"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="profile-upload-physician"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <div className="text-center md:text-left space-y-2 pb-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <h2 className="text-3xl font-black tracking-tight text-slate-800 italic">Dr. {profile.name || "Physician"}</h2>
                 <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest py-0.5 px-2">
                   {profile.department}
                 </Badge>
              </div>
              <p className="text-base font-bold text-muted-foreground opacity-80">{profile.specialization || "Medical Specialist"}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-xs font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Council Registered
                </span>
                <span className="flex items-center gap-2">
                   <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                   {stats.rating} Patient Rating
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-20 space-y-10">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-primary/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-7 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Consultations</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 group-hover:text-primary transition-colors">{stats.totalAppointments}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Calendar className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-emerald-500/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-7 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Unique Patients</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 group-hover:text-emerald-600 transition-colors">{stats.uniquePatients}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Users className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-xl group hover:bg-amber-500/5 transition-all duration-500 rounded-[2rem]">
              <CardContent className="p-7 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Years of Practice</p>
                  <p className="text-3xl font-black mt-1 text-slate-800 group-hover:text-amber-600 transition-colors">{profile.experience}+</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Briefcase className="h-7 w-7" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-8 space-y-10">
              {/* Personal Section */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 px-1">
                  <User className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Identity Details</h3>
                </div>
                <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            disabled={!isEditing}
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Connect Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            disabled={!isEditing}
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Residential/Office Location</Label>
                         <div className="relative">
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                           <Input
                             disabled={!isEditing}
                             value={profile.address}
                             onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                             className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                           />
                         </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Professional Section */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 px-1">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Professional Credentials</h3>
                </div>
                <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Medical Department</Label>
                        {isEditing ? (
                          <Select
                            value={profile.department}
                            onValueChange={(value) => setProfile({ ...profile, department: value })}
                          >
                            <SelectTrigger className="h-12 bg-white/50 border-primary/10 rounded-2xl focus:ring-primary/20 font-bold text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-primary/10">
                              <SelectItem value="Cardiology">Cardiology</SelectItem>
                              <SelectItem value="Neurology">Neurology</SelectItem>
                              <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                              <SelectItem value="Emergency">Emergency</SelectItem>
                              <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                            <Input value={profile.department} disabled className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl font-bold text-sm opacity-80" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Core Specialization</Label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            disabled={!isEditing}
                            value={profile.specialization}
                            onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                            className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Top Academic Qualification</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            disabled={!isEditing}
                            value={profile.qualification}
                            onChange={(e) => setProfile({ ...profile, qualification: e.target.value })}
                            className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Medical License ID</Label>
                        <div className="relative">
                          <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                          <Input
                            disabled={!isEditing}
                            value={profile.licenseNumber}
                            onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })}
                            className="pl-10 h-12 bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Biography</Label>
                      <Textarea
                        disabled={!isEditing}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={5}
                        className="bg-white/50 border-primary/10 rounded-2xl focus-visible:ring-primary/20 font-bold text-sm transition-all hover:bg-white disabled:opacity-80 disabled:cursor-not-allowed resize-none italic leading-relaxed"
                        placeholder="Share your medical journey and expertise..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column: Actions & Prefs */}
            <div className="lg:col-span-4 space-y-10">
               {/* Appearance */}
               <section className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <Sun className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Interface Theme</h3>
                  </div>
                  <Card className="border-primary/5 bg-background/40 backdrop-blur-xl shadow-sm rounded-3xl p-2">
                    <CardContent className="p-2">
                       <div className="grid grid-cols-3 gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTheme('light')}
                            className={cn(
                              "flex-col gap-2 h-20 rounded-2xl text-[9px] font-black uppercase transition-all",
                              theme === 'light' ? "bg-white text-primary shadow-md hover:bg-white" : "text-slate-400 hover:bg-white/50"
                            )}
                          >
                             <Sun className="h-5 w-5" />
                             Light
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTheme('dark')}
                            className={cn(
                              "flex-col gap-2 h-20 rounded-2xl text-[9px] font-black uppercase transition-all",
                              theme === 'dark' ? "bg-slate-900 text-white shadow-md hover:bg-slate-900" : "text-slate-400 hover:bg-white/50"
                            )}
                          >
                             <Moon className="h-5 w-5" />
                             Dark
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTheme('system')}
                            className={cn(
                              "flex-col gap-2 h-20 rounded-2xl text-[9px] font-black uppercase transition-all",
                              theme === 'system' ? "bg-primary text-white shadow-md hover:bg-primary" : "text-slate-400 hover:bg-white/50"
                            )}
                          >
                             <Monitor className="h-5 w-5" />
                             System
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
               </section>

               {/* Quick Links */}
               <section className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <Settings className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Security & Privacy</h3>
                  </div>
                  <div className="space-y-4">
                    <Card className="border-primary/5 bg-background/40 backdrop-blur-xl group cursor-pointer hover:bg-primary/5 transition-all rounded-2xl overflow-hidden">
                      <CardContent className="p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <Key className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800 tracking-tight">Access Credentials</p>
                               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Update Password</p>
                            </div>
                         </div>
                         <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                    <Card className="border-primary/5 bg-background/40 backdrop-blur-xl group cursor-pointer hover:bg-emerald-500/5 transition-all rounded-2xl overflow-hidden">
                      <CardContent className="p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:rotate-12 transition-transform">
                               <Shield className="h-5 w-5" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-slate-800 tracking-tight">Privacy Settings</p>
                               <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Data Visibility</p>
                            </div>
                         </div>
                         <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </CardContent>
                    </Card>
                  </div>
               </section>

               {/* App Summary */}
               <Card className="border-none bg-gradient-to-br from-primary to-primary-foreground p-0 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/20">
                  <CardContent className="p-8 text-white space-y-6">
                     <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Heart className="h-8 w-8 text-white fill-white animate-pulse" />
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-2xl font-black italic tracking-tighter">Practicing with Care</h4>
                        <p className="text-xs font-bold text-white/70 leading-relaxed">
                          Your profile is active and visible to all hospitals you are associated with. Keep your license data updated to ensure seamless emergency response.
                        </p>
                     </div>
                     <Button variant="outline" className="w-full h-12 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary font-black uppercase tracking-widest text-[10px] transition-all">
                        View Public Profile
                     </Button>
                  </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
