import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { links } from "./sidebar";

export default function Home() {
	return (
		<div className="flex flex-col gap-4">

			{/* <h1 className="text-2xl font-semibold">Dashboard</h1> */}
			<div className="grid grid-cols-3 gap-8 mb-10">
        <Card>
          <CardHeader>
            <CardDescription>Total Rent</CardDescription>
            <CardTitle>ETB 182,412</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vacant Rooms</CardDescription>
            <CardTitle>9</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Tenants</CardDescription>
            <CardTitle>148</CardTitle>
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
								<CardTitle className="text-2xl">{link.data}</CardTitle>
								{link.icon}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	)
}