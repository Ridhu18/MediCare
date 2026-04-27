"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, Clock, User, Stethoscope, Check, X, ChevronLeft, Star, MapPin, ReceiptText, Paperclip, Upload, History, Plus, FileText, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Doctor {
  _id: string
  user: {
    name: string
    email: string
  }
  specialization: string
  availability: string[]
  rating: number
  consultationFee: number
}

interface TimeSlot {
  time: string
  available: boolean
}

interface Attachment {
  name: string
  url: string
  fileType: string
}

interface MedicalRecord {
  _id: string
  diagnosis: string
  date: string
  attachments?: Attachment[]
}

const departments = [
  "Emergency",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Medicine",
  "Surgery",
  "ENT",
]

const timeSlots: TimeSlot[] = [
  { time: "09:00 AM", available: true },
  { time: "09:30 AM", available: false },
  { time: "10:00 AM", available: true },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: false },
  { time: "11:30 AM", available: true },
  { time: "02:00 PM", available: true },
  { time: "02:30 PM", available: true },
  { time: "03:00 PM", available: false },
  { time: "03:30 PM", available: true },
  { time: "04:00 PM", available: true },
  { time: "04:30 PM", available: true },
]

interface AppointmentBookingProps {
  hospitalName?: string
  hospitalId?: string
  onClose?: () => void
  onSuccess?: () => void
}

export function AppointmentBooking({ hospitalName, hospitalId, onClose, onSuccess }: AppointmentBookingProps) {
  const [step, setStep] = useState(1)
  const [department, setDepartment] = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [reason, setReason] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [showRecordPicker, setShowRecordPicker] = useState(false)
  const [myRecords, setMyRecords] = useState<MedicalRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch doctors when department changes
  const fetchDoctors = async (dept: string) => {
    if (!hospitalId) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/doctors?hospitalId=${hospitalId}`)
      if (res.ok) {
        const data = await res.json()
        setDoctors(data.filter((d: any) => d.specialization.includes(dept) || dept === "General Medicine"))
      }
    } catch (error) {
      console.error("Error fetching doctors:", error)
    }
  }

  const fetchMyRecords = async () => {
    setLoadingRecords(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMyRecords(data)
      }
    } catch (error) {
      console.error("Error fetching records", error)
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
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
        setAttachments([...attachments, fileData])
      }
    } catch (error) {
      console.error("Upload error", error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedDoctor || !hospitalId) return
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          hospitalId,
          date: selectedDate,
          time: selectedTime,
          reason,
          attachments
        })
      })

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      }
    } catch (error) {
      console.error("Error booking appointment", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (showRecordPicker) {
      fetchMyRecords()
    }
  }, [showRecordPicker])

  if (isSuccess) {
    return (
      <Card className="w-full border-0 shadow-none bg-transparent">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <Check className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-lg font-bold tracking-tight mb-1">Appointment Requested!</h2>
          <p className="text-[11px] text-muted-foreground mb-4 uppercase tracking-widest font-bold opacity-70">
            Request Sent to {hospitalName || "Hospital"}
          </p>
          <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl text-left border border-primary/5 space-y-2 mb-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-bold uppercase tracking-wider">Doctor</span>
              <span className="font-bold text-slate-700">{selectedDoctor?.user.name}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-bold uppercase tracking-wider">Schedule</span>
              <span className="font-bold text-slate-700">{selectedDate} at {selectedTime}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-bold uppercase tracking-wider">Unit</span>
              <span className="font-bold text-slate-700">{department}</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium italic opacity-60 mt-4">
            Confirmation details will appear in your history soon.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex items-center gap-3">
          {(step > 1 || onClose) && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-lg h-8 w-8 shrink-0 bg-white/40 border-primary/5 hover:bg-primary/5 transition-all"
              onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">Book Appointment</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
              {hospitalName || "Select Unit & Specialist"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 w-4 rounded-full transition-all duration-300",
                  s === step ? "w-8 bg-primary" : s < step ? "bg-primary/40" : "bg-primary/10"
                )}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Medical Unit</Label>
              <Select value={department} onValueChange={(val) => {
                setDepartment(val)
                fetchDoctors(val)
              }}>
                <SelectTrigger className="h-10 bg-white/40 border-primary/5 focus:ring-primary/20 rounded-xl font-bold text-xs">
                  <SelectValue placeholder="Select Specialization" />
                </SelectTrigger>
                <SelectContent className="z-[1001] rounded-xl border-primary/10 shadow-2xl">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-xs font-bold">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {department && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Available Specialists</Label>
                  <p className="text-[9px] font-black uppercase text-primary/60">{doctors.length} Active</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {doctors.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-muted/10 rounded-xl border border-dashed border-primary/5">
                      <Stethoscope className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">No specialists found</p>
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <button
                        key={doctor._id}
                        type="button"
                        onClick={() => setSelectedDoctor(doctor)}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-xl text-left transition-all relative group overflow-hidden",
                          selectedDoctor?._id === doctor._id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md shadow-primary/5"
                            : "hover:border-primary/20 hover:bg-white/40 border-primary/5 bg-white/20"
                        )}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs truncate block">{doctor.user.name}</span>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-70">
                            {doctor.specialization}
                          </p>
                          <div className="flex items-center justify-between mt-1.5 px-0.5">
                            <span className="text-[10px] font-black text-primary">₹{doctor.consultationFee}</span>
                          </div>
                        </div>
                        {selectedDoctor?._id === doctor._id && (
                          <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <Button
              className="w-full h-11 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
              onClick={() => setStep(2)}
              disabled={!department || !selectedDoctor}
            >
              Continue to Schedule
            </Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Select Date</Label>
                <div className="p-3 bg-white/20 rounded-xl border border-primary/5">
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-10 bg-white/40 border-primary/5 focus-visible:ring-primary/20 rounded-xl font-bold text-xs cursor-pointer"
                  />
                </div>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-primary opacity-60" />
                    <p className="text-[9px] font-bold text-muted-foreground leading-snug">
                      Processing priority enabled for premium members.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time Slot</Label>
                  {selectedDate && <p className="text-[9px] font-black uppercase text-primary/60">IST (Standard)</p>}
                </div>
                {selectedDate ? (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "h-9 flex items-center justify-center rounded-lg border text-[10px] font-black transition-all",
                          selectedTime === slot.time
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/10 scale-[0.98]"
                            : slot.available
                              ? "hover:border-primary/40 hover:bg-primary/5 border-primary/5 bg-white/40"
                              : "opacity-20 cursor-not-allowed bg-muted/20"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[120px] flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/10 opacity-60">
                    <Calendar className="h-6 w-6 text-muted-foreground mb-2 opacity-20" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">Please Select Date</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full h-11 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95"
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
            >
              Review Configuration
            </Button>
          </div>
        )}


        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Booking Preview</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-primary/5 hover:border-primary/20 transition-all">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Attending Doctor</p>
                      <p className="font-bold text-xs tracking-tight">{selectedDoctor?.user.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-primary/5 hover:border-primary/20 transition-all">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Session Slot</p>
                      <p className="font-bold text-xs tracking-tight">{selectedDate} at {selectedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <ReceiptText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 flex justify-between items-center pr-1">
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Consultation Fee</p>
                        <p className="font-black text-sm text-primary">₹{selectedDoctor?.consultationFee}</p>
                      </div>
                      <Badge className="bg-success/10 text-success border-none text-[8px] font-black uppercase">Standard rate</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Clinical Notes</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe symptoms or concerns..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-xl bg-white/40 border-primary/5 focus:border-primary/20 min-h-[90px] text-[11px] p-3 font-medium placeholder:opacity-50"
                />

                <div className="space-y-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 invisible-scrollbar">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                      accept="image/*,.pdf"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg gap-1.5 px-2.5 bg-white/40 border-primary/5 text-[9px] font-bold uppercase tracking-widest hover:bg-primary/5"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Clock className="h-2.5 w-2.5 animate-spin" /> : <Upload className="h-2.5 w-2.5" />}
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-lg gap-1.5 px-2.5 bg-white/40 border-primary/5 text-[9px] font-bold uppercase tracking-widest hover:bg-primary/5"
                      onClick={() => setShowRecordPicker(true)}
                    >
                      <History className="h-2.5 w-2.5" />
                      Vault
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attachments.slice(0, 3).map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded-lg border border-primary/10 text-[9px] font-bold group">
                          <Paperclip className="h-2.5 w-2.5 text-primary opacity-60" />
                          <span className="max-w-[80px] truncate opacity-80">{file.name}</span>
                          <X 
                            className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive cursor-pointer" 
                            onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                          />
                        </div>
                      ))}
                      {attachments.length > 3 && (
                        <Badge variant="secondary" className="text-[9px] font-bold h-6 rounded-lg">+{attachments.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2">
              <Button
                className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Finalizing Transaction..." : "Complete Booking"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Medical Records Picker Dialog */}
      <Dialog open={showRecordPicker} onOpenChange={setShowRecordPicker}>
        <DialogContent className="max-w-xl max-h-[70vh] p-0 overflow-hidden border-none bg-background/80 backdrop-blur-xl rounded-[2rem] shadow-2xl z-[1001]">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Health Vault</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Sync Records to Appointment</p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 pt-2 overflow-y-auto max-h-[50vh] space-y-2">
            {loadingRecords ? (
              <div className="py-10 text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto text-primary/30 mb-2" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase animate-pulse">Synchronizing Data...</p>
              </div>
            ) : myRecords.length === 0 ? (
              <div className="py-10 text-center bg-white/40 border border-dashed border-primary/10 rounded-2xl">
                <History className="h-10 w-10 mx-auto mb-2 opacity-5" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">No Records available</p>
              </div>
            ) : (
              myRecords.map((record) => (
                <div key={record._id} className="group p-3 border border-primary/5 rounded-2xl bg-white/40 hover:bg-white/70 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate mb-0.5">{record.diagnosis}</h4>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Calendar className="h-2.5 w-2.5" />
                        <span className="text-[9px] font-bold uppercase">{new Date(record.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 rounded-lg px-2.5 font-bold text-[9px] uppercase tracking-widest bg-primary/5 text-primary hover:bg-primary hover:text-white border-primary/10 transition-all"
                      onClick={() => {
                        const newAttachment = {
                          name: `Summary: ${record.diagnosis}`,
                          url: `medical-record:${record._id}`,
                          fileType: "text/reference"
                        }
                        if (!attachments.find(a => a.url === newAttachment.url)) {
                          setAttachments([...attachments, newAttachment])
                        }
                        setShowRecordPicker(false)
                      }}
                    >
                      Attach
                    </Button>
                  </div>
                  {record.attachments && record.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2 buffer border-t border-primary/5 overflow-hidden">
                      {record.attachments.slice(0, 3).map((file, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!attachments.find(a => a.url === file.url)) {
                              setAttachments([...attachments, file])
                            }
                            setShowRecordPicker(false)
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 bg-background border border-primary/5 rounded text-[8px] font-bold hover:bg-primary/5 transition-all truncate max-w-[100px]"
                        >
                          {file.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="p-4 bg-muted/20 border-t border-primary/5 text-center">
            <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest">Secure end-to-end medical encryption</p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
