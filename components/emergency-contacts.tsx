import { useState, useEffect } from "react"
import { Plus, Trash2, Phone, User, Edit2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const countryCodes = [
  { code: "+91", short: "IN", label: "India (+91)" },
  { code: "+1", short: "US", label: "USA (+1)" },
  { code: "+44", short: "GB", label: "UK (+44)" },
  { code: "+61", short: "AU", label: "Australia (+61)" },
  { code: "+971", short: "AE", label: "UAE (+971)" },
]

interface Contact {
  id?: string
  _id?: string
  name: string
  phone: string
  relation: string
}

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "", countryCode: "+91" })

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (res.ok) {
          const userData = await res.json()
          setContacts(userData.emergencyContacts || [])
        }
      } catch (error) {
        console.error("Error fetching contacts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  const updateContactsOnServer = async (updatedContacts: Contact[]) => {
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ emergencyContacts: updatedContacts })
      })

      if (res.ok) {
        const userData = await res.json()
        setContacts(userData.emergencyContacts || [])
        toast.success("Emergency contacts updated")
      } else {
        toast.error("Failed to update contacts")
      }
    } catch (error) {
      console.error("Error updating contacts:", error)
      toast.error("Error updating contacts")
    } finally {
      setSaving(false)
    }
  }

  const addContact = async () => {
    if (contacts.length >= 2) {
      toast.error("Maximum 2 emergency contacts allowed")
      return
    }
    
    // Process phone number: Remove non-digits
    const cleanPhone = newContact.phone.replace(/\D/g, "")
    
    if (!newContact.name || !cleanPhone) {
      toast.error("Name and phone are required")
      return
    }

    if (cleanPhone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits")
      return
    }

    const updatedContacts = [...contacts, { ...newContact, phone: newContact.countryCode + cleanPhone }]
    await updateContactsOnServer(updatedContacts)
    setNewContact({ name: "", phone: "", relation: "", countryCode: "+91" })
    setIsAdding(false)
  }

  const removeContact = async (id?: string) => {
    const updatedContacts = contacts.filter((c: Contact) => (c._id || c.id) !== id)
    await updateContactsOnServer(updatedContacts)
  }

  const callContact = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\s/g, "")}`
  }

  return (
    <Card className="border-none shadow-lg shadow-primary/5 bg-background/40 backdrop-blur-md rounded-2xl overflow-hidden group/contacts">
      <CardHeader className="pb-3 border-b border-primary/5 bg-white/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Reliable Contacts
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] font-bold px-2 py-0">
            {contacts.length}/2
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" />
          </div>
        ) : contacts.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 rounded-2xl bg-white/40 backdrop-blur-sm border border-dashed border-primary/20 group/empty">
              <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 group-hover/empty:scale-110 transition-transform">
                <User className="h-6 w-6 text-primary/40" />
              </div>
              <p className="text-sm font-bold text-slate-800">No contacts yet</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1 opacity-60">Add a responder for instant alerts</p>
            </div>
        ) : (
          <div className="space-y-2.5">
            {contacts.map((contact: Contact) => (
              <div
                key={contact._id || contact.id}
                className="group/item flex items-center justify-between p-3 bg-white/40 hover:bg-white/60 border border-primary/5 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/item:scale-105 transition-transform duration-300">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                      <Badge className="bg-success/10 text-success border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                        {contact.relation}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-none">
                      {contact.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 border-success/20 text-success bg-success/5 hover:bg-success hover:text-white transition-all duration-300 rounded-lg hover:scale-105 active:scale-95 shadow-sm"
                    onClick={() => callContact(contact.phone)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    disabled={saving}
                    className="h-9 w-9 border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive hover:text-white transition-all duration-300 rounded-lg hover:scale-105 active:scale-95 shadow-sm"
                    onClick={() => removeContact(contact._id || contact.id)}
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdding ? (
          <div className="space-y-4 p-4 border border-primary/10 bg-white/60 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="bg-background/50 border-primary/10 text-xs h-9 rounded-lg focus-visible:ring-primary/20"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="relation" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Relation</Label>
                <Input
                  id="relation"
                  placeholder="e.g. Father"
                  className="bg-background/50 border-primary/10 text-xs h-9 rounded-lg focus-visible:ring-primary/20"
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
              <div className="flex gap-2">
                <Select
                  value={newContact.countryCode}
                  onValueChange={(val) => setNewContact({ ...newContact, countryCode: val })}
                >
                  <SelectTrigger className="w-[100px] bg-background/50 border-primary/10 text-xs h-9 rounded-lg">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/10 shadow-2xl">
                    {countryCodes.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span className="text-muted-foreground opacity-60 font-black">{c.short}</span>
                          <span>{c.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  placeholder="10 digit number"
                  value={newContact.phone}
                  maxLength={10}
                  className="flex-1 bg-background/50 border-primary/10 text-xs h-9 rounded-lg focus-visible:ring-primary/20"
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                    setNewContact({ ...newContact, phone: val })
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button 
                onClick={addContact} 
                className="flex-1 rounded-lg h-9 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95" 
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                Add Contact
              </Button>
              <Button
                variant="outline"
                disabled={saving}
                className="rounded-lg h-9 text-xs font-bold px-4 border-primary/10 bg-white/40 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all"
                onClick={() => {
                  setIsAdding(false)
                  setNewContact({ name: "", phone: "", relation: "", countryCode: "+91" })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : !loading && contacts.length < 2 ? (
          <Button
            variant="outline"
            className="w-full border-dashed border-primary/20 bg-primary/[0.02] hover:bg-primary/[0.05] hover:border-primary/40 rounded-xl h-12 text-xs font-bold text-primary group-hover/contacts:border-primary/40 transition-all duration-300"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2 transition-transform group-hover/contacts:rotate-90 duration-500" />
            Add Trusted Contact
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
