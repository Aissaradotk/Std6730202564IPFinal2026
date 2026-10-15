/**
 * 1D K-Means Clustering Algorithm for Salary Analytics
 */

/**
 * Perform 1D K-Means clustering on employees based on their salary
 * @param {Array} employees - Array of employee objects { id, name, position, salary, status }
 * @param {number} requestedK - Desired number of clusters (default 3)
 * @returns {Object} { k, clusters, summary }
 */
function runSalaryKMeans(employees = [], requestedK = 3) {
  if (!Array.isArray(employees) || employees.length === 0) {
    return {
      k: 0,
      clusters: [],
      summary: {
        totalEmployees: 0,
        activeEmployees: 0,
        onLeaveEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
        medianSalary: 0,
        minSalary: 0,
        maxSalary: 0
      }
    };
  }

  // Extract valid salaries
  const validEmployees = employees.filter(
    (e) => typeof e.salary === "number" && !isNaN(e.salary) && e.salary > 0
  );

  const totalEmployees = validEmployees.length;
  if (totalEmployees === 0) {
    return {
      k: 0,
      clusters: [],
      summary: {
        totalEmployees: 0,
        activeEmployees: 0,
        onLeaveEmployees: 0,
        totalPayroll: 0,
        averageSalary: 0,
        medianSalary: 0,
        minSalary: 0,
        maxSalary: 0
      }
    };
  }

  const salaries = validEmployees.map((e) => e.salary).sort((a, b) => a - b);
  const uniqueSalaries = [...new Set(salaries)];
  const k = Math.min(requestedK, uniqueSalaries.length);

  // Initialize centroids spread across data quantiles
  let centroids = [];
  if (k === 1) {
    centroids = [salaries[Math.floor(salaries.length / 2)]];
  } else {
    for (let i = 0; i < k; i++) {
      const idx = Math.floor((i / (k - 1)) * (uniqueSalaries.length - 1));
      centroids.push(uniqueSalaries[idx]);
    }
  }

  let clusters = Array.from({ length: k }, () => []);
  const maxIterations = 100;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;
    clusters = Array.from({ length: k }, () => []);

    // 1. Assign each employee to nearest centroid
    for (const emp of validEmployees) {
      let minDistance = Infinity;
      let closestClusterIndex = 0;

      for (let c = 0; c < k; c++) {
        const distance = Math.abs(emp.salary - centroids[c]);
        if (distance < minDistance) {
          minDistance = distance;
          closestClusterIndex = c;
        }
      }
      clusters[closestClusterIndex].push(emp);
    }

    // 2. Recompute centroids
    let converged = true;
    const newCentroids = [];

    for (let c = 0; c < k; c++) {
      if (clusters[c].length === 0) {
        // If an empty cluster happens, keep previous centroid
        newCentroids.push(centroids[c]);
      } else {
        const clusterSum = clusters[c].reduce((sum, e) => sum + e.salary, 0);
        const mean = clusterSum / clusters[c].length;
        newCentroids.push(mean);
        if (Math.abs(mean - centroids[c]) > 0.001) {
          converged = false;
        }
      }
    }

    centroids = newCentroids;
    if (converged) break;
  }

  // Combine clusters with centroids and sort ascending by centroid
  const combined = centroids
    .map((centroid, index) => ({
      centroid: Math.round(centroid),
      employees: clusters[index]
    }))
    .filter((item) => item.employees.length > 0)
    .sort((a, b) => a.centroid - b.centroid);

  // Default labels for 3 tiers
  const tierLabels = [
    "Tier 1: Entry / Junior",
    "Tier 2: Mid-Level / Professional",
    "Tier 3: Senior / Executive"
  ];

  const formattedClusters = combined.map((clusterData, idx) => {
    const clusterSalaries = clusterData.employees.map((e) => e.salary);
    const minSalary = Math.min(...clusterSalaries);
    const maxSalary = Math.max(...clusterSalaries);
    const totalClusterSalary = clusterSalaries.reduce((sum, s) => sum + s, 0);
    const count = clusterData.employees.length;
    const percentage = Number(((count / totalEmployees) * 100).toFixed(1));

    let label = `Cluster ${idx + 1}`;
    if (combined.length === 3) {
      label = tierLabels[idx];
    } else if (combined.length === 2) {
      label = idx === 0 ? "Lower Tier" : "Upper Tier";
    }

    return {
      group: `Tier ${idx + 1}`,
      id: String(idx + 1),
      label,
      centroid: clusterData.centroid,
      minSalary,
      maxSalary,
      count,
      percentage,
      totalSalary: totalClusterSalary,
      averageSalary: Math.round(totalClusterSalary / count),
      employees: clusterData.employees.map((e) => ({
        id: e.id,
        name: e.name,
        position: e.position,
        salary: e.salary,
        status: e.status
      }))
    };
  });

  // Calculate Overall Summary
  const totalPayroll = salaries.reduce((sum, s) => sum + s, 0);
  const activeEmployees = validEmployees.filter((e) => e.status === "Active").length;
  const onLeaveEmployees = validEmployees.filter((e) => e.status === "On Leave").length;
  const averageSalary = Math.round(totalPayroll / totalEmployees);
  const midIndex = Math.floor(salaries.length / 2);
  const medianSalary =
    salaries.length % 2 === 0
      ? Math.round((salaries[midIndex - 1] + salaries[midIndex]) / 2)
      : salaries[midIndex];

  return {
    success: true,
    k: formattedClusters.length,
    iterations,
    clusters: formattedClusters,
    summary: {
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      totalPayroll,
      averageSalary,
      medianSalary,
      minSalary: salaries[0],
      maxSalary: salaries[salaries.length - 1]
    }
  };
}

module.exports = {
  runSalaryKMeans
};
