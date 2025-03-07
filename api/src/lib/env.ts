import 'dotenv/config';

export const env = {
	NODE_ENV: process.env.NODE_ENV || "development",
	SERVER_HOST: process.env.HOST || "localhost",
	SERVER_PORT: Number(process.env.PORT || "4000"),
	DB_TYPE: process.env.DB_TYPE || "mysql",
	DB_URL: process.env.DB_URL || "mysql://root:password@localhost:3306/rental_app",
	LOG_LEVEL: process.env.LOG_LEVEL || "info"
}