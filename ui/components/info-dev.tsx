import { axios } from "@/lib/axios";

export default function InfoDev() {
	return (
		<div className="bg-black text-white">
			{axios.defaults.baseURL}
		</div>
	)
}