"use client"

import { useState } from "react"
import {
  QrCode,
  User,
  Droplets,
  Heart,
  AlertTriangle,
  Pill,
  Download,
  Share2,
  Edit2,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { toPng } from "html-to-image"
import { QRCodeSVG } from "qrcode.react"
interface MedicalProfile {
  name: string
  dateOfBirth: string
  bloodGroup: string
  weight: string
  height: string
  allergies: string[]
  medications: string[]
  conditions: string[]
  emergencyContacts: {
    name: string
    phone: string
    relation: string
  }[]
  healthId: string
}

const defaultProfile: MedicalProfile = {
  name: "Loading...",
  dateOfBirth: "1990-01-01",
  bloodGroup: "N/A",
  weight: "N/A",
  height: "N/A",
  allergies: [],
  medications: [],
  conditions: [],
  emergencyContacts: [],
  healthId: "N/A",
}

export function DigitalHealthCard() {
  const [profile, setProfile] = useState<MedicalProfile>(defaultProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(profile)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token")

        // Fetch User Profile
        const userRes = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        })

        // Fetch Latest Medical Record for Allergies/Medications
        const recordRes = await fetch("http://localhost:5000/api/medical-records/my", {
          headers: { Authorization: `Bearer ${token}` }
        })

          if (userRes.ok) {
            const userData = await userRes.json()
            let newProfile = {
              ...profile,
              name: userData.name,
              healthId: userData.healthId || "N/A",
              dateOfBirth: userData.dateOfBirth || "1990-01-01",
              bloodGroup: userData.bloodGroup || "N/A",
              weight: userData.weight || "N/A",
              height: userData.height || "N/A",
              allergies: userData.allergies || [],
              medications: userData.medications || [],
              conditions: userData.conditions || [],
              emergencyContacts: userData.emergencyContacts || [],
            }

            if (recordRes.ok) {
              const records = await recordRes.json()
              if (records.length > 0) {
                const latest = records[0]

                // Only pull from latest medical record if the user's profile doesn't have it set
                if (newProfile.allergies.length === 0) newProfile.allergies = latest.allergies || []
                if (newProfile.medications.length === 0) newProfile.medications = latest.medicines?.map((m: any) => `${m.name} ${m.dosage}`) || []
                if (newProfile.conditions.length === 0) newProfile.conditions = [latest.diagnosis].filter(Boolean)
              }
            }

            setProfile(newProfile)
            setEditedProfile(newProfile)
          }
        } catch (error) {
          console.error("Error fetching health card data", error)
        } finally {
          setLoading(false)
        }
      }
      fetchProfileData()
    }, [])
  
    const handleSave = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...editedProfile
          })
        })
  
        if (!response.ok) throw new Error("Failed to save profile")
  
        setProfile(editedProfile)
        setIsEditing(false)
        toast.success("Health Card profile updated successfully")
      } catch (error) {
        console.error("Error saving profile:", error)
        toast.error("Failed to save Health Card profile")
      }
    }
  
    const calculateAge = (dob: string) => {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
  
    const handleDownload = async () => {
      if (!cardRef.current) return
  
      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          filter: (node) => {
            if (node instanceof HTMLElement) {
              return node.dataset.html2canvasIgnore !== "true"
            }
            return true
          },
        })
  
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = `HealthCard-${profile.name.replace(/\s+/g, '-')}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
  
        toast.success("Health Card downloaded successfully")
      } catch (error) {
        console.error("Error downloading card:", error)
        toast.error("Failed to download Health Card")
      }
    }
  
    const handleShare = async () => {
      const primaryContact = profile.emergencyContacts.length > 0 ? `${profile.emergencyContacts[0].name} (${profile.emergencyContacts[0].phone})` : "N/A"
      const shareData = {
        title: `${profile.name}'s Health Card`,
        text: `Health Details:\nName: ${profile.name}\nBlood Group: ${profile.bloodGroup}\nABHA ID: ${profile.healthId}\nEmergency Contact: ${primaryContact}\nAllergies: ${profile.allergies.length ? profile.allergies.join(", ") : "None"}\nMedications: ${profile.medications.length ? profile.medications.join(", ") : "None"}\nConditions: ${profile.conditions.length ? profile.conditions.join(", ") : "None"}`,
      }
  
      try {
        if (navigator.share) {
          await navigator.share(shareData)
          toast.success("Health Card shared successfully")
        } else {
          await navigator.clipboard.writeText(shareData.text)
          toast.success("Health Card details copied to clipboard!")
        }
      } catch (error) {
        console.error("Error sharing card:", error)
        // Ignore abort errors from the user cancelling the share dialog
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error("Failed to share Health Card")
        }
      }
    }
  
    const primaryContactText = profile.emergencyContacts.length > 0 ? `Health Details:\nName: ${profile.name}\nBlood Group: ${profile.bloodGroup}\nABHA ID: ${profile.healthId}\nEmergency Contact: ${profile.emergencyContacts[0].name} (${profile.emergencyContacts[0].phone})\nAllergies: ${profile.allergies.length ? profile.allergies.join(", ") : "None"}\nMedications: ${profile.medications.length ? profile.medications.join(", ") : "None"}\nConditions: ${profile.conditions.length ? profile.conditions.join(", ") : "None"}` : `Health Details:\nName: ${profile.name}\nBlood Group: ${profile.bloodGroup}\nABHA ID: ${profile.healthId}\nAllergies: ${profile.allergies.length ? profile.allergies.join(", ") : "None"}\nMedications: ${profile.medications.length ? profile.medications.join(", ") : "None"}\nConditions: ${profile.conditions.length ? profile.conditions.join(", ") : "None"}`

    return (
      <div className="space-y-6 bg-background rounded-xl p-2 -m-2" ref={cardRef}>
        {/* Digital Health Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm opacity-80">Digital Health Card</p>
                <h2 className="text-2xl font-bold mt-1">{profile.name}</h2>
                <p className="text-sm opacity-80 mt-1">
                  {calculateAge(profile.dateOfBirth)} years • {profile.bloodGroup}
                </p>
              </div>
              <div className="h-20 w-20 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
                <QRCodeSVG
                  value={primaryContactText}
                  size={72}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-primary-foreground/20">
              <p className="text-xs opacity-60">ABHA Health ID</p>
              <p className="font-mono text-sm">{profile.healthId}</p>
            </div>
          </div>
          <CardContent className="p-4" data-html2canvas-ignore="true">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Medical Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={editedProfile.name}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <Input
                          type="date"
                          value={editedProfile.dateOfBirth}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Blood Group</Label>
                        <Select
                          value={editedProfile.bloodGroup}
                          onValueChange={(v) =>
                            setEditedProfile({ ...editedProfile, bloodGroup: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                              <SelectItem key={bg} value={bg}>
                                {bg}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <Input
                          value={editedProfile.weight}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, weight: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Height</Label>
                        <Input
                          value={editedProfile.height}
                          onChange={(e) =>
                            setEditedProfile({ ...editedProfile, height: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Primary Emergency Contact Name</Label>
                        <Input
                          value={editedProfile.emergencyContacts[0]?.name || ""}
                          onChange={(e) => {
                            const newContacts = [...editedProfile.emergencyContacts]
                            if (newContacts.length === 0) {
                              newContacts.push({ name: e.target.value, phone: "", relation: "" })
                            } else {
                              newContacts[0] = { ...newContacts[0], name: e.target.value }
                            }
                            setEditedProfile({ ...editedProfile, emergencyContacts: newContacts })
                          }}
                        />
                      </div>
                      <div>
                        <Label>Primary Emergency Contact Phone</Label>
                        <Input
                          value={editedProfile.emergencyContacts[0]?.phone || ""}
                          onChange={(e) => {
                            const newContacts = [...editedProfile.emergencyContacts]
                            if (newContacts.length === 0) {
                              newContacts.push({ name: "", phone: e.target.value, relation: "" })
                            } else {
                              newContacts[0] = { ...newContacts[0], phone: e.target.value }
                            }
                            setEditedProfile({ ...editedProfile, emergencyContacts: newContacts })
                          }}
                        />
                      </div>
                    </div>
                  <div>
                    <Label>Allergies (comma separated)</Label>
                    <Input
                      value={editedProfile.allergies.join(", ")}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          allergies: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Current Medications (comma separated)</Label>
                    <Input
                      value={editedProfile.medications.join(", ")}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          medications: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Medical Conditions (comma separated)</Label>
                    <Input
                      value={editedProfile.conditions.join(", ")}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          conditions: e.target.value.split(",").map((s) => s.trim()),
                        })
                      }
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Medical Information Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-primary" />
              Basic Information
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height</span>
              <span>{profile.height}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span>{profile.weight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Group</span>
              <Badge variant="outline" className="text-emergency border-emergency">
                <Droplets className="h-3 w-3 mr-1" />
                {profile.bloodGroup}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emergency">
              <AlertTriangle className="h-4 w-4" />
              Allergies
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive">
                  {allergy}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Pill className="h-4 w-4 text-accent" />
              Current Medications
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.medications.map((med) => (
                <Badge key={med} variant="secondary">
                  {med}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Heart className="h-4 w-4 text-primary" />
              Medical Conditions
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.conditions.map((condition) => (
                <Badge key={condition} variant="outline">
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
