import React, { useRef, useContext } from 'react';
import { X, Printer, Share2 } from 'lucide-react';
import logoImg from '../assets/aarambh_logo.png';
import { AppContext } from '../context/AppContext';

const FeeReceiptModal = ({ isOpen, onClose, fee, student, className }) => {
  const receiptRef = useRef();
  const { theme } = useContext(AppContext);

  if (!isOpen || !fee) return null;

  const dueAmount = fee.total - fee.paid;
  const receiptNumber = `ARM-FEE-${fee.id.toString().padStart(5, '0')}`;
  const transactionDate = fee.paymentDate || new Date().toLocaleDateString();
  const isDark = theme === 'dark';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Dear Parent, here is the official receipt details for your child ${student?.name || fee.name || 'Student'}:\nReceipt No: ${receiptNumber}\nMonth: ${fee.month}\nAmount Paid: Rs. ${fee.paid}\nBalance: Rs. ${dueAmount}\nStatus: ${fee.status}\nThank you for choosing Aarambh!`;
    const encodedText = encodeURIComponent(text);
    const phone = student?.parentPhone || fee.parentPhone;
    if (phone) {
      window.open(`https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodedText}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  };

  return (
    <div className="printable-receipt-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1100, padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="printable-receipt-card" style={{
        background: isDark ? 'rgba(15, 23, 42, 0.92)' : '#ffffff',
        borderRadius: '16px',
        width: '100%', maxWidth: '600px', padding: '24px',
        boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.35)' : 'var(--shadow-modal, 0 8px 30px rgba(0,0,0,0.12))',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--modal-border, rgba(0,0,0,0.08))',
        display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        color: isDark ? '#f8fafc' : '#0f172a'
      }}>
        {/* Close Button */}
        <button onClick={onClose} className="printable-receipt-close" style={{
          position: 'absolute', top: '16px', right: '16px', border: 'none',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)'
        }}>
          <X size={20} />
        </button>

        {/* Watermark Logo */}
        <div className="receipt-watermark" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: isDark ? 0.06 : 0.09,
          zIndex: 0,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '90%',
          height: '90%',
          overflow: 'hidden'
        }}>
          <img src={logoImg} alt="Institution Logo Watermark" style={{ width: '420px', height: '420px', objectFit: 'contain', filter: isDark ? 'brightness(0) invert(1)' : 'none' }} />
        </div>

        {/* Receipt Container */}
        <div ref={receiptRef} style={{ padding: '10px', position: 'relative', zIndex: 1, color: isDark ? '#cbd5e1' : 'var(--text-main)' }}>
          <div style={{ textAlign: 'center', borderBottom: isDark ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid var(--primary-text, #4A90E2)', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ color: isDark ? '#60a5fa' : 'var(--primary-text, #4A90E2)', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Aarambh Tuition Center</h2>
            <p style={{ color: isDark ? '#94a3b8' : 'var(--text-muted, #666)', margin: '5px 0 0 0', fontSize: '13px' }}>123, Aarambh Building, Model Town, India</p>
            <p style={{ color: isDark ? '#94a3b8' : 'var(--text-muted, #666)', margin: '2px 0 0 0', fontSize: '12px' }}>Email: aarambhinstitute46@gmail.com</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px', color: isDark ? '#cbd5e1' : 'var(--text-main)' }}>
            <div>
              <strong>Receipt No:</strong> {receiptNumber}<br />
              <strong>Date:</strong> {transactionDate}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Payment Status:</strong> <span style={{ color: fee.status === 'Paid' ? 'var(--text-success, #2e7d32)' : 'var(--text-danger, #c62828)', fontWeight: 'bold' }}>{fee.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-muted, #f8f9fa)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: isDark ? '#cbd5e1' : 'var(--text-main)', border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid var(--modal-border, rgba(0,0,0,0.08))' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><strong>Student Name:</strong> {student?.name || fee.name || 'N/A'}</div>
              <div><strong>Batch Name:</strong> {className || student?.class || 'N/A'}</div>
              <div><strong>Father Name:</strong> {student?.fatherName || 'N/A'}</div>
              <div><strong>Contact Number:</strong> {student?.parentPhone || 'N/A'}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: isDark ? '#cbd5e1' : 'var(--text-main)' }}>
            <thead>
              <tr style={{ background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'var(--bg-muted, #f8f9fa)' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--table-border, #ddd)' }}>Fee Description</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--table-border, #ddd)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid var(--table-border, #eee)' }}>Tuition Fee for Month: {fee.month}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid var(--table-border, #eee)' }}>Rs. {fee.total}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid var(--table-border, #eee)', fontWeight: 'bold' }}>Amount Paid</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid var(--table-border, #eee)', fontWeight: 'bold', color: 'var(--text-success, #2e7d32)' }}>Rs. {fee.paid}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', fontSize: '14px', borderTop: isDark ? '2px solid rgba(255, 255, 255, 0.15)' : '2px solid var(--table-border, #ddd)' }}>
                <td style={{ padding: '10px' }}>Balance Outstanding</td>
                <td style={{ padding: '10px', textAlign: 'right', color: dueAmount > 0 ? 'var(--text-danger, #c62828)' : 'var(--text-success, #2e7d32)' }}>Rs. {dueAmount}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {fee.status === 'Paid' ? (
              <span className="stamp" style={{ border: '2px dashed var(--text-success, #2e7d32)', color: 'var(--text-success, #2e7d32)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '16px', padding: '5px 15px', display: 'inline-block', transform: 'rotate(-5deg)', marginTop: '15px', borderRadius: '4px' }}>PAID RECEIPT</span>
            ) : (
              <span className="stamp" style={{ border: '2px dashed var(--text-danger, #c62828)', color: 'var(--text-danger, #c62828)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '16px', padding: '5px 15px', display: 'inline-block', transform: 'rotate(-5deg)', marginTop: '15px', borderRadius: '4px' }}>PENDING DUE</span>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '11px', color: isDark ? '#94a3b8' : 'var(--text-muted)' }}>
            Thank you for your trust in Aarambh.
          </div>
        </div>

        {/* Actions panel */}
        <div className="printable-receipt-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--table-border, #eee)', paddingTop: '15px' }}>
          <button onClick={handleShare} className="prof-btn prof-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
            <Share2 size={16} /> Share via WhatsApp
          </button>
          <button onClick={handlePrint} className="prof-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
            <Printer size={16} /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeReceiptModal;
