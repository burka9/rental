import 'dotenv/config'
import Axios from 'axios'


const API_URL = process.env.API_URL ?? 'http://localhost:4000'
const baseURL = `${API_URL}`

export const axios = Axios.create({
	baseURL,
	withCredentials: true
})