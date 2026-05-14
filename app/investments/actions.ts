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
export async function logInvestmentAction(token: string, id: string, type: string, qty: number, price: number = 0) {
  try {
    const userId = await getUserId(token)
    
    // Auto-create the logs table if it doesn't exist yet
    await query(`
      CREATE TABLE IF NOT EXISTS investment_logs (
        id VARCHAR(255) PRIMARY KEY,
        investment_id VARCHAR(255),
        user_id VARCHAR(255),
        action_type VARCHAR(50),
        quantity DECIMAL,
        price DECIMAL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [])

    // Insert the historical log
    const logId = `ilog_${crypto.randomBytes(6).toString('hex')}`
    await query(
      'INSERT INTO investment_logs (id, investment_id, user_id, action_type, quantity, price) VALUES ($1, $2, $3, $4, $5, $6)',
      [logId, id, userId, type, qty, price]
    )

    // Update the master investment quantity
    const invRes = await query('SELECT quantity FROM investments WHERE id = $1 AND user_id = $2', [id, userId])
    const currentQty = Number(invRes.rows[0].quantity)
    const newQty = type === 'buy' ? currentQty + Number(qty) : Math.max(0, currentQty - Number(qty))
    
    await query('UPDATE investments SET quantity = $1 WHERE id = $2 AND user_id = $3', [newQty, id, userId])

    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function fetchInvestmentLogs(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    // FULL schema failsafe to prevent broken table creation
    await query(`
      CREATE TABLE IF NOT EXISTS investment_logs (
        id VARCHAR(255) PRIMARY KEY,
        investment_id VARCHAR(255),
        user_id VARCHAR(255),
        action_type VARCHAR(50),
        quantity DECIMAL,
        price DECIMAL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, []) 
    const res = await query('SELECT * FROM investment_logs WHERE investment_id = $1 AND user_id = $2 ORDER BY date DESC', [id, userId])
    return { success: true, data: res.rows || [] }
  } catch (err: any) { return { success: false, error: err.message } } 
}