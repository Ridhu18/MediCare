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
      const res = await fetch(`http://localhost:5000/api/doctors?hospitalId=${hospitalId}`)
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
      const res = await fetch("http://localhost:5000/api/medical-records/my", {
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

      const res = await fetch("http://localhost:5000/api/medical-records/upload", {
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
      const response = await fetch("http://localhost:5000/api/appointments", {
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
      <Card className="w-full border-0 shadow-none">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Appointment Requested!</h2>
          <p className="text-muted-foreground mb-4">
            Your appointment request has been sent to {hospitalName || "the hospital"}.
            You will receive a notification once it's confirmed.
          </p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-2">
            <p><strong>Doctor:</strong> {selectedDoctor?.user.name}</p>
            <p><strong>Date:</strong> {selectedDate}</p>
            <p><strong>Time:</strong> {selectedTime}</p>
            <p><strong>Department:</strong> {department}</p>
            {attachments.length > 0 && <p><strong>Attachments:</strong> {attachments.length} files linked</p>}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="px-1 pt-0">
        <div className="flex items-center gap-4">
          {(step > 1 || onClose) && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 shrink-0"
              onClick={() => step > 1 ? setStep(step - 1) : onClose?.()}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold">Book Appointment</CardTitle>
            <CardDescription className="text-base">
              {hospitalName || "Select department and doctor"}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <div className="space-y-6 pt-4">
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-primary/20">
              <Label className="text-base font-semibold mb-2 block">Select Department</Label>
              <Select value={department} onValueChange={(val) => {
                setDepartment(val)
                fetchDoctors(val)
              }}>
                <SelectTrigger className="mt-1.5 h-12 bg-background border-primary/20 hover:border-primary transition-colors">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent className="z-[1001]">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {department && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Available Doctors</Label>
                  <Badge variant="outline" className="font-normal">{doctors.length} Found</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-muted/20 rounded-xl border border-dashed">
                      <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                      <p className="text-muted-foreground">No doctors available for this department</p>
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <button
                        key={doctor._id}
                        type="button"
                        onClick={() => setSelectedDoctor(doctor)}
                        className={cn(
                          "flex items-center gap-4 p-4 border rounded-xl text-left transition-all relative group",
                          selectedDoctor?._id === doctor._id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                          <User className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base truncate">{doctor.user.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">
                            {doctor.specialization}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-primary font-bold">₹{doctor.consultationFee}</span>
                            <div className="flex items-center gap-1 text-warning text-sm">
                              <Star className="h-3.5 w-3.5 fill-warning" />
                              <span className="font-medium">4.8</span>
                            </div>
                          </div>
                        </div>
                        {selectedDoctor?._id === doctor._id && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            <Button
              className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
              onClick={() => setStep(2)}
              disabled={!department || !selectedDoctor}
            >
              Continue to Schedule
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="date" className="text-base font-semibold">Select Appointment Date</Label>
                <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-primary/20">
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-12 bg-background border-primary/20 hover:border-primary transition-colors cursor-pointer"
                  />
                </div>
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Please select a date from Monday to Saturday. Appointments are usually processed within 2 hours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">Choose Your Time Slot</Label>
                {selectedDate ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "h-12 flex items-center justify-center rounded-xl border font-medium transition-all",
                          selectedTime === slot.time
                            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : slot.available
                              ? "hover:border-primary hover:bg-primary/5 border-primary/20"
                              : "opacity-40 cursor-not-allowed bg-muted grayscale"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[240px] flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/20">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2 opacity-20" />
                    <p className="text-muted-foreground text-sm">Please select a date first</p>
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedTime}
            >
              Review and Confirm
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">Appointment Details</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Doctor</p>
                      <p className="font-bold text-base">{selectedDoctor?.user.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedDoctor?.specialization}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date & Time</p>
                      <p className="font-bold text-base">{selectedDate}</p>
                      <p className="text-sm text-muted-foreground">{selectedTime}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-primary/10">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ReceiptText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Consultation Fee</p>
                      <p className="font-bold text-base text-primary">₹{selectedDoctor?.consultationFee}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="reason" className="text-base font-semibold">Reason for Visit & Attachments</Label>
                <Textarea
                  id="reason"
                  placeholder="Tell us about your symptoms or medical concerns..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1.5 rounded-xl border-primary/20 focus:border-primary min-h-[120px] text-base p-4"
                />
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
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
                      className="rounded-lg gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? <Clock className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      From Device
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-lg gap-2"
                      onClick={() => setShowRecordPicker(true)}
                    >
                      <History className="h-4 w-4" />
                      From Records
                    </Button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                       {attachments.map((file, i) => (
                         <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg border border-primary/10 text-xs">
                           <div className="flex items-center gap-2 truncate">
                             <Paperclip className="h-3 w-3 text-primary shrink-0" />
                             <span className="truncate">{file.name}</span>
                           </div>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6 text-destructive"
                             onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                           >
                             <X className="h-3 w-3" />
                           </Button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-dashed">
              <Button
                className="w-full h-14 text-xl font-bold rounded-xl shadow-xl shadow-primary/30 hover:scale-[1.01] transition-all"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirming Booking..." : "Book Appointment Now"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Medical Records Picker Dialog */}
      <Dialog open={showRecordPicker} onOpenChange={setShowRecordPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-[1001]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Your Medical Records
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             {loadingRecords ? (
               <div className="py-12 text-center">
                 <Clock className="h-10 w-10 animate-spin mx-auto text-primary/40 mb-3" />
                 <p className="text-sm text-muted-foreground animate-pulse">Syncing your medical history...</p>
               </div>
             ) : myRecords.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground border border-dashed rounded-2xl bg-muted/20">
                 <History className="h-12 w-12 mx-auto mb-3 opacity-10" />
                 <p className="font-medium">No medical records found</p>
                 <p className="text-xs mt-1">Upload records in the Health Card section first.</p>
               </div>
             ) : (
               myRecords.map((record) => (
                 <div key={record._id} className="p-4 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border-primary/5 hover:border-primary/20 group">
                   <div className="flex items-center justify-between mb-3">
                     <div>
                       <p className="font-bold text-sm text-foreground">{record.diagnosis}</p>
                       <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                         <Calendar className="h-2.5 w-2.5" />
                         {new Date(record.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                       </p>
                     </div>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="h-8 text-[10px] font-bold uppercase tracking-wider gap-1.5 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all"
                       onClick={() => {
                         const newAttachment = {
                           name: `Summary: ${record.diagnosis}`,
                           url: `medical-record:${record._id}`, 
                           fileType: "text/reference"
                         }
                         setAttachments([...attachments, newAttachment])
                         setShowRecordPicker(false)
                       }}
                     >
                       <Plus className="h-3 w-3" />
                       Select Record
                     </Button>
                   </div>
                   {record.attachments && record.attachments.length > 0 ? (
                     <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/5 mt-2">
                       {record.attachments.map((file, idx) => (
                         <button
                           key={idx}
                           onClick={(e) => {
                             e.stopPropagation()
                             if (!attachments.find(a => a.url === file.url)) {
                               setAttachments([...attachments, file])
                             }
                             setShowRecordPicker(false)
                           }}
                           className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-lg border border-primary/10 text-[9px] font-bold hover:border-primary hover:bg-primary/5 transition-all active:scale-95"
                         >
                           <Plus className="h-2.5 w-2.5 text-primary" />
                           <span className="max-w-[150px] truncate">{file.name}</span>
                         </button>
                       ))}
                     </div>
                   ) : (
                     <div className="text-[9px] text-muted-foreground flex items-center gap-1.5 pt-2 border-t border-primary/5 mt-2 italic opacity-60">
                       <FileText className="h-3 w-3" />
                       No attached files for this record
                     </div>
                   )}
                 </div>
               ))
             )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
