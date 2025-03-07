import { create } from "zustand"
import { Tenant } from "../types"
import { useStore } from "."
import { axios } from "../axios"

type StoreState = {
	tenants: Tenant[]
}

type StoreAction = {
	fetchTenants: () => Promise<Tenant[]>
	fetchTenant: (id: number) => Promise<Tenant | null>
	createTenant: (tenant: Partial<Tenant>) => Promise<boolean>
	updateTenant: (tenant: Partial<Tenant>) => Promise<Tenant | null>
	deleteTenant: (id: number) => Promise<boolean>
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
	}
}))