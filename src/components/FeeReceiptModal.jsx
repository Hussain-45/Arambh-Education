import React, { useRef } from 'react';
import { X, Printer, Share2 } from 'lucide-react';

const FeeReceiptModal = ({ isOpen, onClose, fee, student, className }) => {
  const receiptRef = useRef();

  if (!isOpen || !fee) return null;

  const dueAmount = fee.total - fee.paid;
  const receiptNumber = `ARM-FEE-${fee.id.toString().padStart(5, '0')}`;
  const transactionDate = fee.paymentDate || new Date().toLocaleDateString();

  const handlePrint = () => {
    const printContent = receiptRef.current.innerHTML;

    // Open a print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Tuition Fee Receipt - ${student?.name || fee.name || 'Student'}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 12px; }
            .stamp { border: 2px dashed #2e7d32; color: #2e7d32; text-transform: uppercase; font-weight: bold; font-size: 16px; padding: 5px 15px; display: inline-block; transform: rotate(-5deg); margin-top: 15px; border-radius: 4px; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="receipt-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 1100, padding: '20px'
    }}>
      <div style={{
        background: 'var(--card-bg, #ffffff)', borderRadius: '16px',
        width: '100%', maxWidth: '600px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative'
      }}>
        {/* Close Button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', border: 'none',
          background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)'
        }}>
          <X size={20} />
        </button>

        {/* Receipt Container */}
        <div ref={receiptRef} style={{ padding: '10px' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary, #4A90E2)', paddingBottom: '15px', marginBottom: '20px' }}>
            <h2 style={{ color: 'var(--primary, #4A90E2)', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Aarambh Tuition Center</h2>
            <p style={{ color: 'var(--text-muted, #666)', margin: '5px 0 0 0', fontSize: '13px' }}>123, Aarambh Building, Model Town, India</p>
            <p style={{ color: 'var(--text-muted, #666)', margin: '2px 0 0 0', fontSize: '12px' }}>Email: aarambhinstitute46@gmail.com</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px', color: 'var(--text-main)' }}>
            <div>
              <strong>Receipt No:</strong> {receiptNumber}<br />
              <strong>Date:</strong> {transactionDate}
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong>Payment Status:</strong> <span style={{ color: fee.status === 'Paid' ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>{fee.status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-muted, #f8f9fa)', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: 'var(--text-main)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
              <div><strong>Student Name:</strong> {student?.name || fee.name || 'N/A'}</div>
              <div><strong>Batch Name:</strong> {className || student?.class || 'N/A'}</div>
              <div><strong>Father Name:</strong> {student?.fatherName || 'N/A'}</div>
              <div><strong>Contact Number:</strong> {student?.parentPhone || 'N/A'}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: 'var(--text-main)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-muted, #f8f9fa)' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Fee Description</th>
                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Tuition Fee for Month: {fee.month}</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Rs. {fee.total}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Amount Paid</td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 'bold', color: '#2e7d32' }}>Rs. {fee.paid}</td>
              </tr>
              <tr style={{ fontWeight: 'bold', fontSize: '14px', borderTop: '2px solid #ddd' }}>
                <td style={{ padding: '10px' }}>Balance Outstanding</td>
                <td style={{ padding: '10px', textAlign: 'right', color: dueAmount > 0 ? '#c62828' : '#2e7d32' }}>Rs. {dueAmount}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {fee.status === 'Paid' ? (
              <span className="stamp" style={{ border: '2px dashed #2e7d32', color: '#2e7d32', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '16px', padding: '5px 15px', display: 'inline-block', transform: 'rotate(-5deg)', marginTop: '15px', borderRadius: '4px' }}>PAID RECEIPT</span>
            ) : (
              <span className="stamp" style={{ border: '2px dashed #c62828', color: '#c62828', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '16px', padding: '5px 15px', display: 'inline-block', transform: 'rotate(-5deg)', marginTop: '15px', borderRadius: '4px' }}>PENDING DUE</span>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Thank you for your trust in Aarambh.
          </div>
        </div>

        {/* Actions panel */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
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
