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

    // 2. Fetch Core Data
    const txnsRes = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId])
    const allTxns = txnsRes.rows

    const invRes = await query('SELECT * FROM investments WHERE user_id = $1', [userId])
    const totalInvestments = invRes.rows.reduce((sum, inv) => sum + Number(inv.current_value), 0)

    const debtsRes = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    
    // 3. Fetch from the separate Receivables table
    let receivablesRows: any[] = []
    try {
      const recRes = await query('SELECT * FROM receivables WHERE user_id = $1', [userId])
      receivablesRows = recRes.rows || []
    } catch (e) {
      console.warn("Receivables table missing or empty", e)
    }

    // 4. Fetch from Savings accounts
    let savingsTotal = 0
    try {
      const savRes = await query('SELECT * FROM savings_accounts WHERE user_id = $1', [userId])
      savingsTotal = (savRes.rows || []).reduce((sum: number, acc: any) => sum + Number(acc.balance), 0)
    } catch (e) {
      console.warn("Savings table missing or empty", e)
    }

    // Calculate Owed To Me (Assets inside Debts table + Receivables table)
    const totalOwedToMe = debtsRes.rows
      .filter(d => {
        const t = d.type?.trim().toLowerCase() || '';
        return (t.includes('owed') && t.includes('me')) || t === 'receivable' || t === 'asset';
      })
      .reduce((sum, debt) => sum + Number(debt.remaining_amount), 0) 
      + receivablesRows.reduce((sum, rec) => sum + Number(rec.remaining_amount), 0)

    // Calculate Owed By Me (Liabilities inside Debts table)
    const totalOwedByMe = debtsRes.rows
      .filter(d => {
        const t = d.type?.trim().toLowerCase() || '';
        return !((t.includes('owed') && t.includes('me')) || t === 'receivable' || t === 'asset');
      })
      .reduce((sum, debt) => sum + Number(debt.remaining_amount), 0)

    // Calculate Ledger Totals
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
        // Net worth formula: Investments + Savings + Cash + Money Owed to Me - Debts
        net_worth: totalInvestments + savingsTotal + totalOwedToMe - totalOwedByMe + liquidBalance,
        recent_transactions: allTxns.slice(0, 5),
        investments_total: totalInvestments,
        debts_total: totalOwedByMe,
        owed_to_me_total: totalOwedToMe,
        savings_total: savingsTotal
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}