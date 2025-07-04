import { create } from 'zustand'
import { axios } from '../axios'
import { CurrentUser, User } from '../types'


type StoreState = {
	user?: CurrentUser
	token?: string
	loadingPage: boolean
}

type StoreAction = {
	setUser: (user: CurrentUser) => void
	fetchUser: () => Promise<CurrentUser | null>
	setToken: (token: string) => void
	setLoadingPage: (loadingPage: boolean) => void
	logout: () => void
	getUsers: () => Promise<User[]>
}

type Store = StoreState & StoreAction

export const useStore = create<Store>(set => ({
	setToken: (token: string) => {
		localStorage.setItem('token', token)
		set({ token })
	},
	setUser: user => {
		localStorage.setItem('user', JSON.stringify(user))
		set({ user })
	},
	fetchUser: async () => {
		try {
			const token = localStorage.getItem('token')

			if (token) {
				const res = await axios.post('/auth/verify', {}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				})

				if (!res.data.success) {
					return null
				}

				const { id, role, buildingId, phone, name } = res.data.user
				const user: CurrentUser = { id, role, buildingId, phone, token, name }

				set({ user })
				localStorage.setItem('user', JSON.stringify(user))

				return user
			}
		} catch {
		}

		return null
	},
	loadingPage: true,
	setLoadingPage: loadingPage => {
		set({ loadingPage })
	},
	logout: () => {
		localStorage.clear()
		set({ user: undefined, token: undefined })
	},
	getUsers: async () => {
		try {
			const res = await axios.get('/user', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`
				}
			})

			if (!res.data.success) {
				return []
			}

			return res.data.users
		} catch {
			return []
		}
	}
}))