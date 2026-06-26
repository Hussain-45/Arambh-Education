import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { Download } from 'lucide-react';

const Fees = () => {
  const { fees, students, recordFeePayment, sendMessage } = useContext(AppContext);

  const handleSendReminder = (fee) => {
    const student = students.find(s => s.id === fee.studentId);
    const amountDue = fee.total - fee.paid;
    sendMessage(student.parentPhone, 'SMS', `Reminder: Fees of Rs.${amountDue} for ${student.name} is due.`);
  };

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Total Fee', 'Paid', 'Status', 'Due Date'];
    const rows = fees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      return [student?.name, f.total, f.paid, f.status, f.dueDate];
    });
    exportToCSV('fee_records', rows, headers);
  };

  const handleExportPDF = () => {
    const headers = ['Student Name', 'Total Fee', 'Paid', 'Status', 'Due Date'];
    const rows = fees.map(f => {
      const student = students.find(s => s.id === f.studentId);
      return [student?.name, `Rs. ${f.total}`, `Rs. ${f.paid}`, f.status, f.dueDate];
    });
    exportToPDF('Fee Records', 'fee_records', rows, headers);
  };

  return (
    <>
      <Sidebar />
      <main className="main-content">
        <Header />
        
        <div className="prof-card" style={{ flex: 1 }}>
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Fee Records</h2>
            <div className="flex-center gap-1">
              <button onClick={handleExportCSV} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> CSV
              </button>
              <button onClick={handleExportPDF} className="prof-btn prof-btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="prof-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => {
                  const student = students.find(s => s.id === fee.studentId);
                  return (
                    <tr key={fee.id}>
                      <td style={{ fontWeight: 500 }}>{student?.name}</td>
                      <td>Rs. {fee.total}</td>
                      <td>Rs. {fee.paid}</td>
                      <td>
                        <span className={`badge badge-${fee.status === 'Paid' ? 'success' : fee.status === 'Pending' ? 'warning' : 'danger'}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        {fee.status !== 'Paid' && (
                          <>
                            <button onClick={() => recordFeePayment(fee.studentId, fee.total - fee.paid)} className="prof-btn prof-btn-secondary" style={{ color: 'var(--success)', borderColor: 'var(--success)', background: 'transparent' }}>Mark Paid</button>
                            <button onClick={() => handleSendReminder(fee)} className="prof-btn">Send Reminder</button>
                          </>
                        )}
                        {fee.status === 'Paid' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No actions needed</span>
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

export default Fees;
