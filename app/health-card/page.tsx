"use client"

import { AppNavigation } from "@/components/app-navigation"
import { DigitalHealthCard } from "@/components/digital-health-card"
import Link from "next/link"
import { CreditCard, FileText, History, Download, Trash2, ChevronRight, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useRef } from "react"
import { ExternalLink, Paperclip, Printer, X, Upload, Activity } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useReactToPrint } from "react-to-print"

interface MedicalRecord {
  _id: string
  diagnosis: string
  date: string
  notes?: string
  medicines?: Array<{
    name: string
    dosage: string
    duration: string
    instructions: string
  }>
  allergies?: string[]
  doctor: {
    user: {
      name: string
    }
  }
  appointment?: {
    _id: string
    reason: string
    hospital?: {
      name: string
    }
  }
  hospital?: {
    name: string
  }
  attachments?: Array<{
    name: string
    url: string
    fileType: string
  }>
}


export default function HealthCardPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>("Patient")
  const [userId, setUserId] = useState<string>("")
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const allRecordsPrintRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  })

  const handlePrintAll = useReactToPrint({
    contentRef: allRecordsPrintRef,
    documentTitle: `${userName}_Full_Medical_History`
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      const formData = new FormData()
      formData.append("file", file)

      // Step 1: Upload the file to the server
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const fileData = await res.json()

        // Step 2: Create the actual medical record document
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId: userId,
            diagnosis: `Uploaded Document: ${fileData.name}`,
            attachments: [fileData]
          })
        })

        if (createRes.ok) {
          // Step 3: Refresh records list
          const recordsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/my`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (recordsRes.ok) {
            const data = await recordsRes.json()
            setRecords(data)
          }
        }
      }
    } catch (error) {
      console.error("Upload error", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this medical record?")) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/${recordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        // Refresh records
        setRecords(records.filter(r => r._id !== recordId))
      } else {
        const error = await res.json()
        alert(error.message || "Error deleting record")
      }
    } catch (error) {
      console.error("Delete error", error)
      alert("Failed to delete record")
    }
  }

  useEffect(() => {
    const fetchUserAndRecords = async () => {
      try {
        const token = localStorage.getItem("token")

        // Fetch User Profile
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserName(userData.name)
          setUserId(userData._id)
        }

        // Fetch Medical Records
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/medical-records/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setRecords(data)
        }
      } catch (error) {
        console.error("Error fetching data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndRecords()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64 relative min-h-screen">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">Digital Health Card</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Comprehensive Medical Profile</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Health Card & Profile */}
            <div className="lg:col-span-2">
              <DigitalHealthCard />
            </div>

            {/* Medical Records Summary */}
            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Recent Records
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs font-bold hover:bg-primary/5">
                      <Link href="/history?tab=reports" className="flex items-center">
                        View All
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  {loading ? (
                    <div className="py-12 text-center text-xs font-medium text-muted-foreground italic">Loading records...</div>
                  ) : records.length === 0 ? (
                    <div className="py-12 text-center text-xs font-medium text-muted-foreground italic">No records found.</div>
                  ) : (
                    records.slice(0, 3).map((record) => (
                      <div
                        key={record._id}
                        className="p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 hover:bg-white transition-all cursor-pointer group shadow-sm"
                        onClick={() => {
                          setSelectedRecord(record)
                          setIsDetailOpen(true)
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border-primary/10 bg-primary/5 text-primary mb-2">
                              {record.attachments && record.attachments.length > 0 ? "Laboratory Report" : "Clinical Consultation"}
                            </Badge>
                            <p className="font-bold text-sm truncate text-slate-800">{record.diagnosis}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-200" />
                              <span className="font-medium">Dr. {record.doctor?.user?.name || "Self-Uploaded"}</span>
                            </p>
                          </div>
                          <div className="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <FileText className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-none shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent border-primary/10 hover:bg-primary hover:text-white transition-all rounded-2xl h-11 px-4 font-bold group"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 mr-3 group-hover:bg-white/20 transition-colors">
                      {uploading ? <Activity className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </div>
                    {uploading ? "Uploading..." : "Upload Medical Document"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent border-primary/10 hover:bg-primary hover:text-white transition-all rounded-2xl h-11 px-4 font-bold group"
                    asChild
                  >
                    <Link href="/history?tab=reports" className="flex items-center">
                      <div className="p-2 rounded-lg bg-primary/10 mr-3 group-hover:bg-white/20 transition-colors">
                        <History className="h-4 w-4" />
                      </div>
                      View Health History
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent border-primary/10 hover:bg-primary hover:text-white transition-all rounded-2xl h-11 px-4 font-bold group"
                    onClick={handlePrintAll}
                  >
                    <div className="p-2 rounded-lg bg-primary/10 mr-3 group-hover:bg-white/20 transition-colors">
                      <Download className="h-4 w-4" />
                    </div>
                    Export Health Records
                  </Button>
                </CardContent>
              </Card>

              {/* Emergency Access Info */}
              <Card className="bg-red-500/5 border border-red-500/10 rounded-3xl shadow-xl shadow-red-500/5 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-red-500/10 text-red-600 group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-red-600">Paramedic Protocol</h4>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                    In emergencies, medical personnel can scan your **Health Card QR** to instantly access critical medical information: blood type, allergies, and medications.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Medical Record Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/10 rounded-3xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 border-b bg-muted/30 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Medical Report Details</DialogTitle>
              <DialogDescription className="text-xs font-semibold text-primary uppercase tracking-widest mt-1">Official Document</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedRecord && !selectedRecord.doctor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all gap-2"
                  onClick={() => {
                    handleDeleteRecord(selectedRecord._id)
                    setIsDetailOpen(false)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="sm" className="rounded-xl border-primary/10 hover:bg-primary hover:text-primary-foreground transition-all gap-2" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          {selectedRecord && (
            <div ref={printRef} className="p-6 space-y-6 bg-white text-slate-900 rounded-lg print:p-8">
              {/* Header for Print */}
              <div className="pb-6 border-b border-slate-200">
                <h2 className="text-2xl font-bold text-primary">Medical Consultation Report</h2>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date of Visit</p>
                    <p className="font-medium">{new Date(selectedRecord.date).toLocaleDateString()} at {new Date(selectedRecord.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Patient Name</p>
                    <p className="font-medium">{userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Doctor</p>
                    <p className="font-medium">Dr. {selectedRecord.doctor?.user?.name || "Self-Uploaded"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Facility</p>
                    <p className="font-medium">{selectedRecord.appointment?.hospital?.name || selectedRecord.hospital?.name || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Reason */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Primary Complaint / Reason for Visit</h3>
                <p className="p-3 bg-slate-50 rounded border border-slate-100 italic">
                  "{selectedRecord.appointment?.reason || "General document upload and health record maintenance."}"
                </p>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Diagnosis / Record Title</h3>
                <p className="text-lg font-medium text-emergency">{selectedRecord.diagnosis}</p>
              </div>

              {/* Prescription */}
              {selectedRecord.medicines && selectedRecord.medicines.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Prescribed Medications</h3>
                  <div className="border rounded-lg overflow-hidden border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold">Medicine</th>
                          <th className="px-4 py-2 text-left font-semibold">Dosage</th>
                          <th className="px-4 py-2 text-left font-semibold">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRecord.medicines.map((med, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3">
                              <p className="font-medium">{med.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>
                            </td>
                            <td className="px-4 py-3">{med.dosage}</td>
                            <td className="px-4 py-3">{med.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Doctor's Advice */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Doctor's Advice / Notes</h3>
                <div className="p-4 bg-primary/5 rounded border border-primary/10 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRecord.notes || "This is a user-uploaded medical document. Review the attached files for full details."}
                </div>
              </div>

              {/* Attachments Section */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Attachments & Diagnostic Reports</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRecord.attachments.map((file, i) => (
                      <div key={i} className="space-y-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${file.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-muted/30 rounded border border-slate-200 hover:bg-muted/50 transition-colors print:border-none print:p-0"
                        >
                          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 print:hidden">
                            <Paperclip className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground uppercase">{file.fileType.split('/')[1] || "File"}</p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto print:hidden" />
                        </a>

                        {file.fileType.startsWith('image/') && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mt-2">
                            <img
                              src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}${file.url}`}
                              alt={file.name}
                              className="object-contain w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer for Print */}
              <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-muted-foreground hidden print:block">
                This report includes patient-uploaded documents. MediCare+ Digital Health Record.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Hidden Print Container for All Records */}
      <div className="hidden">
        <div ref={allRecordsPrintRef} className="p-10 space-y-8 bg-white text-slate-900">
          <div className="text-center pb-8 border-b-2 border-primary">
            <h1 className="text-3xl font-bold text-primary">Full Medical History Report</h1>
            <p className="text-muted-foreground mt-2">Patient: {userName} • Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {records.map((record, index) => (
            <div key={record._id} className="space-y-4 pb-8 border-b border-slate-200 last:border-0">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-800">{index + 1}. {record.diagnosis}</h2>
                <span className="text-sm font-medium">{new Date(record.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm"><strong>Doctor:</strong> {record.doctor?.user?.name || "Self-Uploaded"}</p>
              <p className="text-sm"><strong>Facility:</strong> {record.appointment?.hospital?.name || record.hospital?.name || "N/A"}</p>

              {record.notes && (
                <div className="text-sm">
                  <strong>Notes:</strong>
                  <p className="mt-1 p-2 bg-slate-50 border rounded italic">{record.notes}</p>
                </div>
              )}

              {record.medicines && record.medicines.length > 0 && (
                <div className="text-sm">
                  <strong>Prescriptions:</strong>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    {record.medicines.map((med, i) => (
                      <li key={i}>{med.name} - {med.dosage} ({med.duration})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <div className="pt-8 text-center text-[10px] text-muted-foreground">
            End of Medical History Report for {userName}.
          </div>
        </div>
      </div>
    </div>
  )
}
