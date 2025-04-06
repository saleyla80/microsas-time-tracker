export const getPayPeriodForDate = (date, payPeriods) => {
  const targetDate = new Date(date);
  return payPeriods.find(period => {
    const start = new Date(period.start);
    const end = new Date(period.end);
    return targetDate >= start && targetDate <= end;
  });
};

export const generatePayPeriods = (baseDate, count) => {
  const periods = [];
  const start = new Date(baseDate);
  
  for (let i = 0; i < count; i++) {
    const periodStart = new Date(start);
    periodStart.setDate(start.getDate() + (i * 14));
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + 13);
    
    periods.push({
      start: periodStart.toISOString(),
      end: periodEnd.toISOString()
    });
  }
  
  return periods;
}; 