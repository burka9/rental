import { create } from "zustand"
import { axios } from "../axios"
import { Bank, Building, Room } from "../types"
import { useStore } from "."

type SuperBuilding = Building & {
	tenantCount: number
}

type StoreState = {
	buildings: SuperBuilding[]
	rooms: Room[]
	banks: Bank[]
}

type StoreAction = {
	fetchBuildings: () => Promise<SuperBuilding[]>
	fetchBuilding: (id: number) => Promise<SuperBuilding | null>
	createBuilding: (building: Partial<Building>) => Promise<boolean>
	updateBuilding: (building: Partial<Building>) => Promise<Building | null>
	deleteBuilding: (id: number) => Promise<boolean>

	fetchRooms: (ids?: number[] | string[]) => Promise<Room[]>
	fetchRoom: (id: number) => Promise<Room | null>
	createRoom: (room: Partial<Room>) => Promise<boolean>
	updateRoom: (room: Partial<Room>) => Promise<Room | null>
	deleteRoom: (id: number) => Promise<boolean>

	fetchBanks: () => Promise<Bank[]>
	fetchBank: (id: number) => Promise<Bank | null>
	createBank: (bank: Partial<Bank>) => Promise<boolean>
	updateBank: (bank: Partial<Bank>) => Promise<Bank | null>
	deleteBank: (id: number) => Promise<boolean>
}


type Store = StoreState & StoreAction


export const usePropertyStore = create<Store>(set => ({
	buildings: [],
	fetchBuildings: async () => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get('/building', {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ buildings: res.data.data as SuperBuilding[] })

			return res.data.data as SuperBuilding[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchBuilding: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get(`/building/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as SuperBuilding
		} catch(err) {
			console.log(err)
			return null
		}
	},
	createBuilding: async (building: Partial<Building>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.post('/building', building, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				buildings: [...state.buildings, res.data.data]
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
	updateBuilding: async (building: Partial<Building>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.put(`/building/${building.id}`, building, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				buildings: state.buildings.map(building => 
					building.id === res.data.data.id ? res.data.data : building
				)
			}))

			return res.data.data
		} catch(err) {
			console.log(err)
			return null
		}
	},
	deleteBuilding: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.delete(`/building/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				buildings: state.buildings.filter(building => building.id !== id)
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},

	rooms: [],
	fetchRooms: async (ids?: number[] | string[]) => {
		const { user } = useStore.getState()

		try {
			const rooms = ids ? `ids=${ids.join(',')}` : ''
			console.log(rooms)
			const res = await axios.get(`/room?${rooms}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ rooms: res.data.data as Room[] })

			return res.data.data as Room[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchRoom: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get(`/room/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as Room
		} catch(err) {
			console.log(err)
			return null
		}
	},
	createRoom: async (room: Partial<Room>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.post('/room', room, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				rooms: [...state.rooms, res.data.data]
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
	updateRoom: async (room: Partial<Room>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.put(`/room/${room.id}`, room, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				rooms: state.rooms.map(room => 
					room.id === res.data.data.id ? res.data.data : room
				)
			}))

			return res.data.data
		} catch(err) {
			console.log(err)
			return null
		}
	},
	deleteRoom: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.delete(`/room/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				rooms: state.rooms.filter(room => room.id !== id)
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},

	banks: [],
	fetchBanks: async () => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get('/bank', {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ banks: res.data.data as Bank[] })

			return res.data.data as Bank[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchBank: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get(`/bank/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as Bank
		} catch(err) {
			console.log(err)
			return null
		}
	},
	createBank: async (bank: Partial<Bank>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.post('/bank', bank, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				banks: [...state.banks, res.data.data]
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
	updateBank: async (bank: Partial<Bank>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.put(`/bank/${bank.id}`, bank, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				banks: state.banks.map(bank => 
					bank.id === res.data.data.id ? res.data.data : bank
				)
			}))

			return res.data.data
		} catch(err) {
			console.log(err)
			return null
		}
	},
	deleteBank: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.delete(`/bank/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				banks: state.banks.filter(bank => bank.id !== id)
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
}))