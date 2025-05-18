'use client'
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
	const router = useRouter()
	const { fetchUser } = useStore()

	useEffect(() => {
		console.log('fetching')
		fetchUser()
			.then(data => {
				console.log(data)
				if (data) {
				} else {
					console.log('error')
					// redirect to login
					router.push('/auth/login')
				}
			})
			.catch(() => {
				console.log('here is here')
				router.push('/auth/login')
			})
	}, [])
}