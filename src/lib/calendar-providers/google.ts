// lib/calendar-providers/google.ts
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '../auth'
import { getServerSession } from 'next-auth'

export class GoogleCalendarProvider {
  private oauth2Client: any

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    })
  }

  async getCalendars() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await calendar.calendarList.list()
      return response.data.items?.map(cal => ({
        id: cal.id!,
        name: cal.summary!,
        color: cal.backgroundColor || '#3B82F6',
        isPrimary: cal.primary || false
      })) || []
    } catch (error) {
      console.error('Error fetching Google calendars:', error)
      throw error
    }
  }

  async getEvents(calendarId: string, timeMin: Date, timeMax: Date) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })

      return response.data.items?.map(event => ({
        id: event.id!,
        title: event.summary || 'Untitled Event',
        description: event.description,
        startTime: new Date(event.start?.dateTime || event.start?.date!),
        endTime: new Date(event.end?.dateTime || event.end?.date!),
        isAllDay: !event.start?.dateTime,
        location: event.location,
        attendees: event.attendees?.map(a => ({
          email: a.email,
          name: a.displayName,
          responseStatus: a.responseStatus
        }))
      })) || []
    } catch (error) {
      console.error('Error fetching Google events:', error)
      throw error
    }
  }

  async createEvent(calendarId: string, event: any) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })
    
    try {
      const response = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: event.title,
          description: event.description,
          start: {
            dateTime: event.startTime.toISOString(),
            timeZone: event.timeZone || 'UTC'
          },
          end: {
            dateTime: event.endTime.toISOString(),
            timeZone: event.timeZone || 'UTC'
          },
          location: event.location,
          attendees: event.attendees || [],
          updatedAt: new Date()
        },
        create: {
          calendarId: calendar,
          providerEventId: event.id,
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          location: event.location,
          attendees: event.attendees || []
        }
      })
    }

    // Update calendar sync timestamp
    await prisma.calendar.update({
      where: { id: calendar.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      message: "Calendar synced successfully",
      eventCount: events.length
    })
  } catch (error: any) {
    console.error("Calendar sync error:", error)
    return NextResponse.json(
      { message: "Sync failed" },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.tenantId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let whereClause: any = {
      calendar: {
        tenantId: session.user.tenantId
      }
    }

    if (calendarId) {
      whereClause.calendarId = calendarId
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        calendar: {
          select: {
            id: true,
            name: true,
            color: true,
            provider: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { message: "Failed to fetch events" },
      { status: 500 }
    )
  }
}