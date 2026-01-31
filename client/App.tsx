import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTypingTitle } from "@/hooks/use-typing-title";
import { AudioProvider } from "@/context/AudioContext";
import RainyBackground from "@/components/RainyBackground";
import BackgroundAudio from "@/components/BackgroundAudio";
import RainSoundEffect from "@/components/RainSoundEffect";
import Index from "./pages/Index";
import Credits from "./pages/Credits";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useTypingTitle("Sunset Downloader", 100);

  return (
    <AudioProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RainyBackground />
          <BackgroundAudio />
          <RainSoundEffect />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AudioProvider>
  );
};

export default AppContent;
