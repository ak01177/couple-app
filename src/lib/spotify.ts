export function getSpotifyEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's a Spotify URL
    if (parsedUrl.hostname === 'open.spotify.com') {
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      
      // We expect at least type (track/album/playlist) and id
      if (pathParts.length >= 2) {
        const type = pathParts[0]; // e.g. 'track', 'album', 'playlist'
        const id = pathParts[1];
        
        return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
      }
    }
  } catch (e) {
    // Invalid URL
    return null;
  }
  
  return null;
}
