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
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-2xl border-b border-primary/5">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-800">Messages</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Connected Health Network</p>
              </div>
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
              <HospitalChat activeTab={activeTab} />
            </TabsContent>

            <TabsContent value="ai">
              <AIHealthAssistant activeTab={activeTab} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
