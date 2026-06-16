"use client";

import { useState } from "react";

import { ChatWidget } from "@/components/ChatWidget";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const openChat = () => setChatOpen(true);

  return (
    <div className="flex min-h-full flex-col">
      <Nav onContactClick={openChat} />

      <main className="flex-1">
        <Hero onContactClick={openChat} />
        <Features />
      </main>

      <Footer onContactClick={openChat} />

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
