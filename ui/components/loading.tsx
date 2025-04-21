'use client'
import { useStore } from "@/lib/store";
import { ClipLoader } from "react-spinners";

export default function Loading() {
	const { loadingPage } = useStore()
	
	return loadingPage ? (
		<div className="h-screen w-screen flex items-center justify-center fixed top-0 left-0 bg-black/20 z-[999] backdrop-blur-[1px]">
			<ClipLoader
				color={"#3f3f46"}
				loading={loadingPage}
				size={150}
				aria-label="Loading Spinner"
				data-testid="loader"
			/>
		</div>
	) : <></>
}