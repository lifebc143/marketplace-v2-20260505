import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// 友好的錯誤頁面 HTML
function getErrorPageHTML(title: string, message: string, showRetry: boolean = false): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin: 0 0 16px 0;
          font-size: 24px;
        }
        p {
          color: #666;
          margin: 0 0 24px 0;
          line-height: 1.6;
        }
        .button-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        a, button {
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: #667eea;
          color: white;
        }
        .btn-primary:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        .btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        .btn-secondary:hover {
          background: #e0e0e0;
          transform: translateY(-2px);
        }
        .error-code {
          background: #f5f5f5;
          border-left: 4px solid #667eea;
          padding: 12px;
          margin: 20px 0;
          text-align: left;
          font-family: monospace;
          font-size: 12px;
          color: #666;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>⚠️ ${title}</h1>
        <p>${message}</p>
        <div class="button-group">
          <a href="/" class="btn-primary">Return to Home</a>
          ${showRetry ? '<a href="/" class="btn-secondary">Try Again</a>' : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      return res.status(400).send(
        getErrorPageHTML(
          "Authentication Error",
          "Missing authentication parameters. Please try logging in again."
        )
      );
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        return res.status(400).send(
          getErrorPageHTML(
            "Authentication Error",
            "Failed to retrieve user information from the authentication provider. Please try again."
          )
        );
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date().toISOString(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      // 清除舊的 Cookie，然後設置新的 Cookie
      res.clearCookie(COOKIE_NAME, { path: "/" });
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // 根據錯誤類型提供不同的提示
      let userMessage = "An error occurred during authentication. Please try again.";
      
      if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
        userMessage = "Authentication was denied. This might be a temporary issue. Please try again in a few moments.";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("ETIMEDOUT")) {
        userMessage = "The authentication service took too long to respond. Please try again.";
      } else if (errorMessage.includes("network") || errorMessage.includes("ECONNREFUSED")) {
        userMessage = "Network error occurred. Please check your connection and try again.";
      }

      return res.status(500).send(
        getErrorPageHTML(
          "Authentication Failed",
          userMessage,
          true
        )
      );
    }
  });
}
