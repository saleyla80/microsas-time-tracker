export const calculateHours = (inTime, outTime) => {
  if (!inTime || !outTime) return '0:00';
  const diff = new Date(outTime) - new Date(inTime);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export const getDailyHours = (timeEntries, employeeId, startDate, endDate = startDate) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const relevantEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.time);
    return (
      entry.employeeId === employeeId && 
      entryDate >= start && 
      entryDate <= end
    );
  });

  let totalMinutes = 0;
  let inTime = null;

  relevantEntries.forEach(entry => {
    if (entry.type === 'in') {
      inTime = new Date(entry.time);
    } else if (entry.type === 'out' && inTime) {
      const outTime = new Date(entry.time);
      totalMinutes += (outTime - inTime) / (1000 * 60);
      inTime = null;
    }
  });

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}; 