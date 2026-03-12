"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Search,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  ImageIcon,
  Check,
  CheckCheck,
  Download,
} from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import Loading from "./loading"
import io, { Socket } from "socket.io-client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Conversation {
  userId: string
  patientName: string
  lastMessage: string
  time: string
  unread: number
  status: "online" | "offline"
  type: "emergency" | "appointment" | "general"
}

interface ChatMessage {
  _id: string
  senderId: string | any
  receiverId: string | any
  senderModel: "User" | "Hospital"
  receiverModel: "User" | "Hospital"
  content?: string
  fileUrl?: string
  fileType?: string
  timestamp: string | Date
  status: "sent" | "delivered" | "read"
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [hospitalAuth, setHospitalAuth] = useState<any>(null)
  const [hospitals, setHospitals] = useState<any[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Admin's default Hospital
  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/hospitals")
        if (res.ok) {
          const allHospitals = await res.json()

          let adminHospitals = allHospitals
          const userStr = localStorage.getItem("user")
          if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role === 'admin') {
              if (user.hospitalIds && user.hospitalIds.length > 0) {
                adminHospitals = allHospitals.filter((h: any) => user.hospitalIds.includes(h._id))
              } else {
                adminHospitals = []
              }
            }
          }

          setHospitals(adminHospitals)
          if (adminHospitals.length > 0) {
            setHospitalAuth(adminHospitals[0]) // Act as first hospital

            const newSocket = io("http://localhost:5000")
            setSocket(newSocket)

            newSocket.on("receive_message", (message: ChatMessage) => {
              setMessages((prev) => [...prev, message])

              // update conversation list if new message arrives
              setConversations(prev => {
                const match = prev.find(c => c.userId === message.senderId || c.userId === message.receiverId)
                if (match) {
                  const previewMessage = message.content || (message.fileUrl ? "Attachment" : "New message");
                  return prev.map(c => c.userId === match.userId ? { ...c, lastMessage: previewMessage, time: new Date().toISOString() } : c)
                } else {
                  // Add new conversation if not found (simple reload for now)
                  fetchConversations(adminHospitals[0]._id)
                  return prev
                }
              })
            })

            fetchConversations(adminHospitals[0]._id)
          }
        }
      } catch (err) {
        console.error("Failed to initialize admin chat", err)
      }
    }
    initChat()

    return () => {
      if (socket) socket.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversations = async (hospitalId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/messages/hospital/${hospitalId}/conversations`)
      if (res.ok) {
        setConversations(await res.json())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleHospitalChange = (value: string) => {
    const selected = hospitals.find(h => h._id === value)
    if (selected) {
      setHospitalAuth(selected)
      setConversations([])
      setMessages([])
      setSelectedConversation(null)
      fetchConversations(selected._id)
    }
  }

  // 2. Fetch messages on conversation select
  useEffect(() => {
    if (selectedConversation && hospitalAuth && socket) {
      const room = `${selectedConversation.userId}_${hospitalAuth._id}`
      socket.emit("join_room", room)

      const fetchMessages = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/messages/${selectedConversation.userId}/${hospitalAuth._id}`)
          if (res.ok) {
            setMessages(await res.json())
          }

          // Mark messages as read
          await fetch(`http://localhost:5000/api/messages/read`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: selectedConversation.userId,
              receiverId: hospitalAuth._id
            })
          })

          // Clear unread badge locally
          setConversations(prev => prev.map(c =>
            c.userId === selectedConversation.userId
              ? { ...c, unread: 0 }
              : c
          ))
        } catch (err) {
          console.error("Failed to fetch messages:", err)
        }
      }
      fetchMessages()
    }
  }, [selectedConversation, hospitalAuth, socket])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const filteredConversations = conversations.filter((c) =>
    (c.patientName || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = async () => {
    if (!selectedConversation || !hospitalAuth || !socket) return
    if (!newMessage.trim() && !selectedFile) return

    const room = `${selectedConversation.userId}_${hospitalAuth._id}`
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
      senderId: hospitalAuth._id,
      receiverId: selectedConversation.userId,
      senderModel: "Hospital",
      receiverModel: "User",
      content: newMessage,
      fileUrl,
      fileType,
      room
    }

    socket.emit("send_message", messageData)
    setNewMessage("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const getTypeBadge = (type: Conversation["type"]) => {
    switch (type) {
      case "emergency":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs">
            Emergency
          </Badge>
        )
      case "appointment":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-xs">
            Appointment
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            General
          </Badge>
        )
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
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col h-screen">
          <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-6">
              <Link href="/admin" className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Patient Messages</h1>
                <p className="text-sm text-muted-foreground">
                  Communicate with patients in real-time
                </p>
              </div>
              <div className="ml-auto w-64">
                <Select
                  value={hospitalAuth?._id || ""}
                  onValueChange={handleHospitalChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Hospital Context" />
                  </SelectTrigger>
                  <SelectContent>
                    {hospitals.map(h => (
                      <SelectItem key={h._id} value={h._id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Conversation List */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b ${selectedConversation?.userId === conversation.userId
                      ? "bg-muted"
                      : ""
                      }`}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(conversation.patientName || "U")
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.status === "online" && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {conversation.patientName}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(conversation.time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeBadge(conversation.type)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground">
                        {conversation.unread}
                      </Badge>
                    )}
                  </button>
                ))}
                {filteredConversations.length === 0 && (
                  <p className="text-center text-muted-foreground p-4">No conversations found.</p>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(selectedConversation.patientName || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold">
                        {selectedConversation.patientName}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedConversation.status === "online"
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isHospital = message.senderModel === "Hospital"

                      return (
                        <div
                          key={message._id || Math.random().toString()}
                          className={`flex ${isHospital
                            ? "justify-end"
                            : "justify-start"
                            }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${isHospital
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                              }`}
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
                            {message.content && <p className="break-words">{message.content}</p>}
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 ${isHospital
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                                }`}
                            >
                              <span className="text-xs">{formatTime(message.timestamp)}</span>
                              {isHospital && (
                                <>
                                  {message.status === "read" ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t flex flex-col gap-2">
                  {selectedFile && (
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-md w-fit text-sm">
                      <Paperclip className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-2" onClick={() => {
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
                      handleSendMessage()
                    }}
                    className="flex items-center gap-2 w-full">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1"
                      disabled={isUploading}
                    />
                    <Button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isUploading}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </Suspense>
  )
}
