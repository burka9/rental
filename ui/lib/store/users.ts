import { create } from "zustand"
import { User } from "../types"
import { useStore } from "."
import { axios } from "../axios"

type StoreState = {
  users: User[]
  totalUsers: number
  currentPage: number
  pageSize: number
  loading: boolean
}

type StoreAction = {
  fetchUsers: (page?: number, limit?: number, search?: string) => Promise<User[]>
  fetchUser: (id: number) => Promise<User | null>
  createUser: (user: Partial<User>) => Promise<boolean>
  updateUser: (user: Partial<User>) => Promise<User | null>
  deleteUser: (id: number) => Promise<boolean>
  setLoading: (loading: boolean) => void
}

type Store = StoreState & StoreAction

export const useUserStore = create<Store>((set) => ({
  users: [],
  totalUsers: 0,
  currentPage: 1,
  pageSize: 10,
  loading: false,

  fetchUsers: async (page = 1, limit = 10, search = "") => {
    const { user } = useStore.getState()
    set({ loading: true })

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      })

      const res = await axios.get(`/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      set({
        users: res.data.data,
        totalUsers: res.data.total,
        currentPage: page,
        pageSize: limit,
      })

      return res.data.data
    } catch (error) {
      console.error("Failed to fetch users:", error)
      return []
    } finally {
      set({ loading: false })
    }
  },

  fetchUser: async (id: number) => {
    const { user } = useStore.getState()
    set({ loading: true })

    try {
      const res = await axios.get(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })
      return res.data
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error)
      return null
    } finally {
      set({ loading: false })
    }
  },

  createUser: async (userData: Partial<User>) => {
    const { user } = useStore.getState()
    set({ loading: true })

    try {
      await axios.post(
        "/users",
        { ...userData },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )
      return true
    } catch (error) {
      console.error("Failed to create user:", error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  updateUser: async (userData: Partial<User>) => {
    const { user } = useStore.getState()
    set({ loading: true })

    try {
      const res = await axios.put(
        `/users/${userData.id}`,
        { ...userData },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      )
      return res.data
    } catch (error) {
      console.error(`Failed to update user ${userData.id}:`, error)
      return null
    } finally {
      set({ loading: false })
    }
  },

  deleteUser: async (id: number) => {
    const { user } = useStore.getState()
    set({ loading: true })

    try {
      await axios.delete(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })
      return true
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error)
      return false
    } finally {
      set({ loading: false })
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
}))
