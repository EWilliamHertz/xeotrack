'use server'

import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

async function getUserId(token: string) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
  return decoded.userId || decoded.sub
}

export async function fetchTransactions(token: string, filters: any, page = 1) {
  try {
    const userId = await getUserId(token)
    const limit = 15
    const offset = (page - 1) * limit
    
    let sql = 'SELECT * FROM transactions WHERE user_id = $1'
    const params: any[] = [userId]

    if (filters.type) {
      params.push(filters.type)
      sql += ` AND type = $${params.length}`
    }
    if (filters.category) {
      params.push(filters.category)
      sql += ` AND category = $${params.length}`
    }

    sql += ` ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`
    const result = await query(sql, params)
    
    const countRes = await query('SELECT COUNT(*) FROM transactions WHERE user_id = $1', [userId])
    
    return { 
      success: true, 
      data: result.rows, 
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) 
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function createTransaction(token: string, data: any) {
  try {
    const userId = await getUserId(token)
    const txnId = `txn_${crypto.randomBytes(6).toString('hex')}`
    const date = new Date(data.date)
    
    // 1. If linking to an existing debt, update that debt balance first
    if (data.linkDebtId) {
      const debt = await query('SELECT * FROM debts WHERE id = $1 AND user_id = $2', [data.linkDebtId, userId])
      if (debt.rows.length > 0) {
        const isOwedToMe = debt.rows[0].type === 'owed_to_me'
        // If it's an expense paying off a debt I owe, balance goes down
        // If it's income from someone paying me back, balance goes down
        const newBalance = Number(debt.rows[0].remaining_amount) - Number(data.amount)
        await query('UPDATE debts SET remaining_amount = $1 WHERE id = $2', [newBalance, data.linkDebtId])
      }
    }

    // 2. Insert the transaction
    const result = await query(
      `INSERT INTO transactions 
      (id, user_id, type, amount, category, description, date, party, currency, month, year) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        txnId, userId, data.type, data.amount, data.category, data.description, 
        data.date, data.party, data.currency || 'SEK', date.getUTCMonth() + 1, date.getUTCFullYear()
      ]
    )

    return { success: true, data: result.rows[0] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getDebtsList(token: string) {
  try {
    const userId = await getUserId(token)
    const res = await query('SELECT id, name, type, remaining_amount FROM debts WHERE user_id = $1', [userId])
    return { success: true, data: res.rows }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}