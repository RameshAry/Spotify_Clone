import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import spotifyApi from "../lib/spotify";
import SpotifyWebApi from "spotify-web-api-node";



function useSpotify() {
    const {data: session, status} = useSession();
    useEffect(()=> {
        if(session){
            // if the error is access token error the redirect to the signin 
            if(session.error === 'RefreshAccessTokenError'){
                signIn();
            }
            spotifyApi.setAccessToken(session.user.accessToken);
        }
    }, [session]);
    return spotifyApi;
}

export default useSpotify;