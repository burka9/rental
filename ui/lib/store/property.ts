import { create } from "zustand"
import { axios } from "../axios"
import { Bank, Building, Partition, Room } from "../types"
import { useStore } from "."

type StoreState = {
	buildings: Building[]
	rooms: Room[]
	partitions: Partition[]
	banks: Bank[]
}

type StoreAction = {
	fetchBuildings: () => Promise<Building[]>
	fetchBuilding: (id: number) => Promise<Building | null>
	createBuilding: (building: Partial<Building>) => Promise<boolean>
	updateBuilding: (building: Partial<Building>) => Promise<Building | null>
	deleteBuilding: (id: number) => Promise<boolean>

	fetchRooms: () => Promise<Room[]>
	fetchRoom: (id: number) => Promise<Room | null>
	createRoom: (room: Partial<Room>) => Promise<boolean>
	updateRoom: (room: Partial<Room>) => Promise<Room | null>
	deleteRoom: (id: number) => Promise<boolean>

	fetchPartitions: () => Promise<Partition[]>
	fetchPartition: (id: number) => Promise<Partition | null>
	createPartition: (partition: Partial<Partition>) => Promise<boolean>
	updatePartition: (partition: Partial<Partition>) => Promise<Partition | null>
	deletePartition: (id: number) => Promise<boolean>

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

			set({ buildings: res.data.data as Building[] })

			return res.data.data as Building[]
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

			return res.data.data as Building
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
	fetchRooms: async () => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get('/room', {
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

	partitions: [],
	fetchPartitions: async () => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get('/partition', {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set({ partitions: res.data.data as Partition[] })

			return res.data.data as Partition[]
		} catch(err) {
			console.log(err)
			return []
		}
	},
	fetchPartition: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.get(`/partition/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			return res.data.data as Partition
		} catch(err) {
			console.log(err)
			return null
		}
	},
	createPartition: async (partition: Partial<Partition>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.post('/partition', partition, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				partitions: [...state.partitions, res.data.data]
			}))

			return res.data.success
		} catch(err) {
			console.log(err)
			return false
		}
	},
	updatePartition: async (partition: Partial<Partition>) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.put(`/partition/${partition.id}`, partition, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				partitions: state.partitions.map(partition => 
					partition.id === res.data.data.id ? res.data.data : partition
				)
			}))

			return res.data.data
		} catch(err) {
			console.log(err)
			return null
		}
	},
	deletePartition: async (id: number) => {
		const { user } = useStore.getState()

		try {
			const res = await axios.delete(`/partition/${id}`, {
				headers: {
					Authorization: `Bearer ${user?.token}`
				}
			})

			set(state => ({
				partitions: state.partitions.filter(partition => partition.id !== id)
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