'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { links } from "./sidebar";
import { useEffect, useState } from "react";
import { axios } from "@/lib/axios";

export default function Home() {
  const [overview, setOverview] = useState<{
    offices: number
    vacantOffices: number
    tenants: number
    rooms: number
    buildings: number
    users: number
    banks: number
  }>()

  useEffect(() => {
    axios.get('/util/overview')
      .then(res => {
        setOverview(res.data.data)
      })
      .catch(console.error)
  }, [])
  
	return (
		<div className="flex flex-col gap-4">

			{/* <h1 className="text-2xl font-semibold">Dashboard</h1> */}
			<div className="grid grid-cols-3 gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardDescription>Total Offices</CardDescription>
            <CardTitle>{overview?.offices}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vacant Rooms</CardDescription>
            <CardTitle>{overview?.vacantOffices}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Tenants</CardDescription>
            <CardTitle>{overview?.tenants}</CardTitle>
          </CardHeader>
        </Card>
        {/* <Card>
          <CardHeader>
            <CardDescription>Occupancy Rate</CardDescription>
            <CardTitle>85%</CardTitle>
          </CardHeader>
        </Card> */}
      </div>

			<h2 className="text-2xl font-semibold mb-4 text-center">Overview</h2>
			<div className="flex flex-wrap justify-center gap-8 px-12">
				{links.map((link) => (
					<Link key={link.href} href={link.href} className="max-w-[250px] w-full">
						<Card>
							<CardHeader>
								<CardDescription>{link.title}</CardDescription>
							</CardHeader>
							<CardContent className="flex justify-between">
								<CardTitle className="text-2xl">{overview?.[link.selector as keyof typeof overview]}</CardTitle>
								{link.icon}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}