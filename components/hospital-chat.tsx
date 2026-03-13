"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, Building2, Paperclip, ImageIcon, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import io, { Socket } from "socket.io-client"

interface ChatMessage {
  _id: string
  senderId: string
  receiverId: string
  senderModel: "User" | "Hospital"
  receiverModel: "User" | "Hospital"
  content?: string
  fileUrl?: string
  fileType?: string
  timestamp: string | Date
  status: "sent" | "delivered" | "read"
}

interface Hospital {
  _id: string
  name: string
  image?: string
}

interface HospitalChatProps {
  activeTab?: string
}

export function HospitalChat({ activeTab }: HospitalChatProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Initialize user and socket
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setCurrentUser(user)

      const newSocket = io("http://localhost:5000")
      setSocket(newSocket)

      newSocket.on("receive_message", (message: ChatMessage) => {
        setMessages((prev) => [...prev, message])
      })

      return () => {
        newSocket.disconnect()
      }
    }
  }, [])

  // 2. Fetch Hospitals list
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/hospitals")
        if (res.ok) {
          const data = await res.json()
          setHospitals(data)
        }
      } catch (err) {
        console.error("Failed to fetch hospitals:", err)
      }
    }
    fetchHospitals()
  }, [])

  // 3. Fetch chat history and join room when hospital is selected
  useEffect(() => {
    if (selectedHospital && currentUser && socket) {
      const room = `${currentUser.id}_${selectedHospital._id}`
      socket.emit("join_room", room)

      const fetchMessages = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/messages/${currentUser.id}/${selectedHospital._id}`)
          if (res.ok) {
            const data = await res.json()
            setMessages(data)
          }
        } catch (err) {
          console.error("Failed to fetch messages:", err)
        }
      }
      fetchMessages()
    }
  }, [selectedHospital, currentUser, socket])

  // Scroll to bottom on new messages or when tab becomes active
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: activeTab === "hospitals" ? "auto" : "smooth" })
    }
  }, [messages, activeTab])

  const sendMessage = async () => {
    if (!selectedHospital || !currentUser || !socket) return
    if (!input.trim() && !selectedFile) return

    const room = `${currentUser.id}_${selectedHospital._id}`

    let fileUrl = ""
    let fileType = ""

    if (selectedFile) {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)

      try {
        const res = await fetch("http://localhost:5000/api/messages/upload", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          fileUrl = data.fileUrl
          fileType = data.fileType
        }
      } catch (err) {
        console.error("Upload failed", err)
      } finally {
        setIsUploading(false)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    }

    const messageData = {
      senderId: currentUser.id,
      receiverId: selectedHospital._id,
      senderModel: "User",
      receiverModel: "Hospital",
      content: input,
      fileUrl,
      fileType,
      room
    }

    socket.emit("send_message", messageData)
    setInput("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border border-primary/10 rounded-2xl overflow-hidden bg-background/50 backdrop-blur-xl shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 -z-10" />
      {/* Hospital List */}
      <div className={cn(
        "w-full md:w-80 border-r bg-background/40 backdrop-blur-md z-10",
        selectedHospital && "hidden md:block"
      )}>
        <div className="p-6 border-b">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary/70">Hospitals</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-257px)] min-h-[443px]">
          {hospitals.map((hospital) => (
            <button
              key={hospital._id}
              onClick={() => setSelectedHospital(hospital)}
              className={cn(
                "w-full p-4 text-left transition-all duration-300 border-b border-border/40 group",
                selectedHospital?._id === hospital._id ? "bg-primary/10" : "hover:bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {hospital.image ? (
                    <AvatarImage src={`http://localhost:5000${hospital.image}`} alt={hospital.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 flex items-center h-10">
                  <span className="font-medium truncate">{hospital.name}</span>
                </div>
              </div>
            </button>
          ))}
          {hospitals.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading hospitals...</div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      {selectedHospital ? (
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b bg-background/40 backdrop-blur-md flex items-center gap-4 sticky top-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full h-10 w-10 hover:bg-primary/10 text-primary"
              onClick={() => setSelectedHospital(null)}
            >
              Back
            </Button>
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20 ring-2 ring-primary/5">
                {selectedHospital?.image && <AvatarImage src={`http://localhost:5000${selectedHospital.image}`} />}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background ring-1 ring-success/20" />
            </div>
            <div>
              <h3 className="font-bold text-base">{selectedHospital?.name}</h3>
              <p className="text-[10px] font-bold uppercase tracking-wide text-success">Official Account • Online</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-[calc(100vh-344px)] min-h-[356px]">
            <div className="space-y-4">
              {messages.map((message) => {
                const isUser = message.senderModel === "User"
                return (
                  <div
                    key={message._id || Math.random().toString()}
                    className={cn(
                      "flex gap-3",
                      isUser && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={cn(
                          !isUser
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        )}
                      >
                        {!isUser ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "rounded-2xl p-4 max-w-[75%] shadow-sm transition-all duration-300",
                        isUser
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border/50 rounded-tl-none"
                      )}
                    >
                      {message.fileUrl && (
                        <div className="mb-2 relative group">
                          {message.fileType?.startsWith("image/") ? (
                            <div className="relative inline-block">
                              <img src={`http://localhost:5000${message.fileUrl}`} alt="attachment" className="rounded-md max-w-full h-auto max-h-[200px]" />
                              <a
                                href={`http://localhost:5000${message.fileUrl}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download Image"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <a href={`http://localhost:5000${message.fileUrl}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 p-2 bg-background/20 rounded border hover:bg-background/40 transition-colors text-sm">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">View Attachment</span>
                              </a>
                              <a
                                href={`http://localhost:5000${message.fileUrl}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-background/20 rounded border hover:bg-background/40 transition-colors"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {message.content && <p className="text-sm">{message.content}</p>}
                      <p
                        className={cn(
                          "text-xs mt-1",
                          isUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-4">
                  Send a message to start the conversation
                </div>
              )}
              {/* Bottom anchor for scrolling */}
              <div ref={scrollRef} className="h-1" />
            </div>
          </ScrollArea>

          <div className="p-4 border-t flex flex-col gap-3 bg-background/40 backdrop-blur-md relative z-10">
            {selectedFile && (
              <div className="flex items-center gap-3 bg-primary/10 p-2.5 rounded-xl border border-primary/20 w-fit text-xs font-semibold text-primary animate-in fade-in slide-in-from-bottom-2">
                <Paperclip className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{selectedFile?.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-1 hover:bg-primary/20 rounded-full" onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}>
                  ✕
                </Button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40 focus-within:border-primary/40 focus-within:bg-background/60 transition-all duration-300"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-none bg-transparent focus-visible:ring-0 px-1 placeholder:text-muted-foreground/60 h-10"
                disabled={isUploading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={(!input.trim() && !selectedFile) || isUploading}
                className="h-10 w-10 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all bg-gradient-to-br from-primary to-primary/80"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a hospital to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}
