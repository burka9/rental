import Axios from 'axios'


const API_URL = process.env.API_URL ?? 'http://116.203.217.208:4000'
const baseURL = `${API_URL}`

export const axios = Axios.create({
	baseURL,
})