/**
 * Database utilities for Vercel Postgres and Vercel KV
 * 
 * Setup instructions:
 * 1. Install packages: npm install @vercel/postgres @vercel/kv bcrypt
 * 2. Add Vercel Postgres and KV to your project in Vercel dashboard
 * 3. Pull environment variables: vercel env pull .env.local
 * 4. Run the schema: node -e "require('./lib/setup-db.js')"
 */

import { sql } from '@vercel/postgres'
import { kv } from '@vercel/kv'
import type { User, Session, GameState } from '@/types/authTypes'

const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

/**
 * User authentication functions
 */
export const db = {
  // Create a new user
  async createUser(username: string, passwordHash: string): Promise<User> {
    const now = Date.now()
    const result = await sql`
      INSERT INTO users (username, password_hash, created_at, last_login)
      VALUES (${username}, ${passwordHash}, ${now}, ${now})
      RETURNING id, username, created_at, last_login
    `
    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      createdAt: result.rows[0].created_at,
      lastLogin: result.rows[0].last_login,
    }
  },

  // Find user by username
  async findUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
    const result = await sql`
      SELECT id, username, password_hash, created_at, last_login
      FROM users
      WHERE username = ${username}
    `
    if (result.rows.length === 0) return null
    
    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      passwordHash: result.rows[0].password_hash,
      createdAt: result.rows[0].created_at,
      lastLogin: result.rows[0].last_login,
    }
  },

  // Update last login time
  async updateLastLogin(userId: string): Promise<void> {
    const now = Date.now()
    await sql`
      UPDATE users
      SET last_login = ${now}
      WHERE id = ${userId}
    `
  },

  /**
   * Session management with Vercel KV (Redis)
   */
  async createSession(userId: string, username: string): Promise<string> {
    const sessionId = crypto.randomUUID()
    const now = Date.now()
    const expiresAt = now + SESSION_EXPIRY
    
    const session: Session = {
      userId,
      username,
      createdAt: now,
      expiresAt,
    }
    
    // Store in Redis with automatic expiration (Vercel KV handles JSON automatically)
    await kv.setex(`session:${sessionId}`, Math.floor(SESSION_EXPIRY / 1000), session)
    
    return sessionId
  },

  async getSession(sessionId: string): Promise<Session | null> {
    const session = await kv.get<Session>(`session:${sessionId}`)
    if (!session) return null
    
    // Check if expired
    if (session.expiresAt < Date.now()) {
      await kv.del(`session:${sessionId}`)
      return null
    }
    
    return session
  },

  async deleteSession(sessionId: string): Promise<void> {
    await kv.del(`session:${sessionId}`)
  },

  /**
   * Game state persistence
   */
  async saveGameState(gameState: GameState): Promise<void> {
    const { userId, creatures, activeCreatureId, debugTime, version } = gameState
    const now = Date.now()
    
    // Convert debugTime to ISO string or null for Postgres
    const debugTimeValue = debugTime ? new Date(debugTime).toISOString() : null
    
    await sql`
      INSERT INTO game_state (user_id, creatures, active_creature_id, debug_time, last_saved, version)
      VALUES (
        ${userId},
        ${JSON.stringify(creatures)}::jsonb,
        ${activeCreatureId},
        ${debugTimeValue},
        ${now},
        ${version}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        creatures = ${JSON.stringify(creatures)}::jsonb,
        active_creature_id = ${activeCreatureId},
        debug_time = ${debugTimeValue},
        last_saved = ${now},
        version = ${version}
    `
  },

  async loadGameState(userId: string): Promise<GameState | null> {
    const result = await sql`
      SELECT creatures, active_creature_id, debug_time, last_saved, version
      FROM game_state
      WHERE user_id = ${userId}
    `
    
    if (result.rows.length === 0) return null
    
    const row = result.rows[0]
    return {
      userId,
      creatures: row.creatures as any, // JSONB is already parsed by Vercel Postgres
      activeCreatureId: row.active_creature_id,
      debugTime: row.debug_time ? new Date(row.debug_time) : null,
      lastSaved: row.last_saved,
      version: row.version,
    }
  },

  async deleteGameState(userId: string): Promise<void> {
    await sql`
      DELETE FROM game_state
      WHERE user_id = ${userId}
    `
  },
}
