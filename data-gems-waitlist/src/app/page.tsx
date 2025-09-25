"use client"

import { DataGemsBackground } from "@/components/ui/data-gems-background"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Icons } from "@/components/ui/icons"
import { FeaturesAccordion } from "@/components/ui/features-accordion"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !consentGiven) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        alert(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to join waitlist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="relative h-screen overflow-hidden">
        <DataGemsBackground />
        <div className="relative z-10 flex items-center justify-center h-screen">
          <div className="w-full max-w-md mx-auto p-8 text-center space-y-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground">
                Let&apos;s gooo.
              </h2>
              <p className="text-lg text-foreground">
                Thanks, you&apos;re all set. We&apos;ll notify per email you as soon as your early access is ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden">
      <DataGemsBackground />
      {/* Full width background layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-background/80 z-0" />

      <div className="relative z-10 h-screen flex">
        {/* Left side - Content */}
        <div className="w-full lg:w-1/2 relative flex items-center justify-center p-4 sm:p-8">
          {/* Cream background frame for left side */}
          <div className="absolute inset-0 bg-[#FFFCF6]/95 lg:bg-[#FFFCF6]/90 backdrop-blur-sm"></div>

          <div className="relative z-10 w-full max-w-xl space-y-8 sm:space-y-12">
          {/* Logo */}
          <div className="flex justify-center pt-4 sm:pt-0">
            <Image
              src="/Gems_Logo.png"
              alt="Data Gems"
              width={60}
              height={60}
              className="object-contain rounded-[12px] sm:w-20 sm:h-20"
            />
          </div>

          <div className="space-y-4 sm:space-y-6 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#FDB171] to-[#EC6F95] px-2 sm:px-0">
              The Personal Context Provider for your AI
            </h1>
            <p className="text-lg sm:text-base md:text-lg lg:text-xl text-foreground max-w-lg mx-auto px-4 sm:px-0">
              Data Gems is the personal context provider that makes an AI truly understand you. Build your personal profile continuously, and attach it into any AI conversation with a single click.
            </p>
          </div>

          {/* Waitlist Form */}
          <div className="max-w-md mx-auto space-y-4 px-2 sm:px-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground w-full"
                required
              />
              <Button
                type="submit"
                className="h-12 px-8 w-full sm:w-auto"
                disabled={isLoading || !consentGiven}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "Get early access"
                )}
              </Button>
            </form>

            {/* GDPR Consent Checkbox */}
            <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary bg-transparent border-border rounded focus:ring-primary focus:ring-2"
                required
              />
              <span className="leading-relaxed">
                I agree to join the Data Gems waitlist and provide my email for early access to the platform.
              </span>
            </label>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-4 pb-20 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex -space-x-3">
                <Avatar className="border-2 border-background w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold text-[#04214E]" style={{background: 'linear-gradient(135deg, #e84c88 0%, #f47b6a 25%, #f9a05c 50%, #fdb863 75%, #ffd194 100%)'}}>
                    DB
                  </AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-background w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold text-[#04214E]" style={{background: 'linear-gradient(135deg, #e84c88 0%, #f47b6a 25%, #f9a05c 50%, #fdb863 75%, #ffd194 100%)'}}>
                    ML
                  </AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-background w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold text-[#04214E]" style={{background: 'linear-gradient(135deg, #e84c88 0%, #f47b6a 25%, #f9a05c 50%, #fdb863 75%, #ffd194 100%)'}}>
                    MP
                  </AvatarFallback>
                </Avatar>
                <Avatar className="border-2 border-background w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarFallback className="text-xs sm:text-sm font-semibold text-[#04214E]" style={{background: 'linear-gradient(135deg, #e84c88 0%, #f47b6a 25%, #f9a05c 50%, #fdb863 75%, #ffd194 100%)'}}>
                    LS
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center px-2">
                <div className="font-bold text-foreground flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-sm sm:text-base">
                  <Icons.arrowRight className="w-4 h-4 hidden sm:block" />
                  <span className="break-words">Join our growing community of Gemers</span>
                </div>
              </div>
            </div>


          </div>
        </div>
        </div>

        {/* Right side - Image and Features */}
        <div className="hidden lg:flex lg:w-1/2 flex-col p-8 h-screen overflow-hidden">
          <div className="w-full max-w-2xl mx-auto flex flex-col h-full gap-6 pt-8">
            {/* Image - Bigger size */}
            <div className="relative flex-shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/20">
                <Image
                  src="/claude-interface.svg"
                  alt="Data Gems in action with Claude"
                  width={1000}
                  height={600}
                  className="w-full h-auto max-h-[55vh] object-contain"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-[#FDB171] to-[#EC6F95] rounded-full blur-3xl opacity-30" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-[#00A699] to-[#EC6F95] rounded-full blur-3xl opacity-30" />
            </div>

            {/* Features Accordion - Scrollable if needed */}
            <div className="flex-1 overflow-y-auto">
              <FeaturesAccordion />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy Button - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <Link href="/privacy">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary-foreground hover:bg-primary bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-4"
          >
            Privacy Policy
          </Button>
        </Link>
      </div>
    </div>
  )
}
