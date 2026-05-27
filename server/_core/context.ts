import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifySession } from "../db-auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Önce local auth token'ı kontrol et
    const cookies = opts.req.headers.cookie;
    console.log('[Context] Cookies:', cookies ? 'present' : 'none');
    
    if (cookies) {
      const authTokenMatch = cookies.match(/auth_token=([^;]+)/);
      if (authTokenMatch && authTokenMatch[1]) {
        const token = authTokenMatch[1];
        console.log('[Context] Auth token found, verifying...');
        
        const sessionUser = await verifySession(token);
        console.log('[Context] Session user:', sessionUser ? `ID ${sessionUser.id}` : 'null');
        
        if (sessionUser) {
          user = sessionUser;
          console.log('[Context] User authenticated via local session');
          return {
            req: opts.req,
            res: opts.res,
            user,
          };
        }
      } else {
        console.log('[Context] No auth_token in cookies');
      }
    } else {
      console.log('[Context] No cookies found');
    }
    
    // Local auth başarısız olursa OAuth'u dene
    console.log('[Context] Trying OAuth authentication...');
    user = await sdk.authenticateRequest(opts.req);
    if (user) {
      console.log('[Context] User authenticated via OAuth');
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error('[Context] Authentication error:', error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
