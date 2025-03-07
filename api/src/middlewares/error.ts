import { NextFunction, Request, Response } from "express"
import logger from "../lib/logger"

export async function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	// logger.error(err.message)
	// logger.debug(err.stack)
	res.status(500).send("Internal server error")
}