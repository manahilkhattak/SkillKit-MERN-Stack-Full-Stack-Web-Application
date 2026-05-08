// src/utils/helpers.jsx
export const fmtPKR  = n => 'PKR ' + Number(n||0).toLocaleString('en-PK');
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'}) : '—';
export const fmtDateTime = d => d ? new Date(d).toLocaleString('en-PK') : '—';
export const fmtMonth = d => d ? new Date(d).toLocaleDateString('en-PK',{month:'long',year:'numeric'}) : '—';

export const Badge = ({ status, className='' }) => (
  <span className={`badge badge-${status} ${className}`}>{(status||'').replace(/_/g,' ')}</span>
);

export const ordinal = n => {
  const s=['th','st','nd','rd'], v=n%100;
  return n+(s[(v-20)%10]||s[v]||s[0]);
};
