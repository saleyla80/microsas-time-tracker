import React, { useState, useEffect } from 'react';
import { getDailyHours } from '../../utils/timeUtils';
import { db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  orderBy, 
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

console.log('AdminView loaded, Firebase db:', db);

const INITIAL_PAY_PERIOD_START = '2025-03-26'; // Wednesday, March 26, 2025
const PAY_PERIOD_LENGTH = 14; // days

const getPayPeriodEndDate = (startDate) => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + PAY_PERIOD_LENGTH - 1); // Subtract 1 to make it 14 days inclusive
  return end.toISOString().split('T')[0];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  // Convert to local timezone
  const localDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles' // or your local timezone
  }));
  const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
  const day = localDate.getDate().toString().padStart(2, '0');
  const year = localDate.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

// Add these functions to handle persistent storage
const saveTimeEntries = (entries) => {
  localStorage.setItem('timeEntries', JSON.stringify(entries));
};

const loadTimeEntries = () => {
  const saved = localStorage.getItem('timeEntries');
  return saved ? JSON.parse(saved) : [];
};

const AdminView = ({ 
  employees, 
  setEmployees,
  timeEntries, 
  setTimeEntries,
  onLogout, 
  companyName,
  setCompanyName
}) => {
  // Initialize the current period
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const savedPeriod = localStorage.getItem('currentPayPeriod');
    if (savedPeriod) {
      const parsed = JSON.parse(savedPeriod);
      // Validate that saved date matches our schedule
      if (parsed.start === INITIAL_PAY_PERIOD_START) {
        return parsed;
      }
    }
    // Default to initial period
    return {
      start: INITIAL_PAY_PERIOD_START,
      end: getPayPeriodEndDate(INITIAL_PAY_PERIOD_START)
    };
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  const today = new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  const [reportEntries, setReportEntries] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);

  // Add this state for editing
  const [editingEntry, setEditingEntry] = useState(null);
  const [editTime, setEditTime] = useState('');

  // Update the Firebase loading useEffect
  useEffect(() => {
    console.log('Checking Firebase connection...');
    const loadTimeEntries = async () => {
      setIsLoading(true);
      try {
        console.log('Attempting to load entries from Firebase...');
        const q = query(
          collection(db, 'timeEntries'),
          orderBy('time', 'desc')
        );
        const snapshot = await getDocs(q);
        console.log('Entries loaded from Firebase:', snapshot.docs.length);
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: new Date(doc.data().time).toISOString()
        }));
        setTimeEntries(entries);
      } catch (error) {
        console.error('Error loading time entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeEntries();
  }, []);

  // Update navigation function
  const navigatePeriod = (direction) => {
    const start = new Date(currentPeriod.start);
    start.setDate(start.getDate() + (direction * PAY_PERIOD_LENGTH));
    const newStartDate = start.toISOString().split('T')[0];
    const newEndDate = getPayPeriodEndDate(newStartDate);
    
    const newPeriod = {
      start: newStartDate,
      end: newEndDate
    };
    
    setCurrentPeriod(newPeriod);
    localStorage.setItem('currentPayPeriod', JSON.stringify(newPeriod));
  };

  useEffect(() => {
    // Save current report to localStorage
    const reportKey = `report_${currentPeriod.start}_${currentPeriod.end}`;
    localStorage.setItem(reportKey, JSON.stringify({
      startDate: currentPeriod.start,
      endDate: currentPeriod.end,
      timeEntries: timeEntries.filter(entry => 
        entry.time >= currentPeriod.start && 
        entry.time <= currentPeriod.end
      )
    }));
  }, [currentPeriod.start, currentPeriod.end, timeEntries]);

  // Update handleClockInOut function
  const handleClockInOut = async (employee) => {
    console.log('Starting clock in/out for employee:', employee.name);

    const now = new Date();
    const lastEntry = timeEntries
      .filter(entry => entry.employeeId === employee.id)
      .sort((a, b) => new Date(b.time) - new Date(a.time))[0];
    
    const entryType = lastEntry?.type === 'in' ? 'out' : 'in';
    console.log('Entry type:', entryType);
    
    const newEntry = {
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      time: now.toISOString(),
      type: entryType,
      category: 'REG'
    };
    
    console.log('Attempting to save entry:', newEntry);

    try {
      // Save to Firebase
      const timeEntriesRef = collection(db, 'timeEntries');
      const docRef = await addDoc(timeEntriesRef, newEntry);
      console.log('Successfully saved to Firebase with ID:', docRef.id);

      // Update local state
      const entryWithId = { ...newEntry, id: docRef.id };
      setTimeEntries(prev => [entryWithId, ...prev]);
      console.log('Local state updated with new entry');
    } catch (error) {
      console.error('Error saving time entry:', error);
      alert('Error saving time entry. Please try again.');
    }
  };

  // Move the loadReportData function and its useEffect outside renderReports
  useEffect(() => {
    const loadReportData = async () => {
      setReportLoading(true);
      try {
        const timeEntriesRef = collection(db, 'timeEntries');
        const q = query(
          timeEntriesRef,
          where('time', '>=', currentPeriod.start),
          where('time', '<=', currentPeriod.end + 'T23:59:59'),
          orderBy('time', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time // Make sure time is included
        }));
        
        console.log('Loaded report entries:', entries);
        setReportEntries(entries);
      } catch (error) {
        console.error('Error loading report data:', error);
      } finally {
        setReportLoading(false);
      }
    };

    loadReportData();
  }, [currentPeriod.start, currentPeriod.end]);

  // Add this function to handle hour updates
  const handleHourUpdate = async (employeeId, entryId, newTime) => {
    try {
      // Validate the new time
      const newDate = new Date(newTime);
      if (isNaN(newDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Update in Firebase
      const entryRef = doc(db, 'timeEntries', entryId);
      await updateDoc(entryRef, {
        time: newDate.toISOString()
      });

      // Update both reportEntries and timeEntries states
      const updateEntry = (entry) => 
        entry.id === entryId 
          ? { ...entry, time: newDate.toISOString() }
          : entry;

      setReportEntries(entries => entries.map(updateEntry));
      setTimeEntries(entries => entries.map(updateEntry));

      console.log('Successfully updated time entry');
    } catch (error) {
      console.error('Error updating time:', error);
      alert('Error updating time entry. Please ensure the date and time are valid.');
    }
  };

  // Update the handleEditEntry function to properly handle timezone conversions
  const handleEditEntry = async (employeeId, date, entries) => {
    const dayEntries = reportEntries.filter(entry => {
      // Convert entry time to local date for comparison
      const entryDate = new Date(entry.time).toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles' // or your local timezone
      });
      const compareDate = new Date(date).toLocaleDateString('en-US', {
        timeZone: 'America/Los_Angeles'
      });
      return entry.employeeId === employeeId && entryDate === compareDate;
    });
    
    if (dayEntries.length > 0) {
      const entry = dayEntries[0];
      // Format the time for the datetime-local input
      const localTime = new Date(entry.time);
      const formattedTime = localTime.toISOString().slice(0, 16);
      setEditTime(formattedTime);
      setEditingEntry({
        ...entry,
        date
      });
    }
  };

  const handleDeleteEntry = async (employeeId, date) => {
    if (!window.confirm('Are you sure you want to delete these time entries?')) {
      return;
    }

    try {
      // Find all entries for this employee on this date
      const entriesToDelete = reportEntries.filter(entry => 
        entry.employeeId === employeeId && 
        entry.time.split('T')[0] === date
      );

      // Delete each entry from Firebase
      for (const entry of entriesToDelete) {
        const entryRef = doc(db, 'timeEntries', entry.id);
        await deleteDoc(entryRef);
      }

      // Update local state
      setReportEntries(entries => 
        entries.filter(entry => 
          !(entry.employeeId === employeeId && 
            entry.time.split('T')[0] === date)
        )
      );

      setTimeEntries(entries => 
        entries.filter(entry => 
          !(entry.employeeId === employeeId && 
            entry.time.split('T')[0] === date)
        )
      );

      alert('Entries deleted successfully');
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('Error deleting entries. Please try again.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editTime) return;

    try {
      const newDate = new Date(editTime);
      if (isNaN(newDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Update in Firebase
      const entryRef = doc(db, 'timeEntries', editingEntry.id);
      await updateDoc(entryRef, {
        time: newDate.toISOString()
      });

      // Update local states
      const updateEntry = (entry) => 
        entry.id === editingEntry.id 
          ? { ...entry, time: newDate.toISOString() }
          : entry;

      setReportEntries(entries => entries.map(updateEntry));
      setTimeEntries(entries => entries.map(updateEntry));

      // Clear editing state
      setEditingEntry(null);
      setEditTime('');

      alert('Time entry updated successfully');
    } catch (error) {
      console.error('Error updating time:', error);
      alert('Error updating time entry. Please ensure the date and time are valid.');
    }
  };

  // Update the renderReports function
  const renderReports = () => {
    if (reportLoading) {
      return <div className="p-6 text-center">Loading report data...</div>;
    }

    // Simplify daily totals calculation
    const dailyTotals = {};
    reportEntries.forEach(entry => {
      const date = entry.time.split('T')[0];
      const employeeId = entry.employeeId;
      if (!dailyTotals[employeeId]) {
        dailyTotals[employeeId] = {};
      }
      if (!dailyTotals[employeeId][date]) {
        dailyTotals[employeeId][date] = {
          in: null,
          out: null,
          total: 0
        };
      }
      
      if (entry.type === 'in') {
        dailyTotals[employeeId][date].in = entry.time;
      } else {
        dailyTotals[employeeId][date].out = entry.time;
      }
    });

    // Simplify hours calculation
    Object.keys(dailyTotals).forEach(employeeId => {
      Object.keys(dailyTotals[employeeId]).forEach(date => {
        const day = dailyTotals[employeeId][date];
        if (day.in && day.out) {
          const hours = (new Date(day.out) - new Date(day.in)) / (1000 * 60 * 60);
          day.total = hours.toFixed(2);
        }
      });
    });

    return (
      <div className="p-4">
        {/* Pay Period Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Time Cards</h2>
          <div className="text-center flex-1">
            <div className="text-lg font-semibold">Pay Period</div>
            <div>{formatDate(currentPeriod.start)} - {formatDate(currentPeriod.end)}</div>
          </div>
          <div className="w-32"></div>
        </div>

        {/* Employee Time Cards */}
        {employees.map(employee => {
          const employeeTotals = dailyTotals[employee.id] || {};
          let periodTotal = 0;

          return (
            <div key={employee.id} className="mb-8 bg-white rounded-lg shadow">
              {/* Employee Header */}
              <div className="bg-gray-50 p-4 rounded-t-lg border-b">
                <h3 className="font-bold">{employee.name}</h3>
                <div className="text-sm text-gray-600">Dept: {employee.department}</div>
              </div>

              {/* Time Card Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">DATE</th>
                      <th className="px-4 py-2">IN</th>
                      <th className="px-4 py-2">OUT</th>
                      <th className="px-4 py-2">TOTAL</th>
                      <th className="px-4 py-2">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDatesInRange(currentPeriod.start, currentPeriod.end).map(date => {
                      const dayData = employeeTotals[date] || {};
                      periodTotal += Number(dayData.total || 0);

                      return (
                        <tr key={date} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{formatDate(date)}</td>
                          <td className="px-4 py-2 text-center">
                            {dayData.in ? new Date(dayData.in).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'America/Los_Angeles' // or your local timezone
                            }) : '-'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {dayData.out ? new Date(dayData.out).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'America/Los_Angeles' // or your local timezone
                            }) : '-'}
                          </td>
                          <td className="px-4 py-2 text-center font-semibold">{dayData.total || '-'}</td>
                          <td className="px-4 py-2 text-center">
                            {(dayData.in || dayData.out) && (
                              <div className="flex justify-center space-x-2">
                                {editingEntry?.date === date && editingEntry?.employeeId === employee.id ? (
                                  <>
                                    <input
                                      type="datetime-local"
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      className="w-40 px-2 py-1 border rounded"
                                    />
                                    <button
                                      onClick={handleSaveEdit}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingEntry(null);
                                        setEditTime('');
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditEntry(employee.id, date)}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      ✎
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEntry(employee.id, date)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      ×
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-4 py-2" colSpan="3">Period Total</td>
                      <td className="px-4 py-2 text-center">{periodTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div className="p-2 sm:p-6">
        {renderPayPeriodHeader()}

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Employees</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(employee => {
              // Get the most recent entry for this employee
              const latestEntry = timeEntries
                .filter(entry => entry.employeeId === employee.id)
                .sort((a, b) => new Date(b.time) - new Date(a.time))[0];

              // Update this line to correctly determine if employee is working
              const isWorking = latestEntry && latestEntry.type === 'in';

              // Calculate hours for today
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              
              const todayEntries = timeEntries.filter(entry => 
                entry.employeeId === employee.id &&
                new Date(entry.time) >= todayStart
              );

              // Calculate hours for current pay period
              const periodEntries = timeEntries.filter(entry => 
                entry.employeeId === employee.id &&
                entry.time >= currentPeriod.start &&
                entry.time <= currentPeriod.end
              );

              const todayHours = calculateTotalHours(todayEntries).total;
              const periodHours = calculateTotalHours(periodEntries).total;

              return (
                <div key={employee.id} className="border rounded-lg p-4">
                  <h4 className="font-bold">{employee.name}</h4>
                  <p className="text-gray-600">{employee.department}</p>
                  <p className="text-sm text-blue-600">Hours Today: {todayHours}</p>
                  <p className="text-sm text-purple-600">Hours This Period: {periodHours}</p>
                  <button
                    onClick={() => handleClockInOut(employee)}
                    className={`mt-2 w-full py-2 rounded ${
                      isWorking
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isWorking ? 'Clock Out' : 'Clock In'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Time Entries Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Time Entries</h3>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries
                    .sort((a, b) => new Date(b.time) - new Date(a.time))
                    .slice(0, 10)
                    .map(entry => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4">{entry.employeeName}</td>
                        <td className="px-6 py-4 capitalize">{entry.type}</td>
                        <td className="px-6 py-4">
                          {new Date(entry.time).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="p-6">
      <div className="max-w-md">
        <h3 className="text-lg font-semibold mb-4">Company Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  // Render the pay period header with navigation
  const renderPayPeriodHeader = () => (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigatePeriod(-1)}
          className="text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Current Pay Period</h3>
          <p className="text-blue-600">
            {formatDate(currentPeriod.start)} - {formatDate(currentPeriod.end)}
          </p>
        </div>
        <button
          onClick={() => navigatePeriod(1)}
          className="text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Add helper function to calculate total hours
  const calculateTotalHours = (entries) => {
    let totalMinutes = 0;
    let currentClockIn = null;

    entries.sort((a, b) => new Date(a.time) - new Date(b.time));

    entries.forEach(entry => {
      if (entry.type === 'in') {
        currentClockIn = new Date(entry.time);
      } else if (entry.type === 'out' && currentClockIn) {
        const clockOut = new Date(entry.time);
        totalMinutes += (clockOut - currentClockIn) / (1000 * 60);
        currentClockIn = null;
      }
    });

    const totalHours = totalMinutes / 60;
    const regularHours = Math.min(40, totalHours);
    const overtimeHours = Math.max(0, totalHours - 40);

    return {
      regular: regularHours.toFixed(2),
      overtime: overtimeHours.toFixed(2),
      total: totalHours.toFixed(2)
    };
  };

  // Helper function to get all dates in the pay period
  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">{companyName}</h2>
                <p className="text-gray-600">Admin Dashboard</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Logout
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mt-6">
              {['dashboard', 'reports', 'settings'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg flex-1 sm:flex-none ${
                    activeTab === tab 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default AdminView; 