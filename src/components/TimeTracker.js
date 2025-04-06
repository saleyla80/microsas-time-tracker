import React, { useState } from 'react';
import LoginView from './views/LoginView';
import EmployeeView from './views/EmployeeView';
import AdminView from './views/AdminView';

const TimeTracker = () => {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Jeanette Basurto', pin: '1234', department: 'OFFICE STAFF' },
    { id: 2, name: 'Joanna Garcia', pin: '2345', department: 'OFFICE STAFF' },
    { id: 3, name: 'Margarita Nyagolova', pin: '3456', department: 'OFFICE STAFF' }
  ]);
  
  const [timeEntries, setTimeEntries] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState('login');
  const [companyName, setCompanyName] = useState('Saleyla, LLC');

  const handleLogin = (pin) => {
    if (pin === 'admin') {
      setIsAdmin(true);
      setCurrentUser({ id: 0, name: 'Admin' });
      setView('admin');
      return true;
    }
    
    const employee = employees.find(emp => emp.pin === pin);
    if (employee) {
      setCurrentUser(employee);
      setIsAdmin(false);
      setView('employee');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {view === 'login' && (
        <LoginView onLogin={handleLogin} companyName={companyName} />
      )}
      {view === 'employee' && currentUser && (
        <EmployeeView
          currentUser={currentUser}
          timeEntries={timeEntries}
          setTimeEntries={setTimeEntries}
          onLogout={handleLogout}
          companyName={companyName}
        />
      )}
      {view === 'admin' && isAdmin && (
        <AdminView
          employees={employees}
          setEmployees={setEmployees}
          timeEntries={timeEntries}
          setTimeEntries={setTimeEntries}
          onLogout={handleLogout}
          companyName={companyName}
          setCompanyName={setCompanyName}
        />
      )}
    </div>
  );
};

export default TimeTracker;
