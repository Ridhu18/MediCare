"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { jsPDF } from "jspdf"
import { Send, Bot, User, AlertCircle, Sparkles, Download, Paperclip, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachmentUrl?: string | null
}

const quickQuestions = [
  "What are symptoms of a heart attack?",
  "How to treat a minor burn?",
  "When should I see a doctor for fever?",
  "First aid for choking",
]

// Using Gemini API for responses now

interface AIHealthAssistantProps {
  className?: string
}

export function AIHealthAssistant({ className }: AIHealthAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    let userName = ""
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        userName = user.name ? ` ${user.name}` : ""
      } catch (e) {
        console.error("Error parsing user from localStorage", e)
      }
    }

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello${userName}! I'm your AI Health Assistant. I can help with basic health questions, first aid guidance, and symptom information. **Note:** I'm not a substitute for professional medical advice. For emergencies, please call 108 immediately.`,
        timestamp: new Date(),
      },
    ])
  }, [])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isTyping])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to reasonable sizes for base64 inline transmission (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file under 5MB.")
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() && !selectedFile) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "Uploaded a file.",
      timestamp: new Date(),
      attachmentUrl: filePreview
    }

    const currentMessages = [...messages, userMessage]
    setMessages(currentMessages)
    setInput("")

    let fileData = null;
    if (selectedFile && filePreview) {
      fileData = {
        data: filePreview.split(',')[1],
        mimeType: selectedFile.type,
      }
    }

    clearFile()
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          file: fileData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Sorry, I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting to my service right now. If you're experiencing a medical emergency, please call 108 immediately.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.setTextColor(33, 37, 41) // primary color approx
    doc.text("AI Health Assistant Chat Log", 14, 22)

    // Subtitle / Date
    doc.setFontSize(10)
    doc.setTextColor(108, 117, 125) // muted color
    doc.text(`Downloaded on: ${new Date().toLocaleString()}`, 14, 30)

    // Separator
    doc.setLineWidth(0.5)
    doc.setDrawColor(200, 200, 200)
    doc.line(14, 34, 196, 34)

    let yPosition = 45 // Start writing messages here
    const pageHeight = doc.internal.pageSize.height
    const margin = 14
    const maxWidth = 180 // Max width for text

    messages.forEach((msg) => {
      // Role Header
      const roleText = msg.role === "user" ? "You" : "AI Assistant"
      const timeText = msg.timestamp.toLocaleTimeString()

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      if (msg.role === "user") {
        doc.setTextColor(0, 102, 204) // Blueish for user
      } else {
        doc.setTextColor(34, 139, 34) // Greenish for AI
      }

      // Check if we need a new page for the header
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
      }

      doc.text(`${roleText} (${timeText})`, margin, yPosition)
      yPosition += 8

      // Body Text
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)

      // Clean up markdown formatting for plain text PDF
      let plainText = msg.content
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold asterisks
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic asterisks
        .replace(/`([^`]+)`/g, '$1')     // Remove code inline backticks
        .replace(/#{1,6}\s?/g, '')       // Remove heading hashes

      const splitText = doc.splitTextToSize(plainText, maxWidth)

      // Render text line by line, adding pages if necessary
      splitText.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage()
          yPosition = margin + 5 // slightly lower than top margin
        }
        doc.text(line, margin, yPosition)
        yPosition += 7 // line height
      })

      yPosition += 8 // space between messages

      // Add a subtle separator between messages
      if (yPosition < pageHeight - 10) {
        doc.setLineWidth(0.1)
        doc.setDrawColor(230, 230, 230)
        doc.line(margin + 5, yPosition - 4, 196 - 5, yPosition - 4)
      }
    })

    doc.save(`medicaret-chat-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Card className={cn("flex flex-col h-[calc(100vh-15rem)]", className)}>
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          AI Health Assistant
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 h-8"
          title="Download chat history"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Save PDF</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full p-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "assistant"
                      ? "bg-primary/10"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg p-3 max-w-[80%] text-sm",
                    message.role === "assistant"
                      ? "bg-muted"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="break-words space-y-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node, ...props }) => <p className="leading-relaxed" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mt-2 space-y-1" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mt-2 space-y-1" {...props} />,
                          li: ({ node, ...props }) => <li {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {message.attachmentUrl && (
                        <div className="mb-2">
                          {message.attachmentUrl.startsWith('data:image') ? (
                            <img src={message.attachmentUrl} alt="attachment" className="max-w-[200px] h-auto rounded-md border border-primary/20" />
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-primary-foreground/10 rounded-md border border-primary/20">
                              <FileText className="h-4 w-4" />
                              <span className="text-xs">File attached</span>
                            </div>
                          )}
                        </div>
                      )}
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {/* Empty div for reliable auto-scrolling */}
            <div ref={scrollRef} className="h-1" />
          </div>
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-4 pt-2 shrink-0 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2 px-1">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                className="text-xs px-3 py-1.5 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => sendMessage(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* File Preview Area */}
        {filePreview && (
          <div className="px-4 py-3 border-t bg-muted/20 relative z-10 shrink-0">
            <div className="relative inline-block group">
              {selectedFile?.type.startsWith('image/') ? (
                <img src={filePreview} alt="preview" className="h-16 w-16 object-cover rounded-md border shadow-sm" />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center bg-background rounded-md border shadow-sm flex-col">
                  <FileText className="h-6 w-6 mb-1 text-muted-foreground" />
                  <span className="truncate w-14 px-1 text-[8px] text-center text-muted-foreground">{selectedFile?.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={clearFile}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm opacity-100 hover:scale-110 transition-transform"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t shrink-0">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.csv"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isTyping}
              title="Attach a file or image"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a health question..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={(!input.trim() && !selectedFile) || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 justify-center">
            <AlertCircle className="h-3 w-3" />
            Not a substitute for professional medical advice
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
