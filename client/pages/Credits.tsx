import { ArrowLeft, Github, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Credits() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunset-900 via-sunset-800 to-sunset-900">
      {/* Header */}
      <header className="border-b border-sunset-700/50 backdrop-blur-md bg-sunset-900/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-sunset-500/50">
              <svg
                width="24"
                height="24"
                className="lucide lucide-download w-6 h-6 text-white"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                SunsetDownloader
              </h1>
              <p className="text-sunset-300 text-xs">Credits & Attribution</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sunset-300 hover:text-sunset-100 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Titles */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Credits & <br />
            <span className="bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Attribution
            </span>
          </h2>
          <p className="text-sunset-300 text-lg max-w-2xl mx-auto">
            Built with love and powered by amazing open-source projects
          </p>
        </div>

        {/* Creator Section */}
        <div className="bg-gradient-to-br from-sunset-800/50 to-sunset-800/30 backdrop-blur-xl border border-sunset-700/50 rounded-2xl p-8 shadow-2xl shadow-sunset-900/50 mb-8">
          <h3 className="text-2xl font-bold text-white mb-4">Creator</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sunset-900/30 rounded-lg border border-sunset-700/50">
              <div>
                <p className="text-sunset-200 font-semibold">Clover</p>
                <p className="text-sunset-400 text-sm">
                  SunsetDownloader Creator
                </p>
              </div>
              <a
                href="https://guns.lol/clover."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-sunset-500/20 hover:bg-sunset-500/30 border border-sunset-500/50 rounded-lg text-sunset-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                guns.lol/clover.
              </a>
            </div>
          </div>
        </div>

        {/* Technologies Section */}
        <div className="bg-gradient-to-br from-sunset-800/50 to-sunset-800/30 backdrop-blur-xl border border-sunset-700/50 rounded-2xl p-8 shadow-2xl shadow-sunset-900/50 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            Technologies Used
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frontend */}
            <div className="space-y-3">
              <h4 className="text-sunset-200 font-semibold mb-3">Frontend</h4>
              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  React 18
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://vitejs.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Vite
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://www.typescriptlang.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  TypeScript
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://tailwindcss.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  TailwindCSS
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://www.radix-ui.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Radix UI
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
            </div>

            {/* Backend */}
            <div className="space-y-3">
              <h4 className="text-sunset-200 font-semibold mb-3">Backend</h4>
              <a
                href="https://expressjs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Express.js
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://nodejs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Node.js
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://www.netlify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Netlify Functions
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
              >
                <span className="text-sunset-300 group-hover:text-sunset-100">
                  Supabase
                </span>
                <ExternalLink className="w-4 h-4 text-sunset-400" />
              </a>
            </div>
          </div>
        </div>

        {/* APIs & Services Section */}
        <div className="bg-gradient-to-br from-sunset-800/50 to-sunset-800/30 backdrop-blur-xl border border-sunset-700/50 rounded-2xl p-8 shadow-2xl shadow-sunset-900/50 mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">
            APIs & Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://www.mailersend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
            >
              <div>
                <p className="text-sunset-300 font-semibold group-hover:text-sunset-100">
                  MailerSend
                </p>
                <p className="text-sunset-500 text-xs">Email Service</p>
              </div>
              <ExternalLink className="w-4 h-4 text-sunset-400" />
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
            >
              <div>
                <p className="text-sunset-300 font-semibold group-hover:text-sunset-100">
                  Discord Webhooks
                </p>
                <p className="text-sunset-500 text-xs">Notifications</p>
              </div>
              <ExternalLink className="w-4 h-4 text-sunset-400" />
            </a>
            <a
              href="https://lucide.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
            >
              <div>
                <p className="text-sunset-300 font-semibold group-hover:text-sunset-100">
                  Lucide Icons
                </p>
                <p className="text-sunset-500 text-xs">Icon Library</p>
              </div>
              <ExternalLink className="w-4 h-4 text-sunset-400" />
            </a>
            <a
              href="https://www.builder.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-sunset-900/30 hover:bg-sunset-900/50 rounded-lg border border-sunset-700/50 transition-colors group"
            >
              <div>
                <p className="text-sunset-300 font-semibold group-hover:text-sunset-100">
                  Builder.io
                </p>
                <p className="text-sunset-500 text-xs">Development Platform</p>
              </div>
              <ExternalLink className="w-4 h-4 text-sunset-400" />
            </a>
          </div>
        </div>

        {/* Open Source Section */}
        <div className="bg-gradient-to-br from-sunset-800/50 to-sunset-800/30 backdrop-blur-xl border border-sunset-700/50 rounded-2xl p-8 shadow-2xl shadow-sunset-900/50">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Github className="w-6 h-6" />
            Open Source
          </h3>
          <p className="text-sunset-300 mb-6">
            SunsetDownloader is built on the foundations of amazing open-source
            projects. We're grateful to the entire community for their
            contributions.
          </p>
          <a
            href="https://github.com/PerryThePlatypusm/sunset-downloader"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sunset-500 to-pink-500 hover:from-sunset-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all shadow-lg shadow-sunset-500/50"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-sunset-700/50 text-center">
          <p className="text-sunset-400 text-sm">
            © 2026 SunsetDownloader. All rights reserved. Made with ❤️ by
            Clover
          </p>
        </div>
      </main>
    </div>
  );
}
