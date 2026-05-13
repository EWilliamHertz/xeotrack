import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const now = new Date()
    const currentMonth = now.getUTCMonth() + 1
    const currentYear = now.getUTCFullYear()

    // Fetch transactions
    const txnsRes = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC', [userId])
    const allTxns = txnsRes.rows

    // Fetch investments
    const invRes = await query('SELECT * FROM investments WHERE user_id = $1', [userId])
    const totalInvestments = invRes.rows.reduce((sum, inv) => sum + Number(inv.current_value), 0)

    // Fetch debts
    const debtsRes = await query('SELECT * FROM debts WHERE user_id = $1', [userId])
    const totalDebt = debtsRes.rows.reduce((sum, debt) => sum + Number(debt.remaining_amount), 0)

    // Calculate Monthly
    const monthlyTxns = allTxns.filter(t => t.month === currentMonth && t.year === currentYear)
    const monthlyIncome = monthlyTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const monthlyExpenses = monthlyTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)

    // Calculate Totals
    const totalIncomeAll = allTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenseAll = allTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const liquidBalance = totalIncomeAll - totalExpenseAll

    const recentTxns = allTxns.slice(0, 5)

    return NextResponse.json({
      total_balance: liquidBalance,
      monthly_income: monthlyIncome,
      monthly_expenses: monthlyExpenses,
      net_worth: totalInvestments - totalDebt + liquidBalance,
      recent_transactions: recentTxns,
      investments_total: totalInvestments,
      debts_total: totalDebt
    })
  } catch (error: any) {
    console.error("DATABASE ERROR:", error)
    return NextResponse.json(
      { message: 'Server error', details: error.message }, 
      { status: 500 }
    )
  }
}