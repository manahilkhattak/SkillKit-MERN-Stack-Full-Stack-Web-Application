const generateTxId = () => {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const r = Math.floor(Math.random() * 90000 + 10000);
  return `TXN-${d}-${r}`;
};

const generateSerialNumber = (trade) => {
  const prefix = (trade || 'KIT').slice(0,3).toUpperCase();
  const d = new Date().toISOString().slice(2,10).replace(/-/g,'');
  const r = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${d}-${r}`;
};

module.exports = { generateTxId, generateSerialNumber };
