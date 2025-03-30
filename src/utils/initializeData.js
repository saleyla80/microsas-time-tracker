export const initializeData = () => {
  // Check if data is already initialized
  if (!localStorage.getItem('initialized')) {
    // Sample employees
    const employees = [
      {
        id: 1,
        name: 'Admin User',
        pin: '1234',
        isAdmin: true,
      },
      {
        id: 2,
        name: 'John Doe',
        pin: '2222',
        isAdmin: false,
      },
      {
        id: 3,
        name: 'Jane Smith',
        pin: '3333',
        isAdmin: false,
      }
    ];

    // Initialize time categories
    const timeCategories = [
      { id: 1, name: 'Regular Hours', code: 'REG' },
      { id: 2, name: 'Overtime', code: 'OT' },
      { id: 3, name: 'Vacation', code: 'VAC' },
      { id: 4, name: 'Sick Leave', code: 'SICK' }
    ];

    // Store in localStorage
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('timeCategories', JSON.stringify(timeCategories));
    localStorage.setItem('timeEntries', JSON.stringify([]));
    localStorage.setItem('initialized', 'true');
  }
}; 