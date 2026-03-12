"use client"

import { AppNavigation } from "@/components/app-navigation"
import { DigitalHealthCard } from "@/components/digital-health-card"
import { CreditCard, FileText, History, Download, Trash2 } from "lucide-react"
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
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
      const res = await fetch("http://localhost:5000/api/medical-records/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const fileData = await res.json()
        
        // Step 2: Create the actual medical record document
        const createRes = await fetch("http://localhost:5000/api/medical-records", {
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
          const recordsRes = await fetch("http://localhost:5000/api/medical-records/my", {
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
      const res = await fetch(`http://localhost:5000/api/medical-records/${recordId}`, {
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
        const userRes = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUserName(userData.name)
          setUserId(userData._id)
        }

        // Fetch Medical Records
        const res = await fetch("http://localhost:5000/api/medical-records/my", {
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

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                Digital Health Card
              </h1>
              <p className="text-sm text-muted-foreground">Your complete medical profile</p>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Health Card & Profile */}
            <div className="lg:col-span-2">
              <DigitalHealthCard />
            </div>

            {/* Medical Records */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Medical Records
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsHistoryOpen(true)}>View All</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">Loading records...</div>
                  ) : records.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">No records found.</div>
                  ) : (
                    records.slice(0, 3).map((record) => (
                      <div
                        key={record._id}
                        className="p-3 bg-muted/50 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => {
                              setSelectedRecord(record)
                              setIsDetailOpen(true)
                            }}
                          >
                            <Badge variant="outline" className="text-xs">
                              {record.attachments && record.attachments.length > 0 ? "Diagnostic File" : "Consultation"}
                            </Badge>
                            <p className="font-medium text-sm mt-1 truncate">{record.diagnosis}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()} • Dr. {record.doctor?.user?.name || "Self-Uploaded"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!record.doctor && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteRecord(record._id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-primary"
                              onClick={() => {
                                setSelectedRecord(record)
                                setIsDetailOpen(true)
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {record.attachments && record.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {record.attachments.map((file, i) => (
                              <a
                                key={i}
                                href={`http://localhost:5000${file.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 bg-background rounded border text-[10px] hover:bg-muted transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Paperclip className="h-3 w-3 text-primary" />
                                <span className="font-medium truncate max-w-[100px]">{file.name}</span>
                                <ExternalLink className="h-2 w-2 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {uploading ? "Uploading..." : "Upload Medical Document"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View Health History
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={handlePrintAll}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Health Records
                  </Button>
                </CardContent>
              </Card>

              {/* Emergency Access Info */}
              <Card className="bg-emergency/5 border-emergency/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-emergency mb-2">Emergency Access</h4>
                  <p className="text-sm text-muted-foreground">
                    In case of emergency, medical professionals can scan your Health Card QR code to instantly access critical medical information including blood group, allergies, and current medications.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Medical Record Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>Medical Record Details</DialogTitle>
            <div className="flex items-center gap-2">
              {selectedRecord && !selectedRecord.doctor && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive border-destructive/20 hover:bg-destructive/5"
                  onClick={() => {
                    handleDeleteRecord(selectedRecord._id)
                    setIsDetailOpen(false)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => handlePrint()}>
                <Printer className="h-4 w-4 mr-2" />
                Print / Download
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
                          href={`http://localhost:5000${file.url}`}
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
                              src={`http://localhost:5000${file.url}`}
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

      {/* Medical History Dialog (View All) */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Full Medical History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {records.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No records found.</div>
            ) : (
              records.map((record) => (
                <div key={record._id} className="p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{record.diagnosis}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(record.date).toLocaleDateString()} • Dr. {record.doctor?.user?.name || "Self-Uploaded"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!record.doctor && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRecord(record._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record)
                          setIsDetailOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded italic">
                      "{record.notes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
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
