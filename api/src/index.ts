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
import { main } from "./test";

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
app.use(cors())


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
		// main()
	})
	.catch((err: Error) => {
		logger.error(err)
	})