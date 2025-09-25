import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 3 // 3 attempts per 15 minutes per IP

function getRateLimitKey(request: Request): string {
  // In production, you might want to use a more sophisticated approach
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true }
}

export async function POST(request: Request) {
  try {
    // Rate limiting check
    const clientKey = getRateLimitKey(request)
    const rateLimit = checkRateLimit(clientKey)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many attempts. Please try again later.',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    // Enhanced email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Sanitize email (basic)
    const sanitizedEmail = email.toLowerCase().trim()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', sanitizedEmail)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'You\'re already on the waitlist!' },
        { status: 200 }
      )
    }

    // Add to waitlist with additional metadata for security tracking
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: sanitizedEmail,
          source: 'waitlist',
          created_at: new Date().toISOString(),
          metadata: {
            user_agent: request.headers.get('user-agent'),
            referer: request.headers.get('referer'),
            ip_hash: await hashIP(clientKey) // Hash IP for privacy
          }
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to add to waitlist. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Successfully added to waitlist!',
        data: { email: sanitizedEmail, id: data?.[0]?.id }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// Hash IP address for privacy (store hash, not actual IP)
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + process.env.IP_HASH_SALT || 'default-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12) // Only store first 12 chars for privacy
}