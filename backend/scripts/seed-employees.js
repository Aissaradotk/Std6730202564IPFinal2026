const { pool, testConnection } = require("../config/database");

async function seedEmployees() {
  const connected = await testConnection();
  if (!connected) {
    console.error("Cannot seed employees: MySQL connection failed.");
    process.exit(1);
  }

  const sampleEmployees = [
    ["John Doe", "Software Engineer", "Active", 45000],
    ["Jane Smith", "Senior UI/UX Designer", "Active", 65000],
    ["Somchai Jaidee", "Junior Developer", "Active", 28000],
    ["Bob Johnson", "DevOps Engineer", "On Leave", 82000],
    ["Alice Williams", "Data Scientist", "Active", 95000],
    ["Charlie Brown", "QA Automation Engineer", "Active", 42000],
    ["David Miller", "Engineering Director", "Active", 160000]
  ];

  try {
    for (const [name, position, status, salary] of sampleEmployees) {
      await pool.query(
        "INSERT INTO `AisKhun_employees` (name, position, status, salary) VALUES (?, ?, ?, ?)",
        [name, position, status, salary]
      );
    }
    console.log(`Successfully seeded ${sampleEmployees.length} employees into 'AisKhun_employees'.`);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding employees:", err.message);
    process.exit(1);
  }
}

seedEmployees();
