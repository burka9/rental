'use client'
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  
  const { fetchUser } = useStore()
  
  useEffect(() => {
    console.log('asdf')
    fetchUser()
      .then(res => {
        if (res) router.push('/dashboard/home')
        else router.push('/auth/login')
      })
      .catch(() => router.push('/auth/login'))
  }, [])
  
  return <></>
}
