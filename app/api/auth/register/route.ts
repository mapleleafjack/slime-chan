/**
 * API Route: POST /api/auth/register
 * Register a new user account
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hash } from 'bcrypt'
import { db } from '@/lib/db'
import type { RegisterRequest, AuthResponse } from '@/types/authTypes'

const SALT_ROUNDS = 10

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    const { username, password } = body

    // Validation
    if (!username || !password) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username must be between 3 and 50 characters' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.findUserByUsername(username)
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Username already taken' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await hash(password, SALT_ROUNDS)
    const user = await db.createUser(username, passwordHash)

    // Create session
    const sessionId = await db.createSession(user.id, user.username)

    // Set session cookie
    const response = NextResponse.json<AuthResponse>({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
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
    console.error('Register error:', error)
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'Failed to create account' },
      { status: 500 }
    )
  }
}
