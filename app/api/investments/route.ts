import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query('SELECT * FROM investments WHERE user_id = $1', [userId])
    
    // Recreate the Python Profit/Loss math
    const investments = result.rows.map(inv => {
      const buyTotal = inv.quantity * inv.buy_price
      const currentTotal = inv.current_value
      const profitLoss = buyTotal > 0 ? currentTotal - buyTotal : 0
      const profitLossPct = buyTotal > 0 ? ((currentTotal - buyTotal) / buyTotal) * 100 : 0
      
      return { ...inv, profit_loss: profitLoss, profit_loss_pct: Number(profitLossPct.toFixed(2)) }
    })
    
    return NextResponse.json(investments)
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
    const id = `inv_${crypto.randomBytes(6).toString('hex')}`
    const initialValue = data.quantity * data.buy_price

    const result = await query(
      `INSERT INTO investments 
      (id, user_id, name, category, quantity, buy_price, current_value, purchase_date, currency, description) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        id, userId, data.name, data.category, data.quantity, data.buy_price, 
        initialValue, data.purchase_date, data.currency || 'SEK', data.description || null
      ]
    )
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}