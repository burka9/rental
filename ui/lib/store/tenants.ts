import { create } from "zustand"
import { Tenant, Lease, Payment, BasicReport } from "../types"
import { useStore } from "."
import { axios } from "../axios"

type StoreState = {
  tenants: Tenant[]
  totalTenants: number
  totalPayments: number
  tenantCurrentPage: number
  tenantPageSize: number
  paymentCurrentPage: number
  paymentPageSize: number
  leases: Lease[]
  totalLeases: number
  leaseCurrentPage: number
  leasePageSize: number
  payments: Payment[]
  basicReport?: BasicReport
}

type StoreAction = {
  fetchTenants: (page?: number, limit?: number, search?: string, isShareholder?: string, officeNumber?: string) => Promise<Tenant[]>
  fetchTenant: (id: number) => Promise<Tenant | null>
  createTenant: (tenant: FormData) => Promise<boolean>
  updateTenant: (tenant: FormData) => Promise<Tenant | null>
  deleteTenant: (id: number) => Promise<boolean>
  fetchLeases: (page?: number, limit?: number) => Promise<Lease[]>
  fetchLease: (id: number) => Promise<Lease | null>
  createLease: (lease: Partial<Lease>) => Promise<boolean>
  updateLease: (lease: Partial<Lease>) => Promise<Lease | null>
  deleteLease: (id: number) => Promise<boolean>
  fetchBasicReport: () => Promise<BasicReport>
  fetchPayments: (page?: number, limit?: number, search?: string, isVerified?: string) => Promise<Payment[]>
  fetchPayment: (id: number) => Promise<Payment | null>
  createPayment: (payment: Partial<Payment>) => Promise<boolean>
  updatePayment: (payment: Partial<Payment>) => Promise<Payment | null>
  deletePayment: (id: number) => Promise<boolean>
  addFilesToLease: (id: number, data: FormData) => Promise<Lease | null>
  removeFile: (leaseId: number, filePath: string) => Promise<boolean>
  terminateLease: (id: number) => Promise<boolean>,
}

type Store = StoreState & StoreAction

export const useTenantStore = create<Store>((set) => ({
  tenants: [],
  totalTenants: 0,
  totalPayments: 0,
  tenantCurrentPage: 1,
  tenantPageSize: 10,
  paymentCurrentPage: 1,
  paymentPageSize: 10,
  leases: [],
  totalLeases: 0,
  leaseCurrentPage: 1,
  leasePageSize: 10,
  payments: [],
  basicReport: undefined,

  async fetchTenants(page = 1, limit = 10, search = "", isShareholder = "all", officeNumber = "all") {
    console.log('fetch tenants: ', search, isShareholder)
    
    const { user } = useStore.getState()

    try {
      const res = await axios.get('/tenant', {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
        params: {
          page,
          limit,
          search: search || undefined,
          isShareholder: isShareholder !== "all" ? isShareholder : undefined,
          officeNumber: officeNumber !== "all" ? officeNumber : undefined
        },
      })

      const { tenants, pagination } = res.data.data
      set({
        tenants,
        totalTenants: pagination.total,
        tenantCurrentPage: pagination.page,
        tenantPageSize: pagination.limit,
      })
      return tenants
    } catch (err) {
      console.log(err)
      set({ tenants: [], totalTenants: 0 })
      return []
    }
  },

  fetchTenant: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.get(`/tenant/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })
      return res.data.data as Tenant
    } catch (err) {
      console.log(err)
      return null
    }
  },

  createTenant: async (tenant: FormData) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.post('/tenant', tenant, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data"
        },
      })

      set(state => ({
        tenants: [...state.tenants, res.data.data],
        totalTenants: state.totalTenants + 1,
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },

  updateTenant: async (tenant: FormData) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.post('/tenant', tenant, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data"
        },
      })

      set(state => ({
        tenants: state.tenants.map(t => t.id === res.data.data.id ? res.data.data : t),
      }))
      return res.data.data
    } catch (err) {
      console.log(err)
      return null
    }
  },

  deleteTenant: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.delete(`/tenant/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        tenants: state.tenants.filter(tenant => tenant.id !== id),
        totalTenants: state.totalTenants - 1,
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },

  async fetchLeases(page = 1, limit = 10) {
    const { user } = useStore.getState()

    try {
      const res = await axios.get('/lease', {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
        params: {
          page,
          limit,
        },
      })

      const { leases, pagination } = res.data.data
      set({
        leases,
        totalLeases: pagination.total,
        leaseCurrentPage: pagination.page,
        leasePageSize: pagination.limit,
      })
      return leases as Lease[]
    } catch (err) {
      console.log(err)
      set({ leases: [], totalLeases: 0 })
      return []
    }
  },

  fetchLease: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.get(`/lease/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      return res.data.data as Lease
    } catch (err) {
      console.log(err)
      return null
    }
  },

  createLease: async (lease: Partial<Lease>) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.post('/lease', lease, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        leases: [...state.leases, res.data.data],
        totalLeases: state.totalLeases + 1,
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },

  updateLease: async (lease: Partial<Lease>) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.put(`/lease/${lease.id}`, lease, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        leases: state.leases.map(l => l.id === res.data.data.id ? res.data.data : l),
      }))
      return res.data.data as Lease
    } catch (err) {
      console.log(err)
      return null
    }
  },

  deleteLease: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.delete(`/lease/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        leases: state.leases.filter(lease => lease.id !== id),
        totalLeases: state.totalLeases - 1,
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },

  fetchBasicReport: async () => {
    const { user } = useStore.getState()

    try {
      const res = await axios.get('/report/basic', {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set({ basicReport: res.data.data })
      return res.data.data
    } catch (err) {
      console.error(err)
      return []
    }
  },

  async fetchPayments(page = 1, limit = 10, search = "", isVerified = "all") {
    console.log('fetch payments: ', search, isVerified)
    
    const { user } = useStore.getState()

    try {
      const res = await axios.get('/payment', {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
        params: {
          page,
          limit,
          search: search || undefined,
          isVerified: isVerified !== "all" ? isVerified : undefined,
        },
      })

      const { payments, pagination } = res.data.data
      set({
        payments,
        totalPayments: pagination.total,
        paymentCurrentPage: pagination.page,
        paymentPageSize: pagination.limit,
      })
      return payments
    } catch (err) {
      console.log(err)
      set({ payments: [], totalPayments: 0 })
      return []
    }
  },

  fetchPayment: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.get(`/payment/un/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })
      return res.data.data as Payment
    } catch (err) {
      console.log(err)
      return null
    }
  },

  createPayment: async (payment: Partial<Payment>) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.post('/payment', payment, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        payments: [...state.payments, res.data.data],
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },

  updatePayment: async (payment: Partial<Payment>) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.put(`/payment/${payment.id}`, payment, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        payments: state.payments.map(p => p.id === res.data.data.id ? res.data.data : p),
      }))
      return res.data.data as Payment
    } catch (err) {
      console.log(err)
      return null
    }
  },

  deletePayment: async (id: number) => {
    const { user } = useStore.getState()

    try {
      const res = await axios.delete(`/payment/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        payments: state.payments.filter(payment => payment.id !== id),
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },
  async addFilesToLease(id, data) {
    const { user } = useStore.getState()

    try {
      const res = await axios.post(`/lease/add-files/${id}`, data, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data"
        },
      })

      set(state => ({
        leases: state.leases.map(l => l.id === res.data.data.id ? res.data.data : l),
      }))
      return res.data.data as Lease
    } catch (err) {
      console.log(err)
      return null
    }
  },
  async removeFile(leaseId, filePath) {
    const { user } = useStore.getState()

    try {
      const res = await axios.post(`/lease/remove-file`, {
        leaseId,
        filePath
      }, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        leases: state.leases.map(l => l.id === res.data.data.id ? res.data.data : l),
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  },
  async terminateLease(id) {
    const { user } = useStore.getState()

    try {
      const res = await axios.post(`/lease/terminate/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`
        },
      })

      set(state => ({
        leases: state.leases.map(l => l.id === res.data.data.id ? res.data.data : l),
      }))
      return res.data.success
    } catch (err) {
      console.log(err)
      return false
    }
  }
}))