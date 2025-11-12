import React, { useEffect, useState, useRef } from "react";
import {
  FiUsers,
  FiPackage,
  FiTool,
  FiDollarSign,
  FiFileText,
  FiCheckCircle,
  FiActivity,
  FiClock,
  FiUserPlus,
  FiClipboard,
  FiHome,
  FiRefreshCw,
} from "react-icons/fi";
import {
  Package as PackageIcon,
  Wrench,
  Activity as ActivityIcon,
  Clock as LucideClock,
  DollarSign,
  CheckCircle as CheckCircleIcon,
  AlertCircle,
  TrendingUp,
  Users as UsersIcon,
  IndianRupee,
} from "lucide-react";
import SummaryApi from "../common";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import MarkUpdateForm from "../components/MarkUpdateForm";
import CustomerDetailModal from "./leads/CustomerDetailModal";
import DealerDetailModal from "./leads/DealerDetailModal";
import DistributorDetailModal from "./leads/DistributorDetailModal";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicianStats, setTechnicianStats] = useState([]);
  const [branchStats, setBranchStats] = useState([]);
  const [managerSummary, setManagerSummary] = useState(null);
  const [balanceOverview, setBalanceOverview] = useState({ accounts: [], summary: {} });
  const [showModal, setShowModal] = useState(false);

  // Detail modal states
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showDealerDetailModal, setShowDealerDetailModal] = useState(false);
  const [showDistributorDetailModal, setShowDistributorDetailModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedDealerId, setSelectedDealerId] = useState(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState(null);

  // Polling refs
  const dataSignatureRef = useRef('');
  const pollingIntervalRef = useRef(null);
  const POLLING_INTERVAL_MS = 30000; // 30 seconds

  // Stats state with initial values
  const [stats, setStats] = useState({
    branches: 0,
    staff: 0,
    leads: 0,
    customers: 0,
    technicians: 0,
    inventory: 0,
    workOrders: 0,
    assignedProjects: 0,
    pendingApprovals: 0,
    completedProjects: 0,
  });

  // Customer summary data
  const [customerSummary, setCustomerSummary] = useState({
    total: 0,
    active: 0,
    pending: 0,
  });

  // Admin financial snapshot - across all branches
  const [adminFinancialSnapshot, setAdminFinancialSnapshot] = useState({
    totalBilledAmount: 0,
    amountCollected: 0,
    outstandingAmount: 0,
    totalExpenses: 0,
    totalBills: 0,
    netProfit: 0,
    collectionRate: 0,
    profitMargin: 0,
    averageCollectionTime: 0,
  });

  // Branch Balance Overview - Admin only
  const [branchBalanceOverview, setBranchBalanceOverview] = useState({
    branches: [],
    summary: {
      totalAmount: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      totalExpenses: 0,
    },
  });
  const [refreshingBranchBalance, setRefreshingBranchBalance] = useState(false);

  // Last refresh time tracking
  const [lastRefreshTime, setLastRefreshTime] = useState({
    branches: 0,
    staff: 0,
    leads: 0,
    customers: 0,
    inventory: 0,
    workOrders: 0,
    projects: 0,
    branchBalance: 0,
  });

  // Other dashboard data
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryStatus, setInventoryStatus] = useState([]);

  // Cache staleness time - 15 minutes
  const CACHE_STALENESS_TIME = 15 * 60 * 1000;

  // Build a signature from dashboard data to detect changes
  const buildDataSignature = (dashboardData) => {
    if (!dashboardData) return '';

    const parts = [
      dashboardData.stats?.assignedProjects || 0,
      dashboardData.stats?.pendingApprovals || 0,
      dashboardData.stats?.completedProjects || 0,
      dashboardData.stats?.workOrders || 0,
      dashboardData.stats?.inventory || 0,
      dashboardData.stats?.customers || 0,
      dashboardData.stats?.leads || 0,
    ];

    return parts.join('-');
  };

  // Main function to fetch dashboard data with caching
  const fetchDashboardData = async (forceFresh = false) => {
    try {
      setError(null);

      // Check for cached data
      const cachedDashboardData = localStorage.getItem("dashboardData");

      // Use cached data if available and not forcing fresh data
      if (!forceFresh && cachedDashboardData) {
        const parsedData = JSON.parse(cachedDashboardData);

        // Set all the states from cache
        setStats(parsedData.stats || {});
        setCustomerSummary(parsedData.customerSummary || {});
        setBranchStats(parsedData.branchStats || []);
        setManagerSummary(parsedData.managerSummary || null);
        setTechnicianStats(parsedData.technicianStats || []);

        // Fetch fresh data in background without updating loading state
        fetchFreshDashboardDataInBackground();

        setLoading(false);
        return;
      }

      // If no valid cache or force fresh, fetch new data
      await fetchFreshDashboardData();
    } catch (err) {
      // Try to use cached data as fallback if API fails
      const cachedDashboardData = localStorage.getItem("dashboardData");
      if (cachedDashboardData) {
        const parsedData = JSON.parse(cachedDashboardData);
        setStats(parsedData.stats || {});
        setCustomerSummary(parsedData.customerSummary || {});
        setBranchStats(parsedData.branchStats || []);
        setManagerSummary(parsedData.managerSummary || null);
        setTechnicianStats(parsedData.technicianStats || []);
        console.log("Using cached dashboard data after fetch error");
      } else {
        console.error("Error fetching dashboard data:", err);
        setError("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch fresh dashboard data in background
  const fetchFreshDashboardDataInBackground = async () => {
    try {
      // Perform all API calls but don't update loading state
      await fetchFreshDashboardData(true); // true means this is a background fetch
    } catch (err) {
      console.error("Error fetching dashboard data in background:", err);
    }
  };

  // Function to fetch fresh dashboard data directly from API
  const fetchFreshDashboardData = async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }

    try {
      // For admin, fetch all branches first
      let allBranches = [];
      if (user.role === "admin") {
        try {
          const branchResponse = await fetch(SummaryApi.getBranches.url, {
            method: SummaryApi.getBranches.method,
            credentials: "include",
          });

          const branchData = await branchResponse.json();
          if (branchData.success) {
            allBranches = branchData.data || [];
            // console.log("Fetched branches:", allBranches);
          }
        } catch (err) {
          console.error("Error fetching branches:", err);
        }
      }

      // Include branch parameter if admin has selected a branch
      let branchParam = "";
      if (user.role === "admin" && user.selectedBranch) {
        branchParam = `?branch=${user.selectedBranch}`;
      }

      // Fetch data in parallel to improve performance
      const [
        leadsResponse,
        customersResponse,
        inventoryResponse,
        workOrdersResponse,
        projectsResponse,
      ] = await Promise.all([
        // 1. Fetch leads data
        fetch(`${SummaryApi.getAllLeads.url}${branchParam}`, {
          method: SummaryApi.getAllLeads.method,
          credentials: "include",
        }),

        // 2. Fetch customers data
        fetch(`${SummaryApi.getAllCustomers.url}${branchParam}`, {
          method: SummaryApi.getAllCustomers.method,
          credentials: "include",
        }),

        // 3. Fetch inventory data (combining serialized and generic)
        Promise.all([
          fetch(`${SummaryApi.getInventoryByType.url}/serialized-product`, {
            method: SummaryApi.getInventoryByType.method,
            credentials: "include",
          }),
          fetch(`${SummaryApi.getInventoryByType.url}/generic-product`, {
            method: SummaryApi.getInventoryByType.method,
            credentials: "include",
          }),
        ]),

        // 4. Fetch work orders
        fetch(`${SummaryApi.getWorkOrders.url}${branchParam}`, {
          method: SummaryApi.getWorkOrders.method,
          credentials: "include",
        }),

        // 5. Fetch all projects
        fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      // Parse all responses
      const leadsData = await leadsResponse.json();
      const customersData = await customersResponse.json();

      // Parse inventory responses
      const [serializedResponse, genericResponse] = inventoryResponse;
      const serializedData = await serializedResponse.json();
      const genericData = await genericResponse.json();

      const workOrdersData = await workOrdersResponse.json();
      const projectsData = await projectsResponse.json();

      // Initialize variables for stats
      let branchesCount = 0;
      let totalStaff = 0;
      let inventoryTotal = 0;
      let customersCount = 0;
      let pendingWorkOrdersCount = 0;
      let assignedCount = 0;
      let pendingApprovalCount = 0;
      let completedCount = 0;
      let leadsCount = 0;
      let techniciansCount = 0;
      let branchStatsArray = [];
      let technicians = [];
      let managerFinancialSummaryData = null;

      // Calculate counts for admin dashboard
      if (user.role === "admin") {
        // Count branches
        branchesCount = allBranches.length;

        // For admin, we need to separately fetch managers and technicians
        try {
          // Fetch managers
          const managersResponse = await fetch(SummaryApi.getManagerUsers.url, {
            method: SummaryApi.getManagerUsers.method,
            credentials: "include",
          });

          // Fetch technicians
          const techniciansResponse = await fetch(
            SummaryApi.getTechnicianUsers.url,
            {
              method: SummaryApi.getTechnicianUsers.method,
              credentials: "include",
            }
          );

          const managersData = await managersResponse.json();
          const techniciansData = await techniciansResponse.json();

          // Calculate total active staff
          let managersCount = 0;

          if (managersData.success) {
            managersCount = managersData.data.filter(
              (m) => m.status === "active"
            ).length;
          }

          if (techniciansData.success) {
            techniciansCount = techniciansData.data.filter(
              (t) => t.status === "active"
            ).length;
          }

          totalStaff = techniciansCount;
        } catch (err) {
          console.error("Error fetching staff data:", err);
        }

        // Fetch admin financial summary (across all branches)
        try {
          const adminFinancialResponse = await fetch(
            SummaryApi.getAdminFinancialSummary.url,
            {
              method: SummaryApi.getAdminFinancialSummary.method,
              credentials: "include",
            }
          );
          const adminFinancialData = await adminFinancialResponse.json();
          if (adminFinancialData.success) {
            const financialSnapshot = {
              totalBilledAmount: adminFinancialData.data.totalBilledAmount || 0,
              amountCollected: adminFinancialData.data.amountCollected || 0,
              outstandingAmount: adminFinancialData.data.outstandingAmount || 0,
              totalExpenses: adminFinancialData.data.totalExpenses || 0,
              totalBills: adminFinancialData.data.totalBills || 0,
              netProfit: adminFinancialData.data.netProfit || 0,
              collectionRate: adminFinancialData.data.collectionRate || 0,
              profitMargin: adminFinancialData.data.profitMargin || 0,
              averageCollectionTime: adminFinancialData.data.averageCollectionTime || 0,
            };
            setAdminFinancialSnapshot(financialSnapshot);
            // Cache in localStorage
            localStorage.setItem('adminFinancialSnapshot', JSON.stringify(financialSnapshot));
          }
        } catch (err) {
          console.error("Error fetching admin financial summary:", err);
          // Keep cached data if fetch fails
          const cachedFinancialSnapshot = localStorage.getItem('adminFinancialSnapshot');
          if (cachedFinancialSnapshot) {
            try {
              setAdminFinancialSnapshot(JSON.parse(cachedFinancialSnapshot));
            } catch (parseError) {
              console.error("Error parsing cached financial snapshot:", parseError);
            }
          }
        }

        // Fetch branch balance overview (branch-wise financial data)
        try {
          const branchBalanceResponse = await fetch(
            SummaryApi.getBranchBalanceOverview.url,
            {
              method: SummaryApi.getBranchBalanceOverview.method,
              credentials: "include",
            }
          );
          const branchBalanceData = await branchBalanceResponse.json();
          if (branchBalanceData.success) {
            setBranchBalanceOverview(branchBalanceData.data);
            // Cache in localStorage
            localStorage.setItem('adminBranchBalanceOverview', JSON.stringify(branchBalanceData.data));
          }
        } catch (err) {
          console.error("Error fetching branch balance overview:", err);
          // Keep cached data if fetch fails
          const cachedBranchBalance = localStorage.getItem('adminBranchBalanceOverview');
          if (cachedBranchBalance) {
            try {
              setBranchBalanceOverview(JSON.parse(cachedBranchBalance));
            } catch (parseError) {
              console.error("Error parsing cached branch balance:", parseError);
            }
          }
        }

        // Calculate inventory total as total number of serialized and generic items (not stock)
        if (serializedData.success) {
          inventoryTotal += serializedData.items.length;
        }

        if (genericData.success) {
          inventoryTotal += genericData.items.length;
        }

        // Calculate customer count
        customersCount = customersData.success ? customersData.data.length : 0;

        // Calculate pending work orders count
        pendingWorkOrdersCount = workOrdersData.success
          ? workOrdersData.data.filter(
              (order) =>
                order.status === "pending" || order.status === "Pending"
            ).length
          : 0;

        // Calculate project counts
        if (projectsData.success) {
          const validProjects = projectsData.data.filter((project) => {
            return (
              project.technician &&
              (project.technician.firstName ||
                project.technician.lastName ||
                (typeof project.technician === "string" &&
                  project.technician.length > 0))
            );
          });

          assignedCount = validProjects.filter((project) =>
            ["assigned", "in-progress", "paused"].includes(project.status)
          ).length;

          pendingApprovalCount = validProjects.filter(
            (project) => project.status === "pending-approval"
          ).length;

          completedCount = validProjects.filter(
            (project) => project.status === "completed"
          ).length;
        }

        // Set admin stats
        const adminStats = {
          branches: branchesCount,
          staff: totalStaff,
          leads: leadsData.success ? leadsData.data.length : 0,
          customers: customersCount,
          inventory: inventoryTotal,
          workOrders: pendingWorkOrdersCount,
          assignedProjects: assignedCount,
          pendingApprovals: pendingApprovalCount,
          completedProjects: completedCount,
        };

        setStats(adminStats);
        setManagerSummary(null);

        // Process branch stats for admin overview table
        if (projectsData.success) {
          // Create a branch stats map to track project counts by branch
          const branchStatsMap = {};

          // Initialize the map with zero counts for each branch
          allBranches.forEach((branch) => {
            branchStatsMap[branch._id] = {
              id: branch._id,
              name: branch.name,
              assigned: 0,
              inProgress: 0,
              pendingApproval: 0,
              completed: 0,
              transferring: 0,
              transferred: 0,
            };
          });

          // console.log("Projects data:", projectsData.data.length);

          // Loop through all projects and count them by branch and status
          projectsData.data.forEach((project) => {
            // Get the branch ID from the project
            const branchId = project.branch && project.branch._id;

            if (branchId && branchStatsMap[branchId]) {
              // console.log(`Found project for branch ${branchId}, status: ${project.status}`);

              // Update the appropriate counter based on project status
              if (project.status === "assigned") {
                branchStatsMap[branchId].assigned++;
              } else if (project.status === "in-progress") {
                branchStatsMap[branchId].inProgress++;
              } else if (project.status === "pending-approval") {
                branchStatsMap[branchId].pendingApproval++;
              } else if (project.status === "completed") {
                branchStatsMap[branchId].completed++;
              } else if (project.status === "transferring") {
                branchStatsMap[branchId].transferring++;
              } else if (project.status === "transferred") {
                branchStatsMap[branchId].transferred++;
              }
            } else {
              console.log(
                `Project with missing or invalid branch ID: ${JSON.stringify(
                  project.branch
                )}`
              );
            }
          });

          // Convert the map to an array for rendering
          branchStatsArray = Object.values(branchStatsMap);
          // console.log("Branch stats array:", branchStatsArray);
          setBranchStats(branchStatsArray);
        }
      } else {
        // Manager dashboard stats calculation
        // Fetch technicians for manager's branch
        const techniciansResponse = await fetch(
          SummaryApi.getManagerTechnician.url,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const techniciansData = await techniciansResponse.json();
        techniciansCount = techniciansData.success
          ? techniciansData.data.length
          : 0;

        try {
          const summaryResponse = await fetch(
            SummaryApi.getManagerFinancialSummary.url,
            {
              method: SummaryApi.getManagerFinancialSummary.method,
              credentials: "include",
            }
          );
          const summaryData = await summaryResponse.json();
          if (summaryData.success) {
            managerFinancialSummaryData = summaryData.data;
            setManagerSummary(summaryData.data);
          } else {
            managerFinancialSummaryData = null;
            setManagerSummary(null);
          }
        } catch (summaryError) {
          console.error(
            "Error fetching manager financial summary:",
            summaryError
          );
          managerFinancialSummaryData = null;
          setManagerSummary(null);
        }

        // Fetch Balance Overview (cached data already loaded in useEffect)
        try {
          // Fetch fresh data in background
          const balanceResponse = await fetch(
            SummaryApi.getManagerBalanceOverview.url,
            {
              method: SummaryApi.getManagerBalanceOverview.method,
              credentials: "include",
            }
          );
          const balanceData = await balanceResponse.json();
          if (balanceData.success) {
            setBalanceOverview(balanceData.data);
            // Cache in localStorage
            localStorage.setItem('managerBalanceOverview', JSON.stringify(balanceData.data));
          } else {
            setBalanceOverview({ accounts: [], summary: {} });
          }
        } catch (balanceError) {
          console.error("Error fetching balance overview:", balanceError);
          // Keep cached data if fetch fails
          const cachedBalanceOverview = localStorage.getItem('managerBalanceOverview');
          if (cachedBalanceOverview) {
            try {
              setBalanceOverview(JSON.parse(cachedBalanceOverview));
            } catch {
              setBalanceOverview({ accounts: [], summary: {} });
            }
          } else {
            setBalanceOverview({ accounts: [], summary: {} });
          }
        }

        leadsCount = leadsData.success ? leadsData.data.length : 0;
        customersCount = customersData.success ? customersData.data.length : 0;

        // Calculate inventory total
        if (serializedData.success) {
          serializedData.items.forEach((item) => {
            if (item.stock) {
              inventoryTotal += item.stock.length;
            }
          });
        }

        if (genericData.success) {
          genericData.items.forEach((item) => {
            if (item.stock) {
              item.stock.forEach((stock) => {
                inventoryTotal += parseInt(stock.quantity || 0, 10);
              });
            }
          });
        }

        // Calculate work orders count
        pendingWorkOrdersCount = workOrdersData.success
          ? workOrdersData.data.filter(
              (order) =>
                order.status === "pending" || order.status === "Pending"
            ).length
          : 0;

        // Calculate project counts for manager
        if (projectsData.success) {
          // Only count projects that have technicians assigned
          const validProjects = projectsData.data.filter((project) => {
            return (
              project.technician &&
              (project.technician.firstName ||
                project.technician.lastName ||
                (typeof project.technician === "string" &&
                  project.technician.length > 0))
            );
          });

          assignedCount = validProjects.filter((project) =>
            ["assigned", "in-progress", "paused"].includes(project.status)
          ).length;

          pendingApprovalCount = validProjects.filter(
            (project) => project.status === "pending-approval"
          ).length;

          completedCount = validProjects.filter(
            (project) => project.status === "completed"
          ).length;
        }

        // Set manager stats
        const managerStats = {
          leads: leadsCount,
          customers: customersCount,
          technicians: techniciansCount,
          inventory: inventoryTotal,
          workOrders: pendingWorkOrdersCount,
          assignedProjects: assignedCount,
          pendingApprovals: pendingApprovalCount,
          completedProjects: completedCount,
        };

        setStats(managerStats);

        // Calculate technician stats for manager view
        if (techniciansData.success && projectsData.success) {
          // Map technicians to get their names
          technicians = techniciansData.data.map((tech) => ({
            id: tech._id,
            name: `${tech.firstName} ${tech.lastName}`,
            assigned: 0,
            inProgress: 0,
            pendingApproval: 0,
            completed: 0,
            transferring: 0,
            transferred: 0,
          }));

          // Count projects for each technician
          projectsData.data.forEach((project) => {
            if (project.technician && project.technician._id) {
              const techIndex = technicians.findIndex(
                (t) => t.id === project.technician._id
              );
              if (techIndex !== -1) {
                // Update counters based on project status
                if (project.status === "assigned") {
                  technicians[techIndex].assigned++;
                } else if (project.status === "in-progress") {
                  technicians[techIndex].inProgress++;
                } else if (project.status === "pending-approval") {
                  technicians[techIndex].pendingApproval++;
                } else if (project.status === "completed") {
                  technicians[techIndex].completed++;
                } else if (project.status === "transferring") {
                  technicians[techIndex].transferring++;
                } else if (project.status === "transferred") {
                  technicians[techIndex].transferred++;
                }
              }
            }
          });

          setTechnicianStats(technicians);
        }
      }

      // Set customer summary data
      const customerSummaryData = {
        total: customersCount,
        active: customersCount,
        pending: 0,
      };

      setCustomerSummary(customerSummaryData);

      // Update refresh times
      setLastRefreshTime({
        branches: new Date().getTime(),
        leads: new Date().getTime(),
        customers: new Date().getTime(),
        inventory: new Date().getTime(),
        workOrders: new Date().getTime(),
        projects: new Date().getTime(),
      });

      // Cache the dashboard data
      const dashboardDataToCache = {
        stats:
          user.role === "admin"
            ? {
                branches: branchesCount,
                staff: totalStaff,
                leads: leadsData.success ? leadsData.data.length : 0,
                customers: customersCount,
                inventory: inventoryTotal,
                workOrders: pendingWorkOrdersCount,
                assignedProjects: assignedCount,
                pendingApprovals: pendingApprovalCount,
                completedProjects: completedCount,
              }
            : {
                leads: leadsCount,
                customers: customersCount,
                technicians: techniciansCount,
                inventory: inventoryTotal,
                workOrders: pendingWorkOrdersCount,
                assignedProjects: assignedCount,
                pendingApprovals: pendingApprovalCount,
                completedProjects: completedCount,
              },
        customerSummary: customerSummaryData,
        branchStats: user.role === "admin" ? branchStatsArray : [],
        technicianStats: user.role !== "admin" ? technicians : [],
        managerSummary: user.role !== "admin" ? managerFinancialSummaryData : null,
      };

      localStorage.setItem(
        "dashboardData",
        JSON.stringify(dashboardDataToCache)
      );

      // Update signature after successful fetch
      dataSignatureRef.current = buildDataSignature(dashboardDataToCache);

      // localStorage.setItem('dashboardDataTimestamp', new Date().getTime().toString());
    } catch (err) {
      console.error("Error fetching fresh dashboard data:", err);
      throw err;
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  // Load dashboard data on component mount
  useEffect(() => {
    // Load Balance Overview from localStorage immediately for instant display
    if (user.role === 'manager') {
      const cachedBalanceOverview = localStorage.getItem('managerBalanceOverview');
      if (cachedBalanceOverview) {
        try {
          const parsed = JSON.parse(cachedBalanceOverview);
          setBalanceOverview(parsed);
        } catch (parseError) {
          console.error("Error parsing cached balance overview:", parseError);
        }
      }
    }

    // Load Branch Balance Overview from localStorage for admin
    if (user.role === 'admin') {
      const cachedBranchBalance = localStorage.getItem('adminBranchBalanceOverview');
      if (cachedBranchBalance) {
        try {
          const parsed = JSON.parse(cachedBranchBalance);
          setBranchBalanceOverview(parsed);
        } catch (parseError) {
          console.error("Error parsing cached branch balance overview:", parseError);
        }
      }

      // Load Admin Financial Snapshot from localStorage for instant display
      const cachedFinancialSnapshot = localStorage.getItem('adminFinancialSnapshot');
      if (cachedFinancialSnapshot) {
        try {
          const parsed = JSON.parse(cachedFinancialSnapshot);
          setAdminFinancialSnapshot(parsed);
        } catch (parseError) {
          console.error("Error parsing cached financial snapshot:", parseError);
        }
      }
    }

    fetchDashboardData();
  }, [user.role, user.selectedBranch]);

  // Polling effect to check for updates
  useEffect(() => {
    let isChecking = false;
    let isMounted = true;

    const checkForUpdates = async () => {
      if (isChecking || !isMounted) return;
      isChecking = true;

      try {
        // Build branch param if needed
        let branchParam = "";
        if (user.role === "admin" && user.selectedBranch) {
          branchParam = `?branch=${user.selectedBranch}`;
        }

        // Fetch only the necessary data to check for updates
        const [
          leadsResponse,
          customersResponse,
          workOrdersResponse,
          projectsResponse,
          inventorySerializedResponse,
          inventoryGenericResponse,
        ] = await Promise.all([
          fetch(`${SummaryApi.getAllLeads.url}${branchParam}`, {
            method: SummaryApi.getAllLeads.method,
            credentials: "include",
          }),
          fetch(`${SummaryApi.getAllCustomers.url}${branchParam}`, {
            method: SummaryApi.getAllCustomers.method,
            credentials: "include",
          }),
          fetch(`${SummaryApi.getWorkOrders.url}${branchParam}`, {
            method: SummaryApi.getWorkOrders.method,
            credentials: "include",
          }),
          fetch(`${SummaryApi.getManagerProjects.url}${branchParam}`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${SummaryApi.getInventoryByType.url}/serialized-product`, {
            method: SummaryApi.getInventoryByType.method,
            credentials: "include",
          }),
          fetch(`${SummaryApi.getInventoryByType.url}/generic-product`, {
            method: SummaryApi.getInventoryByType.method,
            credentials: "include",
          }),
        ]);

        const leadsData = await leadsResponse.json();
        const customersData = await customersResponse.json();
        const workOrdersData = await workOrdersResponse.json();
        const projectsData = await projectsResponse.json();
        const serializedData = await inventorySerializedResponse.json();
        const genericData = await inventoryGenericResponse.json();

        // Calculate basic stats
        let inventoryTotal = 0;
        let assignedCount = 0;
        let pendingApprovalCount = 0;
        let completedCount = 0;
        let pendingWorkOrdersCount = 0;

        if (user.role === "manager") {
          // Manager inventory calculation
          if (serializedData.success) {
            serializedData.items.forEach((item) => {
              if (item.stock) {
                inventoryTotal += item.stock.length;
              }
            });
          }

          if (genericData.success) {
            genericData.items.forEach((item) => {
              if (item.stock) {
                item.stock.forEach((stock) => {
                  inventoryTotal += parseInt(stock.quantity || 0, 10);
                });
              }
            });
          }
        } else {
          // Admin inventory calculation
          if (serializedData.success) {
            inventoryTotal += serializedData.items.length;
          }
          if (genericData.success) {
            inventoryTotal += genericData.items.length;
          }
        }

        // Calculate project counts
        if (projectsData.success) {
          const validProjects = projectsData.data.filter((project) => {
            return (
              project.technician &&
              (project.technician.firstName ||
                project.technician.lastName ||
                (typeof project.technician === "string" &&
                  project.technician.length > 0))
            );
          });

          assignedCount = validProjects.filter((project) =>
            ["assigned", "in-progress", "paused"].includes(project.status)
          ).length;

          pendingApprovalCount = validProjects.filter(
            (project) => project.status === "pending-approval"
          ).length;

          completedCount = validProjects.filter(
            (project) => project.status === "completed"
          ).length;
        }

        // Calculate work orders count
        pendingWorkOrdersCount = workOrdersData.success
          ? workOrdersData.data.filter(
              (order) =>
                order.status === "pending" || order.status === "Pending"
            ).length
          : 0;

        // Build new signature
        const newData = {
          stats: {
            assignedProjects: assignedCount,
            pendingApprovals: pendingApprovalCount,
            completedProjects: completedCount,
            workOrders: pendingWorkOrdersCount,
            inventory: inventoryTotal,
            customers: customersData.success ? customersData.data.length : 0,
            leads: leadsData.success ? leadsData.data.length : 0,
          },
        };

        const newSignature = buildDataSignature(newData);

        // If signature changed, refresh full dashboard data
        if (newSignature !== dataSignatureRef.current && isMounted) {
          console.log("Dashboard data changed, refreshing...");
          await fetchFreshDashboardData(true);
        }
      } catch (err) {
        console.error("Error checking for dashboard updates:", err);
      } finally {
        isChecking = false;
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    pollingIntervalRef.current = setInterval(checkForUpdates, POLLING_INTERVAL_MS);

    if (!document.hidden) {
      checkForUpdates();
    }

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user.role, user.selectedBranch]);

  const isAdmin = user.role === "admin";

  const adminDashboardStats = [
    {
      name: "Inventory Items",
      value: stats.inventory ?? 0,
      subtext: "Items available across all branches",
      gradient: "from-yellow-500 to-yellow-600",
      Icon: PackageIcon,
    },
    {
      name: "Work Orders",
      value: stats.workOrders ?? 0,
      subtext: "Jobs awaiting assignment",
      gradient: "from-rose-500 to-orange-500",
      Icon: Wrench,
    },
    {
      name: "Assigned Projects",
      value: stats.assignedProjects ?? 0,
      subtext: "Projects currently in motion",
      gradient: "from-indigo-500 to-blue-600",
      Icon: ActivityIcon,
    },
    {
      name: "Pending Approvals",
      value: stats.pendingApprovals ?? 0,
      subtext: "Updates waiting for review",
      gradient: "from-amber-500 to-yellow-500",
      Icon: LucideClock,
    },
  ];

  const managerStatCards = [
    {
      name: "Inventory Items",
      value: stats.inventory ?? 0,
      subtext: "Items available across all locations",
      gradient: "from-yellow-500 to-yellow-600",
      Icon: PackageIcon,
    },
    {
      name: "Pending Work Orders",
      value: stats.workOrders ?? 0,
      subtext: "Jobs awaiting assignment",
      gradient: "from-rose-500 to-orange-500",
      Icon: Wrench,
    },
    {
      name: "Assigned Projects",
      value: stats.assignedProjects ?? 0,
      subtext: "Projects currently in motion",
      gradient: "from-indigo-500 to-blue-600",
      Icon: ActivityIcon,
    },
    {
      name: "Pending Approvals",
      value: stats.pendingApprovals ?? 0,
      subtext: "Updates waiting for review",
      gradient: "from-amber-500 to-yellow-500",
      Icon: LucideClock,
    },
  ];

  const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN").format(Number(value ?? 0));

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount ?? 0);

  const defaultManagerFinancialSummary = {
    totalBilledAmount: 0,
    amountCollected: 0,
    outstandingAmount: 0,
    totalExpenses: 0,
    netProfit: 0,
    collectionRate: 0,
    profitMargin: 0,
    accountsSummary: {
      totalCustomers: 0,
      settledCustomers: 0,
      customersWithOutstanding: 0,
    },
    averageCollectionTime: 0,
  };

  const managerFinancialSnapshot =
    managerSummary || defaultManagerFinancialSummary;

  const managerNetProfit =
    managerFinancialSnapshot.netProfit ??
    managerFinancialSnapshot.amountCollected -
      managerFinancialSnapshot.totalExpenses;

  const managerCollectionRate =
    managerFinancialSnapshot.collectionRate !== undefined &&
    managerFinancialSnapshot.collectionRate !== null
      ? Number(managerFinancialSnapshot.collectionRate).toFixed(1)
      : managerFinancialSnapshot.totalBilledAmount
      ? (
          (
            (managerFinancialSnapshot.amountCollected /
              managerFinancialSnapshot.totalBilledAmount) *
            100
          ) || 0
        ).toFixed(1)
      : "0.0";

  const managerProfitMargin =
    managerFinancialSnapshot.profitMargin !== undefined &&
    managerFinancialSnapshot.profitMargin !== null
      ? Number(managerFinancialSnapshot.profitMargin).toFixed(1)
      : managerFinancialSnapshot.amountCollected
      ? (
          (
            (managerNetProfit / managerFinancialSnapshot.amountCollected) *
            100
          ) || 0
        ).toFixed(1)
      : "0.0";

  const accountsSummary =
    managerFinancialSnapshot.accountsSummary ||
    defaultManagerFinancialSummary.accountsSummary;

  // Handler functions for opening detail modals
  const handleViewCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    setShowCustomerDetailModal(true);
  };

  const handleViewDealer = (dealerId) => {
    setSelectedDealerId(dealerId);
    setShowDealerDetailModal(true);
  };

  const handleViewDistributor = (distributorId) => {
    setSelectedDistributorId(distributorId);
    setShowDistributorDetailModal(true);
  };

  // Handler to open appropriate modal based on customer type
  const handleAccountClick = (account) => {
    if (account.customerType === 'customer') {
      handleViewCustomer(account.customerId);
    } else if (account.customerType === 'dealer') {
      handleViewDealer(account.customerId);
    } else if (account.customerType === 'distributor') {
      handleViewDistributor(account.customerId);
    }
  };

  // Handler for modal close and data refresh
  const handleCustomerUpdated = (updatedCustomer) => {
    // Refresh dashboard data after customer update
    fetchDashboardData(true);
  };

  const handleDealerUpdated = (updatedDealer) => {
    // Refresh dashboard data after dealer update
    fetchDashboardData(true);
  };

  const handleDistributorUpdated = (updatedDistributor) => {
    // Refresh dashboard data after distributor update
    fetchDashboardData(true);
  };

  // Handle Balance Overview refresh
  const handleRefreshBalanceOverview = async () => {
    try {
      const balanceResponse = await fetch(
        SummaryApi.getManagerBalanceOverview.url,
        {
          method: SummaryApi.getManagerBalanceOverview.method,
          credentials: "include",
        }
      );
      const balanceData = await balanceResponse.json();
      if (balanceData.success) {
        setBalanceOverview(balanceData.data);
        // Cache in localStorage
        localStorage.setItem('managerBalanceOverview', JSON.stringify(balanceData.data));
      } else {
        setBalanceOverview({ accounts: [], summary: {} });
      }
    } catch (balanceError) {
      console.error("Error refreshing balance overview:", balanceError);
      // Keep existing data if refresh fails
    }
  };

  // Handle Branch Balance Overview refresh (Admin only)
  const handleRefreshBranchBalance = async () => {
    setRefreshingBranchBalance(true);
    try {
      const branchBalanceResponse = await fetch(
        SummaryApi.getBranchBalanceOverview.url,
        {
          method: SummaryApi.getBranchBalanceOverview.method,
          credentials: "include",
        }
      );
      const branchBalanceData = await branchBalanceResponse.json();
      if (branchBalanceData.success) {
        setBranchBalanceOverview(branchBalanceData.data);
        // Cache in localStorage
        localStorage.setItem('adminBranchBalanceOverview', JSON.stringify(branchBalanceData.data));
        setLastRefreshTime(prev => ({ ...prev, branchBalance: Date.now() }));
      } else {
        setBranchBalanceOverview({ branches: [], summary: {} });
      }
    } catch (error) {
      console.error("Error refreshing branch balance overview:", error);
      // Keep existing data if refresh fails
    } finally {
      setRefreshingBranchBalance(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back to your CRM dashboard</p>
        </div>

        <div className="flex space-x-2">
        <button
        onClick={() => {
          console.log("Button clicked");
          setShowModal(true);
        }}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
      >
        Mark Update Available
      </button>
      
      {/* Modal as a portal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between">
              <h2 className="text-lg font-bold">Mark Update Available</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <MarkUpdateForm />
          </div>
        </div>
      )}

          {/* Refresh button */}
          <button
            onClick={() => fetchFreshDashboardData()}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center"
            title="Refresh Dashboard Data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isAdmin ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {adminDashboardStats.map((card) => (
              <div
                key={card.name}
                className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white/80 text-sm mb-1">{card.name}</p>
                    <p className="text-3xl font-bold">
                      {formatNumber(card.value)}
                    </p>
                  </div>
                  <card.Icon size={40} className="text-white/70" />
                </div>
                <div className="text-sm text-white/80">{card.subtext}</div>
              </div>
            ))}
          </div>

          {/* Admin Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">
                    Total Billed Amount
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(adminFinancialSnapshot.totalBilledAmount)}
                  </p>
                </div>
                <IndianRupee size={40} className="text-blue-200" />
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span>
                  Across {adminFinancialSnapshot.totalBills} Bills
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-100 text-sm mb-1">Amount Collected</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(adminFinancialSnapshot.amountCollected)}
                  </p>
                </div>
                <CheckCircleIcon size={40} className="text-green-200" />
              </div>
              <div className="text-sm text-green-100">
                Successfully collected from customers
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">
                    Outstanding Amount
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(adminFinancialSnapshot.outstandingAmount)}
                  </p>
                </div>
                <LucideClock size={40} className="text-orange-200" />
              </div>
              <div className="text-sm text-orange-100">
                Pending payment amount
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-red-100 text-sm mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(adminFinancialSnapshot.totalExpenses)}
                  </p>
                </div>
                <AlertCircle size={40} className="text-red-200" />
              </div>
              <div className="text-sm text-red-100">Inventory purchase costs</div>
            </div>
          </div>

          {/* Admin Net Profit & Collection Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Net Profit (Items Only)
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(adminFinancialSnapshot.netProfit)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Margin: {adminFinancialSnapshot.profitMargin}% | Collected - Expenses
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Collection Rate
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {adminFinancialSnapshot.collectionRate}%
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Across {adminFinancialSnapshot.totalBills} bills
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <CheckCircleIcon size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Average Collection Time
                  </p>
                  <p className="text-3xl font-bold text-teal-600">
                    {adminFinancialSnapshot.averageCollectionTime} days
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Payment cycle duration
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <LucideClock size={24} className="text-teal-600" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {managerStatCards.map((card) => (
              <div
                key={card.name}
                className={`bg-gradient-to-br ${card.gradient} rounded-xl p-6 text-white shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white/80 text-sm mb-1">{card.name}</p>
                    <p className="text-3xl font-bold">
                      {formatNumber(card.value)}
                    </p>
                  </div>
                  <card.Icon size={40} className="text-white/70" />
                </div>
                <div className="text-sm text-white/80">{card.subtext}</div>
              </div>
            ))}
          </div>

          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">
                    Total Billed Amount
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(managerFinancialSnapshot.totalBilledAmount)}
                  </p>
                </div>
                <IndianRupee size={40} className="text-blue-200" />
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span>
                  Across {managerFinancialSnapshot.totalBills} Bills
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-green-100 text-sm mb-1">Amount Collected</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(managerFinancialSnapshot.amountCollected)}
                  </p>
                </div>
                <CheckCircleIcon size={40} className="text-green-200" />
              </div>
              <div className="flex items-center gap-2 text-sm text-green-100">
                <TrendingUp size={16} />
                <span>{managerCollectionRate}% collection rate</span>
              </div>
              {/* <div className="text-sm text-green-100 mt-1">
                From all bill types
              </div> */}
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-1">
                    Outstanding Amount
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(managerFinancialSnapshot.outstandingAmount)}
                  </p>
                </div>
                <LucideClock size={40} className="text-orange-200" />
              </div>
              <div className="text-sm text-orange-100">
                Pending payment amount
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-red-100 text-sm mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(managerFinancialSnapshot.totalExpenses)}
                  </p>
                </div>
                <AlertCircle size={40} className="text-red-200" />
              </div>
              <div className="text-sm text-red-100">Inventory purchase costs</div>
            </div>
          </div>

          {/* Net Profit & Collection Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Net Profit (After Collection)
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(managerNetProfit)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Margin: {managerProfitMargin}% | Collected - Expenses
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp size={24} className="text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Total Bills Created
                  </p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {managerFinancialSnapshot.totalBills}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    All account types included
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <UsersIcon size={24} className="text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Average Collection Time
                  </p>
                  <p className="text-3xl font-bold text-teal-600">
                    {managerFinancialSnapshot.averageCollectionTime} days
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Payment cycle duration
                  </p>
                </div>
                <div className="p-3 bg-teal-100 rounded-lg">
                  <LucideClock size={24} className="text-teal-600" />
                </div>
              </div>
            </div>
          </div> */}

          {/* Balance Overview - Only show for managers */}
          {balanceOverview.accounts && balanceOverview.accounts.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Balance Overview</h3>
                  <p className="text-sm text-gray-500">
                    Accounts with outstanding balances
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefreshBalanceOverview}
                    className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                    title="Refresh Balance Overview"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                  </button>
                  <div className="text-sm text-gray-500">
                    Showing {balanceOverview.accounts.length} accounts
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Billed</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Collected</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Outstanding</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanceOverview.accounts.map((account, index) => {
                      const getTypeBadgeClass = (type) => {
                        if (type === 'customer') return 'bg-purple-100 text-purple-700';
                        if (type === 'dealer') return 'bg-orange-100 text-orange-700';
                        if (type === 'distributor') return 'bg-teal-100 text-teal-700';
                        return 'bg-gray-100 text-gray-700';
                      };

                      const getTypeLabel = (type) => {
                        if (type === 'customer') return 'Customer';
                        if (type === 'dealer') return 'Dealer';
                        if (type === 'distributor') return 'Distributor';
                        return type;
                      };

                      return (
                        <tr
                          key={`${account.customerId}-${index}`}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleAccountClick(account)}
                        >
                          <td className="py-3 px-4">
                            {/* Display exactly like ContactsPage */}
                            <div className="font-medium text-gray-800">
                              {account.name || 'N/A'}
                            </div>
                            {account.firmName && (
                              <div className="text-xs text-gray-500">{account.firmName || 'N/A'}</div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">{account.phone || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4 text-right text-blue-600 font-semibold">
                            ₹{account.billed.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right text-green-600 font-semibold">
                            ₹{account.collected.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right text-orange-600 font-semibold">
                            ₹{account.outstanding.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeClass(account.customerType)}`}>
                              {getTypeLabel(account.customerType)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Branch Balance Overview - Admin Only */}
      {user.role === "admin" && branchBalanceOverview.branches && branchBalanceOverview.branches.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Branch Balance Overview</h3>
              <p className="text-sm text-gray-500">
                Financial summary across all branches
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={handleRefreshBranchBalance}
                disabled={refreshingBranchBalance}
                className={`p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all ${
                  refreshingBranchBalance ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Refresh Branch Balance Overview"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshingBranchBalance ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-sm text-gray-500">
                {branchBalanceOverview.branches.length} {branchBalanceOverview.branches.length === 1 ? 'branch' : 'branches'}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Branch Name</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount Collected</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Outstanding Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Expenses</th>
                </tr>
              </thead>
              <tbody>
                {branchBalanceOverview.branches.map((branch, index) => (
                  <tr
                    key={branch.branchId}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{branch.branchName}</div>
                      {branch.branchLocation && (
                        <div className="text-xs text-gray-500">{branch.branchLocation}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{branch.totalAmount?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-medium text-green-600">
                        ₹{branch.amountCollected?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-medium text-orange-600">
                        ₹{branch.outstandingAmount?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="text-sm font-medium text-red-600">
                        ₹{branch.totalExpenses?.toLocaleString('en-IN') || '0'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Summary Row */}
              <tfoot>
                <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    ₹{branchBalanceOverview.summary?.totalAmount?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-right text-green-700">
                    ₹{branchBalanceOverview.summary?.totalCollected?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-right text-orange-700">
                    ₹{branchBalanceOverview.summary?.totalOutstanding?.toLocaleString('en-IN') || '0'}
                  </td>
                  <td className="py-3 px-4 text-right text-red-700">
                    ₹{branchBalanceOverview.summary?.totalExpenses?.toLocaleString('en-IN') || '0'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Branch/Technician Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {user.role === "admin" ? "Branch Work Overview" : "Engineers Overview"}
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {user.role === "admin" ? "BRANCH" : "NAME"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ASSIGNED
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IN PROGRESS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PENDING APPROVAL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COMPLETED
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRANSFERRING
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRANSFERRED
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {user.role === "admin"
                ? // Admin view - branches data
                  branchStats.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {branch.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.inProgress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.pendingApproval}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.transferring}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {branch.transferred}
                      </td>
                    </tr>
                  ))
                : // Manager view - technicians data
                  technicianStats.map((tech) => (
                    <tr key={tech.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tech.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.assigned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.inProgress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.pendingApproval}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.transferring}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tech.transferred}
                      </td>
                    </tr>
                  ))}

              {/* Add a total row at the bottom remark*/}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.assigned,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.assigned,
                        0
                      )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.inProgress,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.inProgress,
                        0
                      )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.pendingApproval,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.pendingApproval,
                        0
                      )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.completed,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.completed,
                        0
                      )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.transferring,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.transferring,
                        0
                      )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === "admin"
                    ? branchStats.reduce(
                        (sum, branch) => sum + branch.transferred,
                        0
                      )
                    : technicianStats.reduce(
                        (sum, tech) => sum + tech.transferred,
                        0
                      )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modals */}
      <CustomerDetailModal
        isOpen={showCustomerDetailModal}
        onClose={() => {
          setShowCustomerDetailModal(false);
          setSelectedCustomerId(null);
        }}
        customerId={selectedCustomerId}
        onCustomerUpdated={handleCustomerUpdated}
      />

      <DealerDetailModal
        isOpen={showDealerDetailModal}
        onClose={() => {
          setShowDealerDetailModal(false);
          setSelectedDealerId(null);
        }}
        dealerId={selectedDealerId}
        onDealerUpdated={handleDealerUpdated}
      />

      <DistributorDetailModal
        isOpen={showDistributorDetailModal}
        onClose={() => {
          setShowDistributorDetailModal(false);
          setSelectedDistributorId(null);
        }}
        distributorId={selectedDistributorId}
        onDistributorUpdated={handleDistributorUpdated}
      />

    </div>
  );
};

export default Dashboard;
