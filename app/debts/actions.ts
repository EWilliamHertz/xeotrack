'use server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function getUserId(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  return decoded.userId || decoded.sub
}

export async function fetchDebts(token: string) {
  try {
    const userId = await getUserId(token)
    const debtsRes = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    let allData = debtsRes.rows || []

    try {
      const recRes = await query('SELECT * FROM receivables WHERE user_id = $1', [userId])
      // Force tag as receivables so the UI knows it's a P.O.M
      const normalizedRec = (recRes.rows || []).map((r: any) => ({ ...r, type: 'receivables' }))
      allData = [...allData, ...normalizedRec]
    } catch (e) {
      console.warn("Receivables table fetch error", e)
    }

    return { success: true, data: allData }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function createDebt(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const id = `dbt_${crypto.randomBytes(6).toString('hex')}`
    
    // Route to the correct SQL table based on what you selected
    const table = data.type === 'receivables' ? 'receivables' : 'debts'

    const result = await query(
      `INSERT INTO ${table} (id, user_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, userId, data.name, data.type, data.total_amount, data.remaining_amount, data.interest_rate, data.monthly_payment, data.currency || 'SEK']
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

export async function updateDebtValue(token: string, id: string, newRemaining: string, newTotal: string, type: string) {
  try {
    const userId = await getUserId(token)
    const table = (type === 'receivables' || type === 'owed to me' || type === 'owed_to_me') ? 'receivables' : 'debts'
    await query(`UPDATE ${table} SET remaining_amount = $1, total_amount = $2 WHERE id = $3 AND user_id = $4`, [newRemaining, newTotal, id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function deleteDebt(token: string, id: string, type: string) {
  try {
    const userId = await getUserId(token)
    const table = (type === 'receivables' || type === 'owed to me' || type === 'owed_to_me') ? 'receivables' : 'debts'
    await query(`DELETE FROM ${table} WHERE id = $1 AND user_id = $2`, [id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function logDebtPayment(token: string, id: string, type: string, amount: number) {
  try {
    const userId = await getUserId(token)
    
    await query(`
      CREATE TABLE IF NOT EXISTS debt_logs (
        id VARCHAR(255) PRIMARY KEY,
        debt_id VARCHAR(255),
        user_id VARCHAR(255),
        action_type VARCHAR(50),
        amount DECIMAL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [])

    const logId = `dlog_${crypto.randomBytes(6).toString('hex')}`
    await query(
      'INSERT INTO debt_logs (id, debt_id, user_id, action_type, amount) VALUES ($1, $2, $3, $4, $5)',
      [logId, id, userId, 'payment', amount]
    )

    const table = (type === 'receivables' || type === 'owed to me' || type === 'owed_to_me') ? 'receivables' : 'debts'
    const currentRes = await query(`SELECT remaining_amount FROM ${table} WHERE id = $1 AND user_id = $2`, [id, userId])
    const currentRem = Number(currentRes.rows[0].remaining_amount)
    
    const newRem = Math.max(0, currentRem - amount)
    await query(`UPDATE ${table} SET remaining_amount = $1 WHERE id = $2 AND user_id = $3`, [newRem, id, userId])

    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function fetchDebtLogs(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    await query(`
      CREATE TABLE IF NOT EXISTS debt_logs (
        id VARCHAR(255) PRIMARY KEY,
        debt_id VARCHAR(255),
        user_id VARCHAR(255),
        action_type VARCHAR(50),
        amount DECIMAL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [])
    const res = await query('SELECT * FROM debt_logs WHERE debt_id = $1 AND user_id = $2 ORDER BY date DESC', [id, userId])
    return { success: true, data: res.rows || [] }
  } catch (err: any) { return { success: false, error: err.message } } 
}