import { create } from 'zustand'
import { axios } from '../axios'
import { CurrentUser } from '../types'


type StoreState = {
	user?: CurrentUser
	loadingPage: boolean
}

type StoreAction = {
	setUser: (user: CurrentUser) => void
	fetchUser: () => Promise<CurrentUser | null>
	setLoadingPage: (loadingPage: boolean) => void
}

type Store = StoreState & StoreAction

export const useStore = create<Store>(set => ({
	setUser: user => {
		set({ user })
	},
	fetchUser: async () => {
		try {
			const token = localStorage.getItem('token')

			if (token) {
				const res = await axios.post('/auth/check', {}, {
					headers: {
						Authorization: `Bearer ${token}`
					}
				})

				const { id, role } = res.data
				const user: CurrentUser = { id, role, token }
				
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
	}
}))