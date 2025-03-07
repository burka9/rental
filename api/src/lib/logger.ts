import { createLogger, format, transports } from 'winston'
import { env } from './env';


const logger = createLogger({
	level: env.LOG_LEVEL,
	format: format.combine(
		format.timestamp(),
		format.json()
	),
	transports: [
		new transports.Console(),
		new transports.File({ filename: 'logs/error.log', level: 'error' }),
	]
})


export default logger