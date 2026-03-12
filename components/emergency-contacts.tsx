import { useState, useEffect } from "react"
import { Plus, Trash2, Phone, User, Edit2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" })

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const res = await fetch("http://localhost:5000/api/auth/me", {
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
      const res = await fetch("http://localhost:5000/api/auth/me", {
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
    if (!newContact.name || !newContact.phone) {
      toast.error("Name and phone are required")
      return
    }

    const updatedContacts = [...contacts, newContact]
    await updateContactsOnServer(updatedContacts)
    setNewContact({ name: "", phone: "", relation: "" })
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Emergency Contacts</CardTitle>
          <span className="text-sm text-muted-foreground">{contacts.length}/2</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : contacts.length === 0 && !isAdding ? (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
            No emergency contacts added.
          </div>
        ) : (
          contacts.map((contact: Contact) => (
            <div
              key={contact._id || contact.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {contact.relation} • {contact.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                  onClick={() => callContact(contact.phone)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={saving}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeContact(contact._id || contact.id)}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))
        )}

        {isAdding ? (
          <div className="space-y-3 p-3 border border-dashed rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="relation" className="text-xs">Relation</Label>
                <Input
                  id="relation"
                  placeholder="e.g., Mother"
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs">Phone</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addContact} className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setIsAdding(false)
                  setNewContact({ name: "", phone: "", relation: "" })
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : !loading && contacts.length < 2 ? (
          <Button
            variant="outline"
            className="w-full border-dashed bg-transparent"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Emergency Contact
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
