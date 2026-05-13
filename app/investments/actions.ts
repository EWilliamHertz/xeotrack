'use server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function getUserId(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  return decoded.userId || decoded.sub
}

export async function fetchInvestments(token: string) {
  try {
    const userId = await getUserId(token)
    const result = await query('SELECT * FROM investments WHERE user_id = $1', [userId])
    const investments = result.rows.map(inv => {
      const buyTotal = inv.quantity * inv.buy_price
      const currentTotal = inv.current_value
      const profitLoss = buyTotal > 0 ? currentTotal - buyTotal : 0
      const profitLossPct = buyTotal > 0 ? ((currentTotal - buyTotal) / buyTotal) * 100 : 0
      return { ...inv, profit_loss: profitLoss, profit_loss_pct: Number(profitLossPct.toFixed(2)) }
    })
    return { success: true, data: investments }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function createInvestment(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const id = `inv_${crypto.randomBytes(6).toString('hex')}`
    const initialValue = data.quantity * data.buy_price
    const result = await query(
      `INSERT INTO investments (id, user_id, name, category, quantity, buy_price, current_value, purchase_date, currency, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [id, userId, data.name, data.category, data.quantity, data.buy_price, initialValue, data.purchase_date, data.currency || 'SEK', data.description || null]
    )
    return { success: true, data: result.rows[0] }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function updateInvestmentValue(token: string, id: string, newValue: string) {
  try {
    const userId = await getUserId(token)
    await query('UPDATE investments SET current_value = $1 WHERE id = $2 AND user_id = $3', [newValue, id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function deleteInvestment(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    await query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}