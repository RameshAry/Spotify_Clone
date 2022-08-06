import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import spotifyApi, { LOGIN_URL } from "../../../lib/spotify";

async function refreshAccessToken(token){
    try{
        spotifyApi.setAccessToken(token.accessToken);
        spotifyApi.setRefreshToken(token.refreshToken);
        const { body: refreshedToken } = await spotifyApi.refreshAccessToken();
        console.log(refreshedToken, "This is refreshed token")

        return{
            ...token,
            accessToken: refreshedToken.access_token,
            // 1 hour as 3600 returns from spotify api
            accessTokenExpires: Date.now + refreshedToken.expires_in * 1000,
            // replace if new one came back else fall back in old refresh token
            refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
        }

    }catch(error){
        console.log(error, "there has been the error")

        return{
            ...token,
            error: "RefreshAccessTokenError"
        }
    }
}
export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
    // ...add more providers here
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }){
        // if it was a intial signin
        if(account && user){
            return{
                ...token,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                username: account.providerAccountId,
                accessTokenExpires: account.expires_at * 1000,
            }
        }

        if(Date.now() < token.accessTokenExpires){
            console.log("Existing token is valid")
            return token;
        }

        // if the access token expires and we need to refresh it
        console.log("Existing token is not valid");
        return await refreshAccessToken(token);
    },
    async session({ session, token }){
        session.user.accessToken = token.accessToken;
        session.user.refreshToken = token.refreshToken;
        session.user.username = token.username;

        return session;
    },
  },

})