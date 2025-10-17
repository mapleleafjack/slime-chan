/**
 * API Route: GET /api/game/load
 * Load game state for the authenticated user
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { GameStateResponse } from '@/types/authTypes'

export async function GET(request: NextRequest) {
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

    const gameState = await db.loadGameState(session.userId)

    if (!gameState) {
      console.log('ℹ️ No saved game found for user:', session.userId)
      return NextResponse.json<GameStateResponse>({
        success: true,
        message: 'No saved game found',
        gameState: undefined,
      })
    }

    console.log('📥 Loading from database:', {
      userId: session.userId,
      creatureCount: gameState.creatures?.length || 0,
      creatureDetails: gameState.creatures?.map(c => ({
        id: c.id,
        name: c.firstName,
        type: c.creatureType,
        conversationLength: c.conversationHistory?.length || 0,
      })),
    })

    return NextResponse.json<GameStateResponse>({
      success: true,
      message: 'Game loaded successfully',
      gameState,
    })
  } catch (error) {
    console.error('Load game error:', error)
    return NextResponse.json<GameStateResponse>(
      { success: false, message: 'Failed to load game' },
      { status: 500 }
    )
  }
}
