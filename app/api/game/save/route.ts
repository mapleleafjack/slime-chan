/**
 * API Route: POST /api/game/save
 * Save game state for the authenticated user
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { GameState, GameStateResponse } from '@/types/authTypes'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value

    if (!sessionId) {
      return NextResponse.json<GameStateResponse>(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = await db.getSession(sessionId)
    if (!session) {
      return NextResponse.json<GameStateResponse>(
        { success: false, message: 'Session expired' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const gameState: GameState = {
      userId: session.userId,
      creatures: body.creatures || [],
      activeCreatureId: body.activeCreatureId || null,
      debugTime: body.debugTime || null,
      lastSaved: Date.now(),
      version: '1.0',
    }

    await db.saveGameState(gameState)

    return NextResponse.json<GameStateResponse>({
      success: true,
      message: 'Game saved successfully',
      gameState,
    })
  } catch (error) {
    console.error('Save game error:', error)
    return NextResponse.json<GameStateResponse>(
      { success: false, message: 'Failed to save game' },
      { status: 500 }
    )
  }
}
