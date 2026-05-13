'use server'
import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function getUserId(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  return decoded.userId || decoded.sub
}

export async function fetchTransactions(token: string, page = 1, type = '') {
  try {
    const userId = await getUserId(token)
    const limit = 10
    const offset = (page - 1) * limit
    
    let sql = 'SELECT * FROM transactions WHERE user_id = $1'
    const params: any[] = [userId]
    if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
    
    sql += ` ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`
    const result = await query(sql, params)
    const countRes = await query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId])
    
    return { success: true, data: result.rows, totalPages: Math.ceil(countRes.rows[0].count / limit) }
  } catch (err: any) { return { success: false, error: err.message } }
}

export async function createTransaction(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const txnId = `txn_${crypto.randomBytes(6).toString('hex')}`
    
    // 1. Logic for Debt Linking
    if (data.linkDebtId) {
      // If Expense paying a debt, or Income receiving a loan payment, reduce the debt balance
      await query(
        'UPDATE debts SET remaining_amount = remaining_amount - $1 WHERE id = $2 AND user_id = $3',
        [data.amount, data.linkDebtId, userId]
      )
    }

    // 2. Insert Transaction
    const result = await query(
      `INSERT INTO transactions (id, user_id, type, amount, category, description, date, party, month, year) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        txnId, userId, data.type, data.amount, data.category, data.description, 
        data.date, data.party, new Date(data.date).getMonth() + 1, new Date(data.date).getFullYear()
      ]
    )
    return { success: true }
  } catch (err: any) { return { success: false, error: err.message } }
}