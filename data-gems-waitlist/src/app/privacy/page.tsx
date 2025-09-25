"use client"

import { DataGemsBackground } from "@/components/ui/data-gems-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function PrivacyPolicyPage() {
  return (
    <div className="relative h-screen overflow-y-auto">
      <DataGemsBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 z-0" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="absolute top-6 left-6 z-50">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary-foreground hover:bg-primary bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-4"
            >
              ← Back to Waitlist
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="w-full max-w-4xl mx-auto p-8 pt-24">
          <div className="bg-[#FFFCF6]/95 backdrop-blur-sm rounded-2xl border border-border/20 p-8 lg:p-12 shadow-lg">

            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-12 space-y-6">
              <Image
                src="/Gems_Logo.png"
                alt="Data Gems"
                width={64}
                height={64}
                className="object-contain rounded-[12px]"
              />
              <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FDB171] to-[#EC6F95]">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-center max-w-2xl">
                Last updated: September 24, 2024
              </p>
            </div>

            <div className="prose prose-gray max-w-none space-y-8">

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
                <p className="text-foreground leading-relaxed">
                  Data Gems respects your privacy and is committed to protecting your personal information.
                  This privacy policy explains how we collect, use, and protect your information when you
                  join our waitlist.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Email Address</h3>
                  <p className="text-foreground leading-relaxed">
                    When you join our waitlist, we collect your email address to notify you when
                    Data Gems becomes available for early access.
                  </p>

                  <h3 className="text-lg font-medium text-foreground">Technical Information</h3>
                  <p className="text-foreground leading-relaxed">
                    We collect basic technical information including:
                  </p>
                  <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
                    <li>Hashed IP address (for security and abuse prevention)</li>
                    <li>Browser information (user agent)</li>
                    <li>Referral source</li>
                    <li>Timestamp of registration</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  We use your information solely for the following purposes:
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
                  <li>To notify you when Data Gems early access becomes available</li>
                  <li>To prevent spam and abuse of our waitlist</li>
                  <li>To understand interest in our product (aggregated data only)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
                <p className="text-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
                  <li>HTTPS encryption for all data transmission</li>
                  <li>Encrypted database storage</li>
                  <li>IP address hashing (we don&apos;t store actual IP addresses)</li>
                  <li>Rate limiting to prevent abuse</li>
                  <li>Row-level security policies</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Sharing</h2>
                <p className="text-foreground leading-relaxed">
                  We do not sell, trade, or share your email address with third parties.
                  Your email will only be used by Data Gems to communicate about early access
                  and product updates.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention</h2>
                <p className="text-foreground leading-relaxed">
                  We will retain your email address until:
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
                  <li>You request deletion of your data</li>
                  <li>You unsubscribe from our waitlist</li>
                  <li>The early access program is completed</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
                <p className="text-foreground leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-foreground space-y-2 ml-4">
                  <li>Request access to your personal data</li>
                  <li>Request correction of your personal data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Withdraw consent at any time</li>
                  <li>Object to processing of your personal data</li>
                </ul>
                <p className="text-foreground leading-relaxed mt-4">
                  To exercise any of these rights, please contact us at{" "}
                  <a href="mailto:data.gems.help@gmail.com" className="text-primary hover:underline">
                    data.gems.help@gmail.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">International Data Transfers</h2>
                <p className="text-foreground leading-relaxed">
                  Your data is stored securely using Supabase, which provides enterprise-grade
                  security and compliance. Data may be processed in countries with adequate
                  data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
                <p className="text-foreground leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of
                  any material changes by posting the new privacy policy on this page and
                  updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-foreground leading-relaxed">
                  If you have any questions about this privacy policy or our data practices,
                  please contact us at:
                </p>
                <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/20">
                  <p className="text-foreground">
                    <strong>Data Gems</strong><br />
                    Email: <a href="mailto:data.gems.help@gmail.com" className="text-primary hover:underline">data.gems.help@gmail.com</a><br />
                    Subject: Privacy Policy Inquiry
                  </p>
                </div>
              </section>

            </div>

            <div className="mt-12 pt-8 border-t border-border/20 text-center">
              <Link href="/">
                <Button className="px-8">
                  Return to Waitlist
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}