import React from 'react';
import { getDailyHours } from '../../utils/timeUtils';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

const EmployeeView = ({ currentUser, timeEntries, setTimeEntries, onLogout, companyName }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayHours = getDailyHours(timeEntries, currentUser.id, today);
  const isCurrentlyWorking = timeEntries
    .filter(entry => entry.employeeId === currentUser.id)
    .slice(-1)[0]?.type === 'in';

  const handleClockInOut = async () => {
    try {
      const now = new Date();
      // Ensure the date is in the local timezone
      const entry = {
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        department: currentUser.department,
        time: now.toISOString(), // Store in ISO format
        type: isCurrentlyWorking ? 'out' : 'in',
        category: 'REG'
      };

      // Add to Firebase
      const docRef = await addDoc(collection(db, 'timeEntries'), entry);
      
      // Update local state with the new entry
      setTimeEntries(prev => [...prev, { ...entry, id: docRef.id }]);
      
      console.log(`Clock ${entry.type} recorded at ${now.toLocaleString()}`);
    } catch (error) {
      console.error('Error recording time:', error);
      alert('Error recording time. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-gray-600">Welcome, {currentUser.name}</p>
              <p className="text-sm text-blue-600">Hours Today: {todayHours}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>

          <button
            onClick={handleClockInOut}
            className={`w-full py-4 rounded-lg text-xl font-bold ${
              isCurrentlyWorking 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            Clock {isCurrentlyWorking ? 'Out' : 'In'}
          </button>

          <div className="mt-6">
            <h3 className="font-bold mb-2">Today's Time Card</h3>
            <div className="border rounded divide-y">
              {timeEntries
                .filter(entry => 
                  entry.employeeId === currentUser.id && 
                  entry.time.startsWith(today)
                )
                .map(entry => (
                  <div key={entry.id} className="p-2 flex justify-between">
                    <span>{entry.type === 'in' ? 'Clock In' : 'Clock Out'}</span>
                    <span>{new Date(entry.time).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView; 