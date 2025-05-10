import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  email: string;
  name: string;
  iat: number;
  exp: number;
};

export function getUserInfoFromToken(): { email: string; name: string } | null {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return { email: decoded.email, name: decoded.name };
  } catch (error: any) {
    console.error("Invalid JWT", error);
    return null;
  }
}
