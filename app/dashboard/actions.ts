'use server'

import { query } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function getDashboardStats(token: string) {
  try {
    // 1. Manually verify the token since we're passing it from localStorage
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any
    const userId = decoded.userId || decoded.sub

    if (!userId) throw new Error('Unauthorized')

    const now = new Date()
    const currentMonth = now.getUTCMonth() + 1
    const currentYear = now.getUTCFullYear()

    // 2. Fetch data (Exact same logic as before)
    const txnsRes = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId])
    const allTxns = txnsRes.rows

    const invRes = await query('SELECT * FROM investments WHERE user_id = $1', [userId])
    const totalInvestments = invRes.rows.reduce((sum, inv) => sum + Number(inv.current_value), 0)

   const debtsRes = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    
    // Separate liabilities from assets in the debt table
    const totalOwedByMe = debtsRes.rows
      .filter(d => d.type !== 'owed_to_me')
      .reduce((sum, debt) => sum + Number(debt.remaining_amount), 0)

    const totalOwedToMe = debtsRes.rows
      .filter(d => d.type === 'owed_to_me')
      .reduce((sum, debt) => sum + Number(debt.remaining_amount), 0)

    const monthlyTxns = allTxns.filter(t => t.month === currentMonth && t.year === currentYear)
    const monthlyIncome = monthlyTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const monthlyExpenses = monthlyTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)

    const totalIncomeAll = allTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenseAll = allTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const liquidBalance = totalIncomeAll - totalExpenseAll

    return {
      success: true,
      data: {
        total_balance: liquidBalance,
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        // Net worth formula: Investments + Cash + Money Owed to Me - Debts
        net_worth: totalInvestments + totalOwedToMe - totalOwedByMe + liquidBalance,
        recent_transactions: allTxns.slice(0, 5),
        investments_total: totalInvestments,
        debts_total: totalOwedByMe,
        owed_to_me_total: totalOwedToMe
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}