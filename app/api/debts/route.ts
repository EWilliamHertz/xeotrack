
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error("DATABASE ERROR:", error)
    return NextResponse.json({ message: 'Server error', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const data = await request.json()
    const id = `dbt_${crypto.randomBytes(6).toString('hex')}`

    const result = await query(
      `INSERT INTO debts 
      (id, user_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, currency) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        id, userId, data.name, data.type, data.total_amount, data.remaining_amount, 
        data.interest_rate, data.monthly_payment, data.currency || 'SEK'
      ]
    )
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    console.error("DATABASE ERROR:", error)
    return NextResponse.json({ message: 'Server error', details: error.message }, { status: 500 })
  }
}