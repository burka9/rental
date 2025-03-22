import { DataSource } from "typeorm";
import { env } from "./lib/env";

export const Database = new DataSource({
	type: env.DB_TYPE as "mysql" | "postgres",
	url: env.DB_URL,
	// logging: true,

//	dropSchema: true,
//	synchronize: true,

	entities: [
		env.NODE_ENV === "production"
			? "dist/entities/**/*.entity.js"
			: "src/entities/**/*.entity.ts"
	],
})