import { cn } from "@/lib/utils";
import { Geist, Geist_Mono } from "next/font/google";
import AppSidebar from "./components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import RoleGuard from "@/components/role-guard";
// import AppNavbar from "./components/navbar";
// import Loading from "@/components/loading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (<RoleGuard>

		<SidebarProvider className={cn(
			geistSans.variable,
			geistMono.variable,
			'antialiased',
			'flex'
		)}>
			<AppSidebar />

      {/* <Loading /> */}

			<main className='bg-gray-100 flex flex-col grow'>
        {/* <AppNavbar /> */}
        <div className="grow m-8">
          {children}
        </div>
      </main>
		</SidebarProvider>
  </RoleGuard>
  );
}