const backendDomain = process.env.REACT_APP_BACKEND_URL

const SummaryApi = {
    logIn:{
        url: `${backendDomain}/api/login`,
        method: "post"
    },
    getAdminUsers:{
        url : `${backendDomain}/api/get-admins`,
        method: "get"
    },
    addAdminUser:{
        url : `${backendDomain}/api/add-admins`,
        method: "post"
    },
    getManagerUsers : {
        url : `${backendDomain}/api/get-managers`,
        method: "get"
    },
    addManagerUser: {
        url : `${backendDomain}/api/add-managers`,
        method: "post"
    },
    getTechnicianUsers: {
        url : `${backendDomain}/api/get-technicians`,
        method: "get"
    },
    addTechnicianUser: {
        url : `${backendDomain}/api/add-technicians`,
        method: "post" 
    },
    getBranches: {
        url : `${backendDomain}/api/get-branches`,
        method: "get" 
    },
      addBranch: {
        url : `${backendDomain}/api/add-branches`,
        method: "post" 
    },
    updateUserStatus: {
        url : `${backendDomain}/api/user-status`,
        method: "post"
    },
    getAllLeads: {
        url : `${backendDomain}/api/get-all-leads`,
        method: "get"
    },
    getLead :{
        url: `${backendDomain}/api/get-single-lead`,
        method: "get"
    },
    createLead : {
        url : `${backendDomain}/api/create-Lead`,
        method: "post"
    },
    updateLead: {
        url: `${backendDomain}/api/update-lead`,
        method: "post"
    },
    addRemark: {
        url: `${backendDomain}/api/lead-remarks`,
        method: "post"
    },
    convertToCustomer: {
        url : `${backendDomain}/api/lead-convert`,
        method: "post"
    },
    search : {
        url : `${backendDomain}/api/search`,
        method: "get"
    },
    getAllCustomers : {
        url : `${backendDomain}/api/get-all-customers`,
        method: "get"
    },
    getCustomer: {
        url : `${backendDomain}/api/get-single-customer`,
        method: "get"
    },
    createCustomer :{
        url : `${backendDomain}/api/create-customer`,
        method: "post"
    },
    updateCustomer: {
        url : `${backendDomain}/api/update-customer`,
        method: "post"
    },
    getAllInventoryItems: {
        url : `${backendDomain}/api/get-all-inventory`,
        method: "get"
    },
    getInventoryItemById: {
        url: `${backendDomain}/api/get-single-inventory`,
        method: "get"
    },
    addInventoryItem: {
        url : `${backendDomain}/api/create-inventory`,
        method: "post"
    },
    updateInventoryItem: {
        url : `${backendDomain}/api/update-inventory`,
        method: "post"
    },
    addInventoryStock: {
        url : `${backendDomain}/api/add-stock`,
        method: "post"
    },
    deleteInventoryItem: {
        url : `${backendDomain}/api/delete-inventory`,
        method: "post"
    },
    getInventoryByType: {
        url : `${backendDomain}/api/inventory-by-type`,
        method: "get"
    },
    checkSerialNumber: {
        url: `${backendDomain}/api/check-serial`,
        method: "get"
    },
    getManagerTechnician: {
        url : `${backendDomain}/api/manager-get-technician`,
        method: "get"
    },
    addManagerTechnician: {
        url: `${backendDomain}/api/manager-add-technician`,
        method: "post"
    },
    getUser: {
        url: `${backendDomain}/api/get-user`,
        method: "get"
      },
      updateUser: {
        url: `${backendDomain}/api/update-user`,
        method: "post"
      },
      deleteUser: {
        url: `${backendDomain}/api/delete-user`,
        method: "delete"
      },
      checkManagerStatus: {
        url : `${backendDomain}/api/manager-status`,
        method: "get"
      },
      getNewBranchManagers: {
        url : `${backendDomain}/api/new-managers`,
        method: "get"
      },
      initiateTransfer: {
        url : `${backendDomain}/api/initiate-transfer`,
        method: "post"
      },
      acceptTransfer: {
        url : `${backendDomain}/api/accept-transfer`,
        method: "post"
      },
      rejectTransfer: {
        url : `${backendDomain}/api/reject-transfer`,
        method: "post"
      },
      getRejectedTransfers: {
        url: `${backendDomain}/api/get-rejected-transfers`,
        method: "get"
      },
      createWorkOrder: {
        url : `${backendDomain}/api/create-work-orders`,
        method: "post"
      },
      getWorkOrders: {
        url: `${backendDomain}/api/get-work-orders`,
        method: "get"
      },
      assignTechnician: {
        url : `${backendDomain}/api/assign-technician`,
        method: "post"
      }
}

export default SummaryApi;