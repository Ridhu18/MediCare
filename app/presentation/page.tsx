"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Stethoscope, 
  ShieldAlert, 
  BrainCircuit, 
  QrCode, 
  Layers, 
  LineChart,
  Users,
  MapPin,
  MessageSquare,
  CreditCard,
  History,
  Info
} from "lucide-react"

// Slide Data
const slides = [
  {
    title: "Medicare+",
    subtitle: "Digital Healthcare & Emergency Response Platform",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 text-left">
        <div className="space-y-4">
          <h3 className="text-blue-400 font-semibold uppercase tracking-widest text-sm">Project Members</h3>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-2xl font-bold">Ridham</p>
            <p className="text-slate-400">Roll No: IT099 | ID: 22ITUON047</p>
            <p className="text-slate-500 text-sm mt-4 italic">Web Development Internship Training</p>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-emerald-400 font-semibold uppercase tracking-widest text-sm">Project Guides</h3>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4">
            <div>
              <p className="text-slate-400 text-sm">Internal Guide</p>
              <p className="text-xl font-semibold">Prof. Shweta Jambukia</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">External Guide</p>
              <p className="text-xl font-semibold">Miss. Janvi Shah</p>
            </div>
          </div>
        </div>
      </div>
    ),
    icon: <Stethoscope className="w-16 h-16 text-blue-500" />
  },
  {
    title: "Project Overview",
    subtitle: "Objective & Architecture",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 text-left">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5" /> Mission
            </h4>
            <p className="text-slate-300">A unified digital platform designed to streamline patient care, hospital administration, and emergency response using modern AI and real-time tech.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
              <LineChart className="w-5 h-5" /> Objectives
            </h4>
            <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
              <li>Minimize emergency response time via SOS.</li>
              <li>Centralize medical history with ABHA standards.</li>
              <li>Leverage AI for preliminary diagnostics.</li>
              <li>Automate hospital bed & ward management.</li>
            </ul>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-slate-950/50 border border-white/5 backdrop-blur-xl">
          <h4 className="text-slate-400 font-semibold mb-4 text-center">Modern Tech Stack</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              "Next.js 16 / React 19", "Node.js / Express",
              "MongoDB / Mongoose", "Google Gemini AI",
              "Socket.io (Real-time)", "Leaflet.js Maps",
              "Tailwind CSS", "Razorpay Payments"
            ].map(tech => (
              <div key={tech} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center hover:border-blue-500/50 transition-colors">
                {tech}
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-blue-400 font-bold">3-Tier MVC Architecture</p>
          </div>
        </div>
      </div>
    ),
    icon: <Layers className="w-16 h-16 text-emerald-500" />
  },
  {
    title: "Summary of Work Done",
    subtitle: "Codebase Statistics & Implementation",
    content: (
      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-white/10">
              <th className="p-4 font-bold text-blue-400">Metric</th>
              <th className="p-4 font-bold text-emerald-400">Value / Description</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 divide-y divide-white/5">
            {[
              ["System Design Model", "Agile / MVC Three-Tier & Real-time Edge"],
              ["Use Cases Prepared", "26 Functional Scenarios (Patient, Doctor, Admin)"],
              ["Sequence Diagrams", "7 Complex Workflows (SOS, AI, Booking)"],
              ["Core Mongoose Models", "User, Doctor, Appointment, SOS, Ward, Message, etc."],
              ["Lines of Code (Total)", "~23,540 Lines across 128 Files"],
              ["Implemented Modules", "Auth, SOS, AI assistant, Health Card, Booking, Chat"],
              ["Validation Cycles", "34 End-to-End Integration & Unit Test Cases"],
            ].map(([label, value]) => (
              <tr key={label} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium">{label}</td>
                <td className="p-4 opacity-80">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    icon: <LineChart className="w-16 h-16 text-indigo-500" />
  },
  {
    title: "Emergency SOS Alert System",
    subtitle: "Critical Response & Mapping",
    content: (
      <div className="grid grid-cols-2 gap-8 mt-8 text-left text-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-rose-400 font-bold mb-1 uppercase text-xs tracking-wider">(i) Use Case & SRS</h4>
            <p className="text-slate-400">Triggers immediate GPS broadcast to hospital admins via WebSockets. Reduces dispatch latency during cardiac/accidental crises.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-rose-400 font-bold mb-1 uppercase text-xs tracking-wider">(ii) Sequence Diagram</h4>
            <p className="text-slate-400 italic">Patient Device {"->"} Capture GPS {"->"} Socket.io Broadcast {"->"} Server Save {"->"} Admin UI Alert (Sound).</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-rose-400 font-bold mb-1 uppercase text-xs tracking-wider">(iii) DB Tables & Classes</h4>
            <p className="text-slate-400">Models: `Emergency.js`, `User.js`. Classes: `SOSButton`, `EmergencyController`.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 px-3 py-1 bg-rose-600 rounded-full text-[10px] font-bold text-white">(iv) SCREENSHOT AREA</div>
          <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 animate-pulse" />
          <h4 className="text-rose-300 font-bold mb-2">SOS Activation View</h4>
          <p className="text-slate-500 text-xs mt-2 italic">[Insert your SOS activation or Admin alert screenshot here]</p>
        </div>
      </div>
    ),
    icon: <ShieldAlert className="w-16 h-16 text-rose-500" />
  },
  {
    title: "AI Health Assistant",
    subtitle: "Intelligent Guidance & Document Parsing",
    content: (
      <div className="grid grid-cols-2 gap-8 mt-8 text-left text-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-indigo-400 font-bold mb-1 uppercase text-xs tracking-wider">(i) Use Case & SRS</h4>
            <p className="text-slate-400">Automated triage and multi-modal lab report analysis (PDF/Images) using Google Gemini LLM API.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-indigo-400 font-bold mb-1 uppercase text-xs tracking-wider">(ii) Sequence Diagram</h4>
            <p className="text-slate-400 italic">User Upload {"->"} PDF Extract {"->"} Gemini API Inference {"->"} JSON Result {"->"} Dashboard Render.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-indigo-400 font-bold mb-1 uppercase text-xs tracking-wider">(iii) DB Tables & Classes</h4>
            <p className="text-slate-400">Models: `MedicalRecord.js`. Classes: `AIHealthAssistant`, `GeminiService`.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-bold text-white">(iv) SCREENSHOT AREA</div>
          <BrainCircuit className="w-16 h-16 text-indigo-500 mb-4 animate-[spin_3s_linear_infinite]" />
          <h4 className="text-indigo-300 font-bold mb-2">AI Report Analysis View</h4>
          <p className="text-slate-500 text-xs mt-2 italic">[Insert your AI Assistant or Medical Analysis screenshot here]</p>
        </div>
      </div>
    ),
    icon: <BrainCircuit className="w-16 h-16 text-indigo-500" />
  },
  {
    title: "ABHA Digital Health Card",
    subtitle: "Standards-Compliant Medical Identity",
    content: (
      <div className="grid grid-cols-2 gap-8 mt-8 text-left text-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-emerald-400 font-bold mb-1 uppercase text-xs tracking-wider">(i) Use Case & SRS</h4>
            <p className="text-slate-400">Generates scannable QR codes for instant patient identity and medical profile retrieval in emergencies.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-emerald-400 font-bold mb-1 uppercase text-xs tracking-wider">(ii) Sequence Diagram</h4>
            <p className="text-slate-400 italic">User Selection {"->"} ABHA Logic {"->"} QR Generation {"->"} Glassmorphism Overlay Rendering.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-emerald-400 font-bold mb-1 uppercase text-xs tracking-wider">(iii) DB Tables & Classes</h4>
            <p className="text-slate-400">Models: `User.js` (healthId, profile). Classes: `DigitalHealthCard`.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 px-3 py-1 bg-emerald-600 rounded-full text-[10px] font-bold text-white">(iv) SCREENSHOT AREA</div>
          <QrCode className="w-16 h-16 text-emerald-500 mb-4" />
          <h4 className="text-emerald-300 font-bold mb-2">Health Card & QR View</h4>
          <p className="text-slate-500 text-xs mt-2 italic">[Insert your Health Card or Profile QR screenshot here]</p>
        </div>
      </div>
    ),
    icon: <QrCode className="w-16 h-16 text-emerald-500" />
  },
  {
    title: "Appointment Lifecycle",
    subtitle: "Patient Booking & Clinical Notes",
    content: (
      <div className="grid grid-cols-2 gap-8 mt-8 text-left text-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-blue-400 font-bold mb-1 uppercase text-xs tracking-wider">(i) Use Case & SRS</h4>
            <p className="text-slate-400">End-to-end booking flow from discovery to consultation completion with Razorpay integration.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-blue-400 font-bold mb-1 uppercase text-xs tracking-wider">(ii) Sequence Diagram</h4>
            <p className="text-slate-400 italic">Patient Book {"->"} Admin Confirm {"->"} Razorpay Webhook {"->"} Doctor Consultation {"->"} Record Close.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-blue-400 font-bold mb-1 uppercase text-xs tracking-wider">(iii) DB Tables & Classes</h4>
            <p className="text-slate-400">Models: `Appointment.js`, `MedicalRecord.js`. Classes: `BookingForm`, `DoctorDashboard`.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 px-3 py-1 bg-blue-600 rounded-full text-[10px] font-bold text-white">(iv) SCREENSHOT AREA</div>
          <History className="w-16 h-16 text-blue-500 mb-4" />
          <h4 className="text-blue-300 font-bold mb-2">Doctor Consultation View</h4>
          <p className="text-slate-500 text-xs mt-2 italic">[Insert your Appointment List or Clinical Notes screenshot here]</p>
        </div>
      </div>
    ),
    icon: <History className="w-16 h-16 text-blue-500" />
  },
  {
    title: "Resource Management",
    subtitle: "Hospital Beds, Wards & Ambulances",
    content: (
      <div className="grid grid-cols-2 gap-8 mt-8 text-left text-sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-amber-400 font-bold mb-1 uppercase text-xs tracking-wider">(i) Use Case & SRS</h4>
            <p className="text-slate-400">Real-time status tracking of hospital resources to optimize patient placement and emergency dispatch.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-amber-400 font-bold mb-1 uppercase text-xs tracking-wider">(ii) Sequence Diagram</h4>
            <p className="text-slate-400 italic">Admin Update {"->"} MongoDB Sync {"->"} Client Broadcast {"->"} Ward Grid Dashboard Refresh.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-amber-400 font-bold mb-1 uppercase text-xs tracking-wider">(iii) DB Tables & Classes</h4>
            <p className="text-slate-400">Models: `Ward.js`, `Hospital.js`. Classes: `WardCard`, `AdminResources`.</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center relative overflow-hidden">
          <div className="absolute top-2 right-4 px-3 py-1 bg-amber-600 rounded-full text-[10px] font-bold text-white">(iv) SCREENSHOT AREA</div>
          <Layers className="w-16 h-16 text-amber-500 mb-4" />
          <h4 className="text-amber-300 font-bold mb-2">Hospital Resource Dashboard</h4>
          <p className="text-slate-500 text-xs mt-2 italic">[Insert your Ward Management or Admin Dashboard screenshot here]</p>
        </div>
      </div>
    ),
    icon: <History className="w-16 h-16 text-amber-500" />
  }
]

export default function PresentationPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, skipSnaps: false })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
  }, [emblaApi, onSelect])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") scrollNext()
      if (e.key === "ArrowLeft") scrollPrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [scrollNext, scrollPrev])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-center items-center overflow-hidden relative selection:bg-blue-500/30">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4" />

      <main className="w-full max-w-7xl px-4 md:px-8 relative z-10 h-screen flex flex-col items-center justify-center">
        <div className="w-full overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {slides.map((slide, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 px-4 md:px-8 py-12">
                <div className="glass p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] flex flex-col items-center text-center transition-all duration-700">
                  <div className="mb-6 md:mb-8 p-4 md:p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
                    {slide.icon}
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    {slide.title}
                  </h1>
                  <p className="text-lg md:text-xl text-slate-400 font-medium tracking-wide">
                    {slide.subtitle}
                  </p>

                  <div className="w-full mt-4 md:mt-8">
                    {slide.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Navigation Controls */}
      <div className="fixed bottom-8 md:bottom-12 left-0 right-0 flex items-center justify-center gap-6 md:gap-12 z-50">
        <button
          onClick={scrollPrev}
          className="p-3 md:p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-blue-500/50 active:scale-95 disabled:opacity-20"
          disabled={selectedIndex === 0}
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <div className="flex gap-2 md:gap-4">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === selectedIndex ? "w-8 md:w-12 bg-blue-500" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          onClick={scrollNext}
          className="p-3 md:p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all hover:border-emerald-500/50 active:scale-95 disabled:opacity-20"
          disabled={selectedIndex === slides.length - 1}
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </div>

      <div className="fixed top-6 right-6 md:top-8 md:right-8 text-slate-500 flex items-center gap-2 text-xs md:text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md uppercase tracking-widest font-bold">
        <Info className="w-4 h-4" /> Slide {selectedIndex + 1} / {slides.length}
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-slate-600 text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] hidden sm:block">
        Use Arrow Keys or Space to Navigate
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        body {
          background-color: #020617;
          font-family: 'Outfit', sans-serif;
        }

        .glass {
          position: relative;
          overflow: hidden;
        }

        .glass::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.03),
            transparent
          );
          transform: skewX(-25deg);
          transition: 0.75s;
        }

        .glass:hover::before {
          left: 150%;
        }
      `}</style>
    </div>
  )
}
