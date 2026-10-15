# HR Manager & Salary Analytics Frontend (React Native + Expo)

**Project Name:** Std6730202564IPFinal2026  
**Exam Topic:** HR Manager & Salary Analytics System  
**Framework:** React Native + Expo  
**Architecture:** Component-driven, Screen-based REST API Client

---

## 📱 Features

1. **Authentication:**
   - Modern Admin Login screen.
   - Admin credentials are configured in the backend environment.
   - Dynamic API base URL configuration for seamless testing across Web (`localhost:3000`), Android Emulator (`10.0.2.2:3000`), and physical devices.

2. **Employee Management:**
   - View all employees with details (Name, Position, Salary, Status).
   - Real-time search by employee name or job title.
   - Status filtering (`All`, `Active`, `On Leave`).
   - In-app modal to add new employees with client-side & server-side validation.
   - Status toggling (`Active` ↔ `On Leave`) with instant UI update.
   - Delete employee with confirmation dialog.

3. **Salary Analytics & K-Means Clustering:**
   - 1D K-Means Clustering into 3 distinct salary tiers (Entry / Junior, Mid-Level, Senior / Executive).
   - Centroid calculation, salary ranges, employee count, and percentage progress bars.
   - Expandable employee list within each cluster tier.
   - Summary statistics: Total Payroll, Mean Salary, Median Salary, and Salary Range.

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Expo Development Server
```bash
# Start Expo interactive CLI
npm start

# Or directly target Web
npm run web

# Or target Android Emulator
npm run android

# Or target iOS Simulator
npm run ios
```

---

## 📂 Component Structure

- **`App.js`**: Application root managing authentication state and screen switching.
- **`src/api/api.js`**: REST client connecting to backend endpoints (`/api/login`, `/api/employees`, `/api/analytics/salary-clusters`).
- **`src/screens/LoginScreen.js`**: Polished administrative login portal.
- **`src/screens/DashboardScreen.js`**: Core workspace containing KPI stats, Employee Management, and Salary Analytics tabs.
- **`src/components/EmployeeCard.js`**: Card displaying individual employee information, status toggle, and delete action.
- **`src/components/SalaryClusterCard.js`**: Card visualizing K-Means clusters with centroid, range, progress bar, and member list.
