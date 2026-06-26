import React from 'react';

const RecentAttendance = () => {
  const records = [
    { id: 1, name: 'Rahul Sharma', class: 'Physics 101', time: '09:00 AM', status: 'Present' },
    { id: 2, name: 'Priya Singh', class: 'Physics 101', time: '09:05 AM', status: 'Present' },
    { id: 3, name: 'Amit Kumar', class: 'Math 202', time: '10:15 AM', status: 'Late' },
    { id: 4, name: 'Neha Gupta', class: 'Math 202', time: '--:--', status: 'Absent' },
    { id: 5, name: 'Vikas Patel', class: 'Chemistry 301', time: '11:00 AM', status: 'Present' },
  ];

  return (
    <div className="prof-card" style={{ flex: 1, minHeight: '300px' }}>
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>Recent Attendance</h2>
        <button className="prof-btn prof-btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>View All</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="prof-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: '0.8rem', fontWeight: 600
                  }}>
                    {record.name.charAt(0)}
                  </div>
                  <span style={{ fontWeight: 500 }}>{record.name}</span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{record.class}</td>
                <td style={{ fontSize: '0.9rem' }}>{record.time}</td>
                <td>
                  <span className={`badge badge-${record.status === 'Present' ? 'success' : record.status === 'Late' ? 'warning' : 'danger'}`}>
                    {record.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentAttendance;
