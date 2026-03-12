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
  Save,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Camera,
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

const navItems = [
  { href: "/doctor", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/doctor/appointments", icon: Calendar, label: "Appointments" },
  { href: "/doctor/patients", icon: Users, label: "Patients" },
  { href: "/doctor/schedule", icon: Clock, label: "Schedule" },
  { href: "/doctor/profile", icon: User, label: "Profile" },
]

export default function DoctorProfile() {
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

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("http://localhost:5000/api/doctors/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
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
      } catch (error) {
        console.error("Error fetching profile", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/doctors/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      })
      if (res.ok) {
        setIsEditing(false)
        alert("Profile updated successfully")
      } else {
        alert("Failed to update profile")
      }
    } catch (e) {
      console.error("Error updating profile", e)
      alert("Error updating profile")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/auth/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(prev => ({ ...prev, profileImage: data.profileImage }))
        alert("Profile picture updated")
      } else {
        alert("Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("Error uploading image")
    }
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
                item.href === "/doctor/profile"
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
                <h1 className="text-2xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your profile information
                </p>
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </header>

        <div className="px-6 py-6 space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-background shadow-xl">
                    <AvatarImage
                      src={profile.profileImage ? `http://localhost:5000${profile.profileImage}` : ""}
                      alt={profile.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl uppercase">
                      {profile.name ? profile.name.split(" ").map(n => n[0]).join("") : "DR"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="profile-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
                  <p className="text-muted-foreground mb-4">{profile.specialization}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{profile.department}</Badge>
                    <Badge variant="outline">{profile.experience} years experience</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {profile.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {isEditing ? (
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile.phone}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  {isEditing ? (
                    <Input
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {profile.address}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  {isEditing ? (
                    <Select
                      value={profile.department}
                      onValueChange={(value) =>
                        setProfile({ ...profile, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {profile.department}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  {isEditing ? (
                    <Input
                      value={profile.specialization}
                      onChange={(e) =>
                        setProfile({ ...profile, specialization: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.specialization}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={profile.experience}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          experience: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  ) : (
                    <p className="text-sm py-2">{profile.experience} years</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  {isEditing ? (
                    <Input
                      value={profile.qualification}
                      onChange={(e) =>
                        setProfile({ ...profile, qualification: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      {profile.qualification}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  {isEditing ? (
                    <Input
                      value={profile.licenseNumber}
                      onChange={(e) =>
                        setProfile({ ...profile, licenseNumber: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm py-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      {profile.licenseNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                  />
                ) : (
                  <p className="text-sm py-2">{profile.bio}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

