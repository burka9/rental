import { create } from "zustand"
import { Tenant, Lease } from "../types"
import { useStore } from "."
import { axios } from "../axios"

type StoreState = {
	tenants: Tenant[]
	leases: Lease[]
}

type StoreAction = {
	fetchTenants: () => Promise<Tenant[]>
	fetchTenant: (id: number) => Promise<Tenant | null>
	createTenant: (tenant: Partial<Tenant>) => Promise<boolean>
	updateTenant: (tenant: Partial<Tenant>) => Promise<Tenant | null>
	deleteTenant: (id: number) => Promise<boolean>

	fetchLeases: () => Promise<Lease[]>
	fetchLease: (id: number) => Promise<Lease | null>
	createLease: (lease: Partial<Lease>) => Promise<boolean>
	updateLease: (lease: Partial<Lease>) => Promise<Lease | null>
	deleteLease: (id: number) => Promise<boolean>
}

type Store = StoreState & StoreAction

export const useTenantStore = create<Store>(set => ({
	tenants: [],
	async fetchTenants() {
		const { user } = useStore.getState()

		try {
			const res = await axios.get('/tenant', {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ tenants: res.data.data as Tenant[] })

			return res.data.data as Tenant[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchTenant: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get(`/tenant/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as Tenant
		} catch(err) {
			console.log(err)
			return null
		}
	},
	createTenant: async (tenant: Partial<Tenant>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.post('/tenant', tenant, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				tenants: [...state.tenants, res.data.data]
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
	updateTenant: async (tenant: Partial<Tenant>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.put(`/tenant/${tenant.id}`, tenant, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				tenants: state.tenants.map(tenant => 
					tenant.id === res.data.data.id ? res.data.data : tenant
				)
			}))

			return res.data.data
		} catch(err) {
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
				}
			})

			set(state => ({
				tenants: state.tenants.filter(tenant => tenant.id !== id)
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},

	leases: [],
	async fetchLeases() {
		const { user } = useStore.getState()
		
		try {
			const res = await axios.get('/lease', {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ leases: res.data.data as Lease[] })

			return res.data.data as Lease[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchLease: async (id: number) => {
		const { user } = useStore.getState()
		
		try {
			const res = await axios.get(`/lease/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as Lease
		} catch(err) {
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
				}
			})

			set(state => ({
				leases: [...state.leases, res.data.data]
			}))

			return res.data.success
		} catch(err) {
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
				}
			})

			set(state => ({
				leases: state.leases.map(lease => 
					lease.id === res.data.data.id ? res.data.data : lease
				)
			}))

			return res.data.data as Lease
		} catch(err) {
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
				}
			})

			set(state => ({
				leases: state.leases.filter(lease => lease.id !== id)
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	}
}))