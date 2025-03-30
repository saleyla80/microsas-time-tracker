import React from 'react';
import { getDailyHours } from '../utils/timeUtils';

const TimeCard = ({ timeEntries, employeeId, startDate, endDate }) => {
  const getDayEntries = (date) => {
    return timeEntries.filter(entry => 
      entry.employeeId === employeeId && 
      entry.time.startsWith(date)
    );
  };

  const generateDateRange = (start, end) => {
    const dates = [];
    const curr = new Date(start);
    const last = new Date(end);
    
    while (curr <= last) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const dateRange = generateDateRange(startDate, endDate);
  const totalMinutes = dateRange.reduce((total, date) => {
    const hours = getDailyHours(timeEntries, employeeId, date);
    const [h, m] = hours.split(':').map(Number);
    return total + (h * 60 + m);
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left">Date</th>
            <th className="px-6 py-3 text-left">Day</th>
            <th className="px-6 py-3 text-left">Clock In</th>
            <th className="px-6 py-3 text-left">Clock Out</th>
            <th className="px-6 py-3 text-right">Hours</th>
          </tr>
        </thead>
        <tbody>
          {dateRange.map(date => {
            const dayEntries = getDayEntries(date);
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            const hours = getDailyHours(timeEntries, employeeId, date);

            return (
              <tr key={date} className="border-t">
                <td className="px-6 py-4">{date}</td>
                <td className="px-6 py-4">{dayOfWeek}</td>
                <td className="px-6 py-4">
                  {dayEntries.find(e => e.type === 'in')?.time.split('T')[1].slice(0, 5) || '-'}
                </td>
                <td className="px-6 py-4">
                  {dayEntries.find(e => e.type === 'out')?.time.split('T')[1].slice(0, 5) || '-'}
                </td>
                <td className="px-6 py-4 text-right">{hours}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-bold">
            <td colSpan="4" className="px-6 py-4">Total Hours</td>
            <td className="px-6 py-4 text-right">
              {Math.floor(totalMinutes / 60)}:{(totalMinutes % 60).toString().padStart(2, '0')}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default TimeCard; 