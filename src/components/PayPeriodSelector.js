import React, { useState } from 'react';

const PayPeriodSelector = ({ 
  startDate, 
  endDate, 
  onDateChange,
  className 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get the base pay period (March 26, 2025)
  const basePeriodStart = new Date(2025, 2, 26); // March 26, 2025

  // Calculate current pay period based on base date
  const getCurrentPayPeriod = () => {
    const today = new Date();
    const diffDays = Math.floor((today - basePeriodStart) / (1000 * 60 * 60 * 24));
    const periodOffset = Math.floor(diffDays / 14) * 14;
    
    const currentStart = new Date(basePeriodStart);
    currentStart.setDate(currentStart.getDate() + periodOffset);
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 13);
    
    return { start: currentStart, end: currentEnd };
  };

  // Navigate between pay periods
  const navigatePeriod = (direction) => {
    const currentStart = new Date(startDate);
    const newStart = new Date(currentStart);
    newStart.setDate(currentStart.getDate() + (direction * 14));
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 13);
    
    onDateChange(newStart, newEnd);
  };

  // Format date as MM/DD/YY
  const formatDate = (date) => {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(2);
    return `${month}/${day}/${year}`;
  };

  // Quick select options
  const quickSelect = (period) => {
    let newStart, newEnd;
    
    switch(period) {
      case 'current':
        const current = getCurrentPayPeriod();
        newStart = current.start;
        newEnd = current.end;
        break;
      case 'previous':
        newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() - 14);
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 13);
        break;
      case 'next':
        newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() + 14);
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 13);
        break;
      default:
        return;
    }
    
    onDateChange(newStart, newEnd);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigatePeriod(-1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center space-x-2 px-3 py-2 border rounded hover:bg-gray-50"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
        </button>

        <button
          onClick={() => navigatePeriod(1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {isCalendarOpen && (
        <div className="absolute top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="space-y-2">
              <button
                onClick={() => quickSelect('current')}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded"
              >
                Current Pay Period
              </button>
              <button
                onClick={() => quickSelect('previous')}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded"
              >
                Previous Pay Period
              </button>
              <button
                onClick={() => quickSelect('next')}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded"
              >
                Next Pay Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayPeriodSelector; 