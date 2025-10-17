/**
 * API Route: GET /api/auth/me
 * Get current user information from session
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { AuthResponse } from '@/types/authTypes'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value

    if (!sessionId) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = await db.getSession(sessionId)
    if (!session) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    const user = await db.findUserByUsername(session.username)
    if (!user) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<AuthResponse>({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Failed to get user information' },
      { status: 500 }
    )
  }
}
