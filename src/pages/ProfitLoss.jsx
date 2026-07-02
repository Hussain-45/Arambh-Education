import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { TrendingUp, TrendingDown, Plus, Trash2, Edit } from 'lucide-react';

const ProfitLoss = () => {
  const { userRole, fees, expenses, addExpense, editExpense, removeExpense } = useContext(AppContext);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  if (userRole !== 'admin') {
    return (
      <>
        <Sidebar />
        <main className="main-content">
          <Header />
          <div className="prof-card"><h3>Access Denied</h3><p>Only administrators can view financial records.</p></div>
        </main>
      </>
    );
  }

  // Calculations
  const totalIncome = fees.reduce((sum, fee) => sum + fee.paid, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const isProfitable = netProfit >= 0;

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (editingExpenseId) {
      await editExpense(editingExpenseId, title, amount);
      setEditingExpenseId(null);
    } else {
      await addExpense(title, amount);
    }
    setShowAdd(false);
    setTitle('');
    setAmount('');
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    await removeExpense(id);
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="flex-between" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Profit & Loss Dashboard</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="prof-btn">
            <Plus size={16} /> Add Expense
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="prof-card" style={{ borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Income (Fees)</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>Rs. {totalIncome}</div>
          </div>
          <div className="prof-card" style={{ borderLeft: '4px solid var(--danger)' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Expenses</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger)' }}>Rs. {totalExpenses}</div>
          </div>
          <div className="prof-card" style={{ borderLeft: `4px solid ${isProfitable ? 'var(--primary-text)' : 'var(--danger)'}` }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Net Profit</h3>
            <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Rs. {netProfit}
              {isProfitable ? <TrendingUp color="var(--primary-text)" size={24}/> : <TrendingDown color="var(--danger)" size={24}/>}
            </div>
          </div>
        </div>

        {showAdd && (
          <div className="prof-card" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)' }}>
            <h3>{editingExpenseId ? 'Edit Expense' : 'Add New Expense'}</h3>
            <form onSubmit={handleSaveExpense} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="prof-label">Description / Title</label>
                <input required type="text" className="prof-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Teacher Salary, Electricity" />
              </div>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label className="prof-label">Amount (Rs.)</label>
                <input required type="number" className="prof-input" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 5000" />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="prof-btn">{editingExpenseId ? 'Update Expense' : 'Save Expense'}</button>
                {editingExpenseId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingExpenseId(null); setTitle(''); setAmount(''); setShowAdd(false); }} 
                    className="prof-btn prof-btn-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="prof-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Expense History</h3>
          <table className="prof-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td>{exp.date}</td>
                  <td>{exp.title}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 500 }}>- Rs. {exp.amount}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                      <button 
                        onClick={() => {
                          setEditingExpenseId(exp.id);
                          setTitle(exp.title);
                          setAmount(exp.amount);
                          setShowAdd(true);
                        }} 
                        style={{ background: 'none', border: 'none', color: 'var(--primary-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        title="Edit Expense"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        title="Delete Expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No expenses recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default ProfitLoss;
