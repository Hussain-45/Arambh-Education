import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="prof-card">
      <div className="flex-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
        </div>
        <div style={{ 
          padding: '0.8rem', 
          background: 'var(--secondary)', 
          borderRadius: '12px',
          color: 'var(--primary-text)'
        }}>
          <Icon size={24} />
        </div>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ 
          color: trend > 0 ? 'var(--success)' : 'var(--danger)', 
          fontWeight: 600
        }}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span style={{ color: 'var(--text-muted)' }}>vs last month</span>
      </div>
    </div>
  );
};

export default StatCard;
