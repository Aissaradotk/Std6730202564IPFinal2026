// In-memory JavaScript array for storing employee records

let employees = [
  {
    id: "1",
    name: "John Doe",
    position: "Software Engineer",
    status: "Active",
    salary: 45000
  },
  {
    id: "2",
    name: "Jane Smith",
    position: "Senior Developer",
    status: "Active",
    salary: 85000
  },
  {
    id: "3",
    name: "Alice Johnson",
    position: "Junior Designer",
    status: "On Leave",
    salary: 25000
  },
  {
    id: "4",
    name: "Bob Brown",
    position: "HR Manager",
    status: "Active",
    salary: 50000
  },
  {
    id: "5",
    name: "Charlie Davis",
    position: "Intern",
    status: "Active",
    salary: 18000
  }
];

// Helper to generate next unique string ID
let nextId = 6;

const getAllEmployees = () => {
  return employees;
};

const getEmployeeById = (id) => {
  return employees.find((emp) => emp.id === String(id));
};

const addEmployee = ({ name, position, salary }) => {
  const newEmployee = {
    id: String(nextId++),
    name: String(name).trim(),
    position: String(position).trim(),
    status: "Active",
    salary: Number(salary)
  };
  employees.push(newEmployee);
  return newEmployee;
};

const toggleEmployeeStatus = (id) => {
  const employee = getEmployeeById(id);
  if (!employee) return null;

  employee.status = employee.status === "Active" ? "On Leave" : "Active";
  return employee;
};

const deleteEmployee = (id) => {
  const index = employees.findIndex((emp) => emp.id === String(id));
  if (index === -1) return false;

  employees.splice(index, 1);
  return true;
};

// Reset function (primarily for testing/dev if needed)
const resetEmployees = () => {
  // Not called during normal requests
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  resetEmployees
};
