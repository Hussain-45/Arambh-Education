import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { IndianRupee, Download, Info, CheckCircle2, CreditCard } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import FeeReceiptModal from '../components/FeeReceiptModal';

const StudentReceipts = () => {
  const { loggedInUser, fees, recordFeePayment, students } = useContext(AppContext);
  const [selectedPendingId, setSelectedPendingId] = useState('');
  
  // Receipt modal states
  const [selectedReceiptFee, setSelectedReceiptFee] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const monthsOrder = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getJoiningMonthIndex = (regDateStr) => {
    if (!regDateStr) return 0;
    const parts = regDateStr.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return monthNum - 1;
      }
    }
    return 0;
  };

  const studentProfile = students.find(s => s.id === loggedInUser?.id);
  const regDate = studentProfile?.registrationDate || loggedInUser?.registrationDate || loggedInUser?.registration_date;
  const joiningMonthIndex = getJoiningMonthIndex(regDate);
  const myFeesList = loggedInUser 
    ? fees.filter(f => f.studentId === loggedInUser.id && monthsOrder.indexOf(f.month) >= joiningMonthIndex) 
    : [];
  const sortedFees = [...myFeesList].sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

  const pendingFees = sortedFees.filter(f => f.status !== 'Paid');

  useEffect(() => {
    if (pendingFees.length > 0 && !selectedPendingId) {
      setSelectedPendingId(pendingFees[0].id.toString());
    }
  }, [pendingFees, selectedPendingId]);

  if (!loggedInUser) return null;

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

  const handleQuickPaySubmit = (e) => {
    e.preventDefault();
    const fee = pendingFees.find(f => f.id.toString() === selectedPendingId);
    if (fee) {
      handleMockPay(fee);
    }
  };

  return (
    <>
      <Sidebar />
      <main className="main-content" style={{ padding: '2rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
        <Header />

        <div style={{ width: '100%' }}>
          
          {/* Header Info */}
          <div className="prof-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--secondary) 100%)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>My Receipts & Fees Ledger</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={16} /> Pay pending monthly fees or download official receipts for completed payments.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Left Column: Ledger Table */}
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
                            <button onClick={() => { setSelectedReceiptFee(fee); setIsReceiptModalOpen(true); }} className="prof-btn prof-btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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

            {/* Right Column: Stats & Mock Payments Quick Pay */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Vertical Metrics Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="prof-card" style={{ borderLeft: '4px solid var(--primary-text)', padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Tuition Assigned</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.3rem' }}>₹{totalAssigned}</div>
                </div>

                <div className="prof-card" style={{ borderLeft: '4px solid var(--success)', padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount Paid</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.3rem' }}>₹{totalPaid}</div>
                </div>

                <div className="prof-card" style={{ borderLeft: '4px solid var(--danger)', padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Balance</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)', marginTop: '0.3rem' }}>₹{totalPending}</div>
                </div>
              </div>

              {/* Quick Pay Portal */}
              <div className="prof-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard size={18} style={{ color: 'var(--primary-text)' }} /> Quick Pay Portal
                </h3>
                {pendingFees.length > 0 ? (
                  <form onSubmit={handleQuickPaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select Pending Month:</label>
                    <select
                      value={selectedPendingId}
                      onChange={e => setSelectedPendingId(e.target.value)}
                      className="prof-input"
                      style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                    >
                      {pendingFees.map(f => (
                        <option key={f.id} value={f.id}>{f.month} — Due: ₹{f.total - f.paid}</option>
                      ))}
                    </select>
                    <button type="submit" className="prof-btn" style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}>
                      Mock Online Payment
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🎉</div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>All Dues Cleared!</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Thank you for timely fee submissions.</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </main>
      <FeeReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => { setIsReceiptModalOpen(false); setSelectedReceiptFee(null); }} 
        fee={selectedReceiptFee} 
        student={loggedInUser} 
        className={loggedInUser.class} 
      />
    </>
  );
};

export default StudentReceipts;
