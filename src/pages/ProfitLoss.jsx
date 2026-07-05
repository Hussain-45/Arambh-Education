import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Trash2 } from 'lucide-react';

const ProfitLoss = () => {
  const { userRole, fees, expenses, students, addExpense, removeExpense, addToast } = useContext(AppContext);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newForm, setNewForm] = useState({
    category: '',
    desc: '',
    amount: '',
    type: 'Expense',
    date: new Date().toISOString().split('T')[0]
  });

  if (userRole !== 'admin') {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="prof-card">
            <h3>Access Denied</h3>
            <p>Only administrators can view financial records.</p>
          </div>
        </main>
      </>
    );
  }

  // Combined ledger calculation from actual fees & expenses
  const feeIncomeItems = fees
    .filter(f => (f.paid || 0) > 0)
    .map(f => {
      const student = students.find(s => s.id === f.studentId || s.id === f.student_id);
      return {
        id: `fee_${f.id}`,
        category: 'Student Fees',
        desc: `Tuition Fee: ${student?.name || 'Student'} (${f.month || 'Current'})`,
        amount: f.paid,
        type: 'Income',
        date: f.due_date || '2026-07-10',
        isFee: true
      };
    });

  const expenseItems = expenses.map(e => ({
    id: `exp_${e.id}`,
    category: e.title,
    desc: 'Recorded Expense',
    amount: -e.amount,
    type: 'Expense',
    date: e.date,
    isExpense: true,
    rawId: e.id
  }));

  const ledgerItems = [...feeIncomeItems, ...expenseItems].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Dynamic Calculations
  const grossRevenue = fees.reduce((sum, f) => sum + (f.paid || 0), 0);
  const operatingCosts = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = grossRevenue - operatingCosts;
  const profitMargin = grossRevenue > 0 ? ((netIncome / grossRevenue) * 100).toFixed(1) : '0.0';

  // Format currency helper
  const formatCurrency = (val) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(newForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (newForm.type === 'Income') {
      addToast('Direct Income entries are managed via Fee Collections.', 'warning');
      return;
    }

    const success = await addExpense(newForm.category, amountVal);
    if (success) {
      setShowAddForm(false);
      setNewForm({
        category: '',
        desc: '',
        amount: '',
        type: 'Expense',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        {/* Page Title & Add Button */}
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Expenses</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
              Thursday, July 2, 2026
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(prev => !prev)} 
            className="prof-btn" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <Plus size={16} /> Add Ledger Item
          </button>
        </div>

        {/* Collapsible Add Item Form */}
        {showAddForm && (
          <div className="prof-card" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', borderLeft: '4px solid var(--primary-text)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Add Financial Ledger Item</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Category</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Electricity, Marketing" 
                  value={newForm.category}
                  onChange={e => setNewForm(prev => ({ ...prev, category: e.target.value }))}
                  className="prof-input" 
                />
              </div>
              <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Monthly power bill payment" 
                  value={newForm.desc}
                  onChange={e => setNewForm(prev => ({ ...prev, desc: e.target.value }))}
                  className="prof-input" 
                />
              </div>
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="e.g. 1500" 
                  value={newForm.amount}
                  onChange={e => setNewForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="prof-input" 
                />
              </div>
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Type</label>
                <select 
                  value={newForm.type}
                  onChange={e => setNewForm(prev => ({ ...prev, type: e.target.value }))}
                  className="prof-input"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Date</label>
                <input 
                  type="date" 
                  required
                  value={newForm.date}
                  onChange={e => setNewForm(prev => ({ ...prev, date: e.target.value }))}
                  className="prof-input" 
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="prof-btn" style={{ padding: '0.75rem 1.5rem', fontWeight: 700 }}>
                  Save Item
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="prof-btn prof-btn-secondary" 
                  style={{ padding: '0.75rem 1.25rem', fontWeight: 700 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Financial KPI Cards */}
        <div className="dashboard-grid" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Card 1: Gross Revenue */}
          <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.75rem 2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Gross Revenue
            </span>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', lineHeight: '1.2' }}>
              {formatCurrency(grossRevenue)}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Fees Received
            </span>
          </div>

          {/* Card 2: Operating Costs */}
          <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.75rem 2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operating Costs
            </span>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ef4444', lineHeight: '1.2' }}>
              {formatCurrency(operatingCosts)}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Rent, Faculty, Infrastructure
            </span>
          </div>

          {/* Card 3: Net Income */}
          <div className="prof-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.75rem 2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Net Income
            </span>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#3b82f6', lineHeight: '1.2' }}>
              {formatCurrency(netIncome)}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Profit Margin: {profitMargin}%
            </span>
          </div>

        </div>

        {/* Financial Ledger Section */}
        <div className="prof-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, marginBottom: '2rem', color: 'var(--text-main)' }}>
            Financial Ledger
          </h2>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="prof-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Type</th>
                  <th style={{ textAlign: 'center', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgerItems.map(item => {
                  const isPositive = item.amount > 0;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Category */}
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {item.category}
                      </td>
                      {/* Description */}
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </td>
                      {/* Amount */}
                      <td style={{ 
                        padding: '1.25rem 1rem', 
                        fontSize: '0.9rem', 
                        fontWeight: 700, 
                        textAlign: 'center',
                        color: isPositive ? '#10b981' : '#ef4444' 
                      }}>
                        {isPositive ? '+ ' : '- '}
                        {formatCurrency(Math.abs(item.amount))}
                      </td>
                      {/* Type Badge */}
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isPositive ? '#10b981' : '#ef4444',
                          background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                          {item.type}
                        </span>
                      </td>
                      {/* Date */}
                      <td style={{ padding: '1.25rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>
                        {item.date}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                        {item.isExpense ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete this expense: ${item.category}?`)) {
                                removeExpense(item.rawId);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Delete Expense"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            background: 'var(--secondary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            display: 'inline-block'
                          }}>
                            System Generated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </>
  );
};

export default ProfitLoss;
