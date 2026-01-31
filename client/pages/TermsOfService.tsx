import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-sunset-700/50 backdrop-blur-md bg-sunset-900/50">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="text-sunset-400 hover:text-sunset-300 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sunset-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Terms of Service
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Warning Banner */}
          <div className="mb-8 p-4 rounded-lg bg-orange-500/20 border border-orange-500/50 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-orange-200 font-semibold">Legal Disclaimer</p>
              <p className="text-orange-300 text-sm mt-1">
                These Terms of Service are for informational purposes. Users should consult with qualified legal counsel for their specific jurisdiction before using this service.
              </p>
            </div>
          </div>

          <div className="space-y-8 text-sunset-200">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction & Acceptance</h2>
              <p className="mb-4">
                Welcome to SunsetDownloader ("Service," "we," "us," "our"). These Terms of Service ("Terms") constitute a legal agreement between you ("User," "you," "your") and SunsetDownloader regarding your use of our website, application, and all related services.
              </p>
              <p>
                By accessing, using, or attempting to use this Service, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must immediately cease using the Service.
              </p>
            </section>

            {/* User Responsibility */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. User Responsibility & Liability</h2>
              <p className="mb-4 font-semibold text-sunset-100">
                USERS ARE SOLELY AND ENTIRELY RESPONSIBLE FOR ALL CONTENT THEY DOWNLOAD OR OBTAIN THROUGH THE SERVICE.
              </p>
              <ul className="space-y-3 list-disc list-inside">
                <li>
                  <span className="font-semibold">All Legal Responsibility:</span> You assume complete responsibility for understanding and complying with all applicable federal, state, local, and international laws regarding any content you download or access.
                </li>
                <li>
                  <span className="font-semibold">Copyright Compliance:</span> You are solely responsible for ensuring that your use of downloaded content does not infringe upon any copyrights, trademarks, patents, or intellectual property rights held by any third party.
                </li>
                <li>
                  <span className="font-semibold">Prohibited Uses:</span> You may not use the Service to download content in violation of the Terms of Service or intellectual property policies of any content provider or platform.
                </li>
                <li>
                  <span className="font-semibold">No Liability to Provider:</span> SunsetDownloader is not responsible, liable, or accountable for any damages, claims, legal actions, or consequences arising from your use of downloaded content.
                </li>
              </ul>
            </section>

            {/* Copyright & Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Copyright & Intellectual Property</h2>
              <p className="mb-4">
                <span className="font-semibold">SunsetDownloader is a Tool Only:</span> We provide a technical tool for downloading content from publicly accessible platforms. We do not host, store, distribute, or control any copyrighted material.
              </p>
              <p className="mb-4">
                <span className="font-semibold">No Endorsement:</span> By providing access to these tools, we do not endorse, approve, or authorize any copyright infringement or violation of intellectual property rights.
              </p>
              <p className="mb-4">
                <span className="font-semibold">User's Legal Obligation:</span> Users must independently verify that they have the legal right to download and use any content before proceeding. This includes:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Checking the content provider's Terms of Service</li>
                <li>Verifying the content's copyright status</li>
                <li>Ensuring your intended use is permitted under applicable law</li>
                <li>Obtaining necessary licenses or permissions if required</li>
              </ul>
            </section>

            {/* DMCA Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. DMCA & Anti-Circumvention</h2>
              <p className="mb-4">
                SunsetDownloader does not circumvent, disable, or interfere with any technological protection measures, Digital Rights Management (DRM), or copy protection mechanisms. Users are responsible for complying with all applicable anti-circumvention laws.
              </p>
              <p>
                If you believe your copyrighted content has been unlawfully downloaded through this Service, please contact the relevant content provider directly to initiate appropriate legal proceedings. SunsetDownloader is a neutral tool provider and does not control user actions.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability & Indemnification</h2>
              <p className="mb-4 font-semibold text-sunset-100">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SUNSETDOWNLOADER SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Any copyright infringement claims or copyright-related damages</li>
                <li>Any intellectual property rights violations</li>
                <li>Trademark or patent infringement claims</li>
                <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
                <li>Loss of data, revenue, or profits arising from downloaded content</li>
                <li>Any legal action, settlement, or judgment against the User</li>
                <li>Content moderation or takedown requests from third parties</li>
                <li>Any harm or damage caused by the use of downloaded content</li>
              </ul>
              <p className="mt-4 font-semibold text-sunset-100">
                USERS AGREE TO INDEMNIFY AND HOLD HARMLESS SUNSETDOWNLOADER FROM ANY LEGAL ACTION, CLAIM, OR LIABILITY ARISING FROM THEIR USE OF THE SERVICE OR DOWNLOADED CONTENT.
              </p>
            </section>

            {/* Permitted Use */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Permitted Uses</h2>
              <p className="mb-4">
                This Service may only be used for downloading content that you have a legal right to download and use. Permitted uses may include:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Personal, non-commercial use of content you own or have permission to use</li>
                <li>Educational purposes where permitted by copyright holders</li>
                <li>Downloading content with explicit Creative Commons or open-source licenses</li>
                <li>Downloading content where you have purchased a license to do so</li>
                <li>Downloading content in the public domain</li>
              </ul>
            </section>

            {/* Prohibited Uses */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Uses</h2>
              <p className="mb-4">
                Users are strictly prohibited from using the Service to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Download copyrighted content without proper authorization or license</li>
                <li>Distribute, sell, or commercially exploit downloaded content</li>
                <li>Violate any content provider's Terms of Service or Usage Policies</li>
                <li>Circumvent any technological protection or DRM mechanisms</li>
                <li>Upload copyrighted content to unauthorized platforms</li>
                <li>Use downloaded content for commercial purposes without permission</li>
                <li>Remove or alter any copyright notices or metadata</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            {/* No Warranties */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimers & No Warranties</h2>
              <p className="mb-4 font-semibold text-sunset-100">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OF ANY KIND.
              </p>
              <p className="mb-4">
                SunsetDownloader makes no representations or warranties regarding:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>The legality of downloading specific content</li>
                <li>Fitness for any particular purpose</li>
                <li>Merchantability or quality of the Service</li>
                <li>Non-infringement of third-party rights</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Security or protection of downloaded content</li>
                <li>Accuracy, completeness, or reliability of any content</li>
              </ul>
              <p className="mt-4">
                Users use the Service entirely at their own risk and assume all responsibility for any consequences.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Service Termination & Access Denial</h2>
              <p className="mb-4">
                SunsetDownloader reserves the right to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Suspend or terminate access to the Service at any time, for any reason</li>
                <li>Deny service to users suspected of illegal activity</li>
                <li>Comply with copyright takedown notices and legal demands</li>
                <li>Modify or discontinue the Service without notice</li>
              </ul>
            </section>

            {/* Third-Party Platforms */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Platforms & Services</h2>
              <p className="mb-4">
                SunsetDownloader is an independent, third-party tool. It is not affiliated with, endorsed by, or authorized by any content provider, platform, or rights holder including but not limited to YouTube, Spotify, Instagram, Twitter, TikTok, Facebook, Twitch, or any other platform.
              </p>
              <p className="mb-4">
                <span className="font-semibold">Your Responsibility:</span> You are responsible for reviewing and complying with the Terms of Service and content usage policies of any platform from which you download content.
              </p>
              <p>
                SunsetDownloader is not responsible for any violations of third-party platform policies or terms that may result from your use of downloaded content.
              </p>
            </section>

            {/* Compliance with Laws */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Legal Compliance & Jurisdiction</h2>
              <p className="mb-4">
                Users agree to comply with all applicable federal, state, local, and international laws, including but not limited to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Copyright and intellectual property laws</li>
                <li>DMCA (Digital Millennium Copyright Act)</li>
                <li>Computer fraud and abuse laws</li>
                <li>Privacy and data protection regulations</li>
                <li>Export controls and sanctions laws</li>
              </ul>
              <p className="mt-4">
                <span className="font-semibold">Jurisdiction:</span> These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where SunsetDownloader operates, and you agree to submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            {/* No Legal Advice */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. No Legal Advice</h2>
              <p>
                This Terms of Service document is provided for informational purposes only and does not constitute legal advice. SunsetDownloader strongly recommends that users consult with qualified legal counsel in their jurisdiction to understand their rights and obligations before using this Service. The interpretations and applications of these terms may vary depending on local laws and specific circumstances.
              </p>
            </section>

            {/* Updates to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Modifications to Terms</h2>
              <p className="mb-4">
                SunsetDownloader reserves the right to modify these Terms of Service at any time. Changes become effective immediately upon posting to the Service. Your continued use of the Service following any modifications constitutes your acceptance of the updated Terms.
              </p>
              <p>
                It is your responsibility to review these Terms periodically for updates.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Severability</h2>
              <p>
                If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, that provision shall be severed, and the remaining provisions shall continue in full force and effect to the maximum extent permitted by law.
              </p>
            </section>

            {/* Final Statement */}
            <section className="p-4 rounded-lg bg-sunset-500/10 border border-sunset-500/30">
              <h2 className="text-lg font-bold text-white mb-3">15. Final Statement</h2>
              <p className="text-sunset-300 text-sm">
                By using SunsetDownloader, you acknowledge that you have read and understand these Terms of Service, you accept full responsibility for your use of the Service and any content you download, and you release SunsetDownloader from any and all claims, damages, or legal actions arising from your use.
              </p>
            </section>

            {/* Footer Contact */}
            <div className="mt-8 pt-6 border-t border-sunset-700/50 text-center text-sm text-sunset-400">
              <p>Last Updated: January 2026</p>
              <p className="mt-2">
                If you have questions about these Terms, please contact us through the appropriate channels.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-sunset-700/50 backdrop-blur-md bg-sunset-900/50 mt-16">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="flex gap-4 text-sm">
                <Link
                  to="/"
                  className="text-sunset-400 hover:text-sunset-300 transition-colors"
                >
                  Home
                </Link>
                <span className="text-sunset-700">•</span>
                <Link
                  to="/credits"
                  className="text-sunset-400 hover:text-sunset-300 transition-colors"
                >
                  Credits
                </Link>
              </div>
            </div>
            <p className="text-sunset-400 text-sm text-center">
              © 2026 SunsetDownloader. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
