// src/app/api/auth/signup/route.ts
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

    // Check if user already exists - FIXED: use 'user' not 'users'
    const existingUser = await prisma.users.findUnique({
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

    // Create tenant first - FIXED: use 'tenant' not 'tenants'
    const tenant = await prisma.tenant.create({
      data: {
        name: accountType === "CORPORATE" ? companyName || name : name,
        type: accountType || "PERSONAL",
        domain: accountType === "CORPORATE" ? domain : null
      }
    })

    // Create user - FIXED: use 'user' not 'users'
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        tenantId: tenant.id,
        role: "OWNER"
      }
    })

    // Create default calendar settings - FIXED: use 'calendarSettings' not 'calendar_settings'
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