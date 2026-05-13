import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const data = await request.json()
    const id = `txn_${crypto.randomBytes(6).toString('hex')}`
    
    // Calculate month and year from date
    const dateObj = new Date(data.date)
    const month = dateObj.getUTCMonth() + 1
    const year = dateObj.getUTCFullYear()

    const result = await query(
      `INSERT INTO transactions 
      (id, user_id, type, amount, category, description, date, party, currency, month, year, recurring) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        id, userId, data.type, data.amount, data.category, data.description || null, 
        data.date, data.party || null, data.currency || 'SEK', month, year, data.recurring || false
      ]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}