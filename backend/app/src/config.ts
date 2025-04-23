import path from "path";

export const DOMAIN_NAME: string = process.env.DOMAIN_NAME as string;
export const PORT: number = Number(process.env.PORT);

export const DB_DIR: string = process.env.DB_DIR as string;
export const DB_PATH: string = process.env.DB_PATH as string;

export const JWT_SECRET: string = process.env.JWT_SECRET as string;

export const EMAIL_USER: string = process.env.EMAIL_USER as string;
export const EMAIL_PASS: string = process.env.EMAIL_PASS as string;

export const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID as string;
export const GOOGLE_CLIENT_SECRET: string = process.env.GOOGLE_CLIENT_SECRET as string;

export const NODE_ENV: string = process.env.NODE_ENV as string;

export const ASSETS_PATH: string = path.resolve(__dirname, "../assets/");

