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
    const result = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    return { success: true, data: result.rows }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function createDebt(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const id = `dbt_${crypto.randomBytes(6).toString('hex')}`
    const result = await query(
      `INSERT INTO debts (id, user_id, name, type, total_amount, remaining_amount, interest_rate, monthly_payment, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
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

export async function updateDebtValue(token: string, id: string, newRemaining: string) {
  try {
    const userId = await getUserId(token)
    await query('UPDATE debts SET remaining_amount = $1 WHERE id = $2 AND user_id = $3', [newRemaining, id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function deleteDebt(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    await query('DELETE FROM debts WHERE id = $1 AND user_id = $2', [id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}