/**
 * API Route: POST /api/auth/login
 * Login to an existing account
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { compare } from 'bcrypt'
import { db } from '@/lib/db'
import type { LoginRequest, AuthResponse } from '@/types/authTypes'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.findUserByUsername(username)
    if (!user) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Update last login
    await db.updateLastLogin(user.id)

    // Create session
    const sessionId = await db.createSession(user.id, user.username)

    // Set session cookie
    const response = NextResponse.json<AuthResponse>({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        lastLogin: Date.now(),
      },
    })

    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
}
