'use server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function getUserId(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  return decoded.userId || decoded.sub
}

export async function fetchSavings(token: string) {
  try {
    const userId = await getUserId(token)
    await query(`
      CREATE TABLE IF NOT EXISTS savings_accounts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        name VARCHAR(255),
        balance DECIMAL DEFAULT 0,
        target_amount DECIMAL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'SEK'
      )
    `)
    const res = await query('SELECT * FROM savings_accounts WHERE user_id = $1 ORDER BY name ASC', [userId])
    return { success: true, data: res.rows }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function createSavingsAccount(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const id = `sav_${crypto.randomBytes(6).toString('hex')}`
    const result = await query(
      `INSERT INTO savings_accounts (id, user_id, name, balance, target_amount, currency) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, userId, data.name, data.balance || 0, data.target_amount || 0, 'SEK']
    )
    return { success: true, data: result.rows[0] }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function updateSavingsAccount(token: string, id: string, name: string, target: string) {
  try {
    const userId = await getUserId(token)
    await query(`UPDATE savings_accounts SET name = $1, target_amount = $2 WHERE id = $3 AND user_id = $4`, [name, target, id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function deleteSavingsAccount(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    await query(`DELETE FROM savings_accounts WHERE id = $1 AND user_id = $2`, [id, userId])
    // Also cleanup logs
    await query(`DELETE FROM savings_transactions WHERE savings_id = $1 AND user_id = $2`, [id, userId])
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function logSavingsTransaction(token: string, id: string, type: 'deposit' | 'withdraw' | 'in-kind', amount: number, description: string = '') {
  try {
    const userId = await getUserId(token)
    
    // Auto-create the transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id VARCHAR(255) PRIMARY KEY,
        savings_id VARCHAR(255),
        user_id VARCHAR(255),
        type VARCHAR(50),
        amount DECIMAL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const logId = `stx_${crypto.randomBytes(6).toString('hex')}`
    await query(
      'INSERT INTO savings_transactions (id, savings_id, user_id, type, amount, description) VALUES ($1, $2, $3, $4, $5, $6)',
      [logId, id, userId, type, amount, description]
    )

    // Update Master Balance
    const accRes = await query(`SELECT balance FROM savings_accounts WHERE id = $1 AND user_id = $2`, [id, userId])
    const currentBal = Number(accRes.rows[0].balance)
    
    const newBal = type === 'withdraw' ? Math.max(0, currentBal - amount) : currentBal + amount
    await query(`UPDATE savings_accounts SET balance = $1 WHERE id = $2 AND user_id = $3`, [newBal, id, userId])

    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function fetchSavingsLogs(token: string, id: string) {
  try {
    const userId = await getUserId(token)
    await query(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id VARCHAR(255) PRIMARY KEY,
        savings_id VARCHAR(255),
        user_id VARCHAR(255),
        type VARCHAR(50),
        amount DECIMAL,
        description TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const res = await query('SELECT * FROM savings_transactions WHERE savings_id = $1 AND user_id = $2 ORDER BY date ASC', [id, userId])
    return { success: true, data: res.rows || [] }
  } catch (err: any) { return { success: false, error: err.message } }
}