"use client"

import { useState } from "react"
import { AppNavigation } from "@/components/app-navigation"
import { HospitalChat } from "@/components/hospital-chat"
import { AIHealthAssistant } from "@/components/ai-health-assistant"
import { MessageCircle, Bot } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("hospitals")

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />

      <main className="pb-20 md:pb-0 md:ml-20 lg:ml-64">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-primary" />
                Messages
              </h1>
              <p className="text-sm text-muted-foreground">Chat with hospitals or get AI health assistance</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="hospitals" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Hospital Chats
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hospitals">
              <HospitalChat />
            </TabsContent>

            <TabsContent value="ai">
              <AIHealthAssistant />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
