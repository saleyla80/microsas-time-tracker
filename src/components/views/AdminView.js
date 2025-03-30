import React, { useState, useEffect } from 'react';
import { getDailyHours } from '../../utils/timeUtils';

const INITIAL_PAY_PERIOD_START = '2025-03-26'; // Wednesday, March 26, 2025
const PAY_PERIOD_LENGTH = 14; // days

const getPayPeriodEndDate = (startDate) => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + PAY_PERIOD_LENGTH - 1);
  return end.toISOString().split('T')[0];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
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

  // Handle clock in/out for employees from admin panel
  const handleClockInOut = (employee) => {
    const now = new Date();
    const lastEntry = [...timeEntries]
      .filter(entry => entry.employeeId === employee.id)
      .sort((a, b) => new Date(b.time) - new Date(a.time))[0];
    
    const entryType = lastEntry?.type === 'in' ? 'out' : 'in';
    
    const newEntry = {
      id: Date.now(),
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      time: now.toISOString(),
      type: entryType,
      category: 'REG'
    };
    
    setTimeEntries([...timeEntries, newEntry]);
  };

  const renderReports = () => {
    // Group employees by department
    const departmentGroups = employees.reduce((groups, emp) => {
      if (!groups[emp.department]) groups[emp.department] = [];
      groups[emp.department].push(emp);
      return groups;
    }, {});

    const calculateHoursByCategory = (employeeId, category) => {
      const entries = timeEntries.filter(entry => 
        entry.employeeId === employeeId && 
        entry.category === category &&
        entry.time >= currentPeriod.start &&
        entry.time <= currentPeriod.end
      );
      return getDailyHours(entries, employeeId, currentPeriod.start, currentPeriod.end);
    };

    const calculateGrandTotal = (category) => {
      let totalMinutes = 0;
      employees.forEach(emp => {
        const hours = calculateHoursByCategory(emp.id, category);
        const [h, m] = hours.split(':').map(Number);
        totalMinutes += h * 60 + m;
      });
      return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
    };

    return (
      <div className="p-2 sm:p-6 print:p-2">
        {/* Report Header */}
        <div className="mb-8 text-left">
          <div className="bg-[#0088cc] text-white p-3 sm:p-6 mb-4">
            <h2 className="text-center text-lg sm:text-xl">Employee Management System</h2>
          </div>
          <h1 className="text-2xl text-[#0088cc] mb-2">Pay Period Report: {companyName}</h1>
          <p className="text-[#0088cc]">Departments: {Object.keys(departmentGroups).join(', ')}</p>
          <p className="text-[#0088cc]">
            Pay Period: {formatDate(currentPeriod.start).replace(/\//g, '/')} - {formatDate(currentPeriod.end).replace(/\//g, '/')}
          </p>
          <div className="text-right">
            <h2 className="text-xl font-bold">Total Hours</h2>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse">
              {/* Column Headers */}
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border p-2 text-left w-1/4">EMPLOYEE</th>
                  <th className="border p-2 text-center">REG</th>
                  <th className="border p-2 text-center">OT1</th>
                  <th className="border p-2 text-center">OT2</th>
                  <th className="border p-2 text-center">VAC</th>
                  <th className="border p-2 text-center">HOL</th>
                  <th className="border p-2 text-center">SIC</th>
                  <th className="border p-2 text-center">OTH</th>
                  <th className="border p-2 text-center">TOTAL</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(departmentGroups).map(([department, deptEmployees]) => (
                  <React.Fragment key={department}>
                    {/* Department Header */}
                    <tr className="bg-gray-200">
                      <td colSpan="9" className="border p-2 font-bold">{department}</td>
                    </tr>
                    
                    {/* Employee Rows */}
                    {deptEmployees.map((employee, index) => {
                      const categories = ['REG', 'OT1', 'OT2', 'VAC', 'HOL', 'SIC', 'OTH'];
                      const hours = categories.map(cat => calculateHoursByCategory(employee.id, cat));
                      const totalMinutes = hours.reduce((sum, time) => {
                        const [h, m] = time.split(':').map(Number);
                        return sum + (h * 60 + m);
                      }, 0);
                      const totalHours = `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

                      return (
                        <tr key={employee.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border p-2">
                            <span className="mr-2">{index + 1}</span>
                            {employee.name}
                          </td>
                          {hours.map((hour, i) => (
                            <td key={i} className="border p-2 text-center">{hour}</td>
                          ))}
                          <td className="border p-2 text-center font-bold">{totalHours}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>

              {/* Grand Total Row */}
              <tfoot>
                <tr className="bg-gray-700 text-white">
                  <td className="border p-2 font-bold">Grand Total:</td>
                  {['REG', 'OT1', 'OT2', 'VAC', 'HOL', 'SIC', 'OTH'].map(category => (
                    <td key={category} className="border p-2 text-center">
                      {calculateGrandTotal(category)}
                    </td>
                  ))}
                  <td className="border p-2 text-center font-bold">
                    {calculateGrandTotal('TOTAL')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Report Controls */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 print:hidden">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigatePeriod(-1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex space-x-2">
              <input
                type="date"
                value={currentPeriod.start}
                onChange={(e) => setCurrentPeriod({ ...currentPeriod, start: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <span className="py-2">-</span>
              <input
                type="date"
                value={currentPeriod.end}
                onChange={(e) => setCurrentPeriod({ ...currentPeriod, end: e.target.value })}
                className="border rounded px-3 py-2"
              />
            </div>

            <button
              onClick={() => navigatePeriod(1)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Print Report
          </button>
        </div>
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
              const isWorking = timeEntries
                .filter(entry => entry.employeeId === employee.id)
                .slice(-1)[0]?.type === 'in';
              const todayHours = getDailyHours(timeEntries, employee.id, today);
              const periodHours = getDailyHours(
                timeEntries.filter(entry => 
                  entry.time >= currentPeriod.start && 
                  entry.time <= currentPeriod.end
                ),
                employee.id,
                currentPeriod.start,
                currentPeriod.end
              );

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
                    Clock {isWorking ? 'Out' : 'In'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
                  {timeEntries.slice(-10).map(entry => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4">{entry.employeeName}</td>
                      <td className="px-6 py-4">{entry.type}</td>
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