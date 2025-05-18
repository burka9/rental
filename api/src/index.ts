import express from "express";
import { createServer } from "http";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import routes from "./routes";
import { env } from "./lib/env";
import logger from "./lib/logger";
import { Database } from "./db";
import { errorHandler } from "./middlewares/error";
import 'express-async-errors'
import { Server } from "socket.io";
import handleSocket from "./socket";
import { User } from "./entities/User.entity";
import { hashSync } from "bcrypt";
import { ROLES } from "./entities/User.entity";
import { resolve } from "path";

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(morgan('combined', {
	stream: {
		write: (message: string) => {
			logger.info(message.trim());
		},
	}
}))
app.use(cors({
	origin: [env.FRONTEND_URL],
	credentials: true
}))


// temporary
app.use('/uploads', express.static(resolve(__dirname, '../uploads')))



// TODO: Add error handling middleware
app.use(errorHandler)


app.use('/', routes())



const server = createServer(app)
const HOST = env.SERVER_HOST
let PORT = env.SERVER_PORT

server.on("error", (err) => {
	if (err.message.includes("EADDRINUSE")) {
		PORT++
		server.listen(PORT)
	}
})


Database.initialize()
	.then(() => {
		logger.info("Database connected")
		server.listen(PORT, () => {
			logger.info(`Server is running on ${HOST}:${PORT}`)
		})

		// init default admin
		const userRepository = Database.getRepository(User)
		return userRepository.create([
			{
				phone: 'admin',
				password: hashSync('admin', 10),
				role: ROLES.SUPERADMIN
			},
			{
				phone: 'b1',
				password: hashSync('admin', 10),
				role: ROLES.BUILDING_ADMIN,
				buildingId: 1,
			},
			{
				phone: 'b2',
				password: hashSync('admin', 10),
				role: ROLES.BUILDING_ADMIN,
				buildingId: 2,
			},
			{
				phone: 'b3',
				password: hashSync('admin', 10),
				role: ROLES.BUILDING_ADMIN,
				buildingId: 3,
			},
			{
				phone: 'finance',
				password: hashSync('admin', 10),
				role: ROLES.FINANCE_ADMIN
			},
			{
				phone: 'board',
				password: hashSync('admin', 10),
				role: ROLES.BOARD_MEMBER
			},
		])
	})
	.then(async users => {
		const userRepository = Database.getRepository(User)
		
		for await (const user of users) try {
			await userRepository.save(user)
		} catch {}
	})
	.then(() => console.log('done'))
	.catch((err: Error) => {
		console.log(err)
		logger.error(err)
	})


const io = new Server(server)

io.on('connection', (socket) => {
	handleSocket(socket)
})

export { io }
