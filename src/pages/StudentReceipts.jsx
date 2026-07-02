import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { IndianRupee, Download, Info } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

const StudentReceipts = () => {
  const { loggedInUser, fees, recordFeePayment } = useContext(AppContext);

  if (!loggedInUser) return null;

  const monthsOrder = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const myFeesList = fees.filter(f => f.studentId === loggedInUser.id);
  const sortedFees = [...myFeesList].sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

  const totalAssigned = myFeesList.reduce((sum, f) => sum + f.total, 0);
  const totalPaid = myFeesList.reduce((sum, f) => sum + f.paid, 0);
  const totalPending = totalAssigned - totalPaid;

  const handleDownloadReceipt = (fee) => {
    const rows = [
      ['Student Name', loggedInUser.name],
      ['Admission No.', loggedInUser.admission_number || 'AES1'],
      ['Class/Batch', loggedInUser.class],
      ['Father\'s Name', loggedInUser.fatherName || 'Not Saved'],
      ['Month Paid', fee.month],
      ['Total Fee', `Rs. ${fee.total}`],
      ['Amount Paid', `Rs. ${fee.paid}`],
      ['Payment Mode', fee.paymentMode || 'Online Mock Gateway'],
      ['Payment Date', fee.paymentDate || new Date().toLocaleDateString()]
    ];
    exportToPDF(`Fee_Receipt_${fee.month}_${loggedInUser.name}`, `Fee Payment Receipt`, rows, ['Receipt Item', 'Details']);
  };

  const handleMockPay = async (fee) => {
    const amount = fee.total - fee.paid;
    const confirmPay = window.confirm(`Simulate online payment of Rs. ${amount} for ${fee.month}?`);
    if (confirmPay) {
      await recordFeePayment(loggedInUser.id, amount, 'Online Mock Gateway', new Date().toLocaleDateString(), fee.month);
      alert(`Payment of Rs. ${amount} for ${fee.month} received successfully!`);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        <Header />

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          {/* Header Info */}
          <div className="prof-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Receipts & Fees Ledger</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} /> Pay pending monthly fees or download official receipts for completed payments.
            </p>
          </div>

          {/* Fee Metrics Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="prof-card" style={{ borderLeft: '4px solid var(--primary-text)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Tuition Assigned</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>₹{totalAssigned}</div>
            </div>
            <div className="prof-card" style={{ borderLeft: '4px solid var(--success)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount Paid</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.5rem' }}>₹{totalPaid}</div>
            </div>
            <div className="prof-card" style={{ borderLeft: '4px solid var(--danger)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Remaining Balance</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.5rem' }}>₹{totalPending}</div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="prof-card">
            <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={20} style={{ color: 'var(--primary-text)' }} /> Monthly Fees Ledger
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="prof-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Due Date</th>
                    <th>Fee Amount</th>
                    <th>Paid Amount</th>
                    <th>Status</th>
                    <th>Payment Mode</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFees.map(fee => (
                    <tr key={fee.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fee.month}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{fee.dueDate}</td>
                      <td>₹{fee.total}</td>
                      <td>₹{fee.paid}</td>
                      <td>
                        <span className={`badge badge-${fee.status === 'Paid' ? 'success' : 'danger'}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {fee.paymentMode ? `${fee.paymentMode}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {fee.status !== 'Paid' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Payment</span>
                        ) : (
                          <button onClick={() => handleDownloadReceipt(fee)} className="prof-btn prof-btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Download size={12} /> Receipt PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sortedFees.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No fee ledger details available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default StudentReceipts;
