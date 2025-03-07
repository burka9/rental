import { cn } from "@/lib/utils";
import { Geist, Geist_Mono } from "next/font/google";
import AppSidebar from "./components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppNavbar from "./components/navbar";

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
  return (
		<SidebarProvider className={cn(
			geistSans.variable,
			geistMono.variable,
			'antialiased',
			'flex'
		)}>
			<AppSidebar />

			<main className='bg-white flex flex-col grow'>
        <AppNavbar />
        <div className="grow m-8">
          {children}
        </div>
      </main>
		</SidebarProvider>
  );
}