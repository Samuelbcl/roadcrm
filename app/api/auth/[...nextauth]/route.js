import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.AZURE_AD_TENANT_ID || "common",
      authorization: {
        params: {
          scope: "openid email profile offline_access Calendars.ReadWrite",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (account.provider === "google") {
          token.googleAccessToken = account.access_token;
          token.googleRefreshToken = account.refresh_token;
          token.googleExpiresAt = account.expires_at;
        } else if (account.provider === "azure-ad") {
          token.microsoftAccessToken = account.access_token;
          token.microsoftRefreshToken = account.refresh_token;
          token.microsoftExpiresAt = account.expires_at;
        }
        // Keep backward compat: accessToken = token of the provider used to sign in
        token.accessToken = account.access_token;
        if (!token.primaryProvider) token.primaryProvider = account.provider;
      }

      // Refresh Google token if expired
      if (token.googleAccessToken && token.googleExpiresAt && Date.now() / 1000 > token.googleExpiresAt) {
        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID,
              client_secret: process.env.GOOGLE_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: token.googleRefreshToken,
            }),
          });
          const data = await res.json();
          if (data.access_token) {
            token.googleAccessToken = data.access_token;
            token.googleExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
          }
        } catch (err) {
          console.error("Google token refresh error:", err);
        }
      }

      // Refresh Microsoft token if expired
      if (token.microsoftAccessToken && token.microsoftExpiresAt && Date.now() / 1000 > token.microsoftExpiresAt) {
        try {
          const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.AZURE_AD_CLIENT_ID,
              client_secret: process.env.AZURE_AD_CLIENT_SECRET,
              grant_type: "refresh_token",
              refresh_token: token.microsoftRefreshToken,
              scope: "openid email profile offline_access Calendars.ReadWrite",
            }),
          });
          const data = await res.json();
          if (data.access_token) {
            token.microsoftAccessToken = data.access_token;
            token.microsoftExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
            if (data.refresh_token) token.microsoftRefreshToken = data.refresh_token;
          }
        } catch (err) {
          console.error("Microsoft token refresh error:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.googleAccessToken = token.googleAccessToken || null;
      session.microsoftAccessToken = token.microsoftAccessToken || null;
      session.provider = token.primaryProvider;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
