/**
 * API Route: POST /api/auth/logout
 * Logout and destroy session
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { AuthResponse } from '@/types/authTypes'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value

    if (sessionId) {
      await db.deleteSession(sessionId)
    }

    const response = NextResponse.json<AuthResponse>({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear session cookie
    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}
