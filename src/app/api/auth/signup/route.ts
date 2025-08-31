// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, confirmPassword, name, companyName, domain, accountType } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: "Passwords don't match" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create tenant first
    const tenant = await prisma.tenant.create({
      data: {
        name: accountType === "CORPORATE" ? companyName : name,
        type: accountType,
        domain: accountType === "CORPORATE" ? domain : null
      }
    })

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        tenantId: tenant.id,
        role: "OWNER"
      }
    })

    // Create default calendar settings
    await prisma.calendarSettings.create({
      data: {
        tenantId: tenant.id,
        workingHours: { start: "09:00", end: "17:00" },
        timeZone: "UTC",
        notifications: {
          email: true,
          push: true,
          desktop: true
        }
      }
    })

    // Create Stripe customer
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        tenantId: tenant.id
      }
    })

    // Create subscription record
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        stripeCustomerId: customer.id,
        status: "trialing",
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      }
    })

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}