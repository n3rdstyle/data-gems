"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Feature {
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: "One-Click Profile Attachment",
    description: "Instantly share your preferences, interests, and context with the AI of your choice. Your personal data becomes immediately available to enhance AI conversations."
  },
  {
    title: "Universal Compatibility",
    description: "Works seamlessly with ChatGPT, Claude, Google Gemini, and Perplexity. No matter which AI platform you prefer, Data Gems integrates perfectly."
  },
  {
    title: "100% Private",
    description: "All data is stored locally on your device/in your browser. Your personal information never leaves your control and is never uploaded to external servers."
  }
]

export function FeaturesAccordion() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="divide-y divide-border/50">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full py-4 flex items-center justify-between text-left hover:text-foreground/80 transition-colors"
              aria-expanded={openIndex === index}
            >
              <h3 className="font-medium text-foreground text-[15px]">
                {feature.title}
              </h3>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground/60 transition-transform duration-200 flex-shrink-0",
                  openIndex === index && "rotate-180"
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-200 ease-in-out",
                openIndex === index ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}