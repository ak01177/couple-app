"use server";

export async function getPosterUrl(title: string, type: "movie" | "show"): Promise<string | null> {
  try {
    const omdbType = type === 'show' ? 'series' : 'movie';
    const apiKey = "3835aee4";
    const res = await fetch(`http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(title)}&type=${omdbType}`);

    if (!res.ok) {
      console.error("OMDB API returned status:", res.status);
      return null;
    }

    const data = await res.json();

    if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
      // Return high-res artwork if available, OMDB usually gives SX300, we can remove SX300 to get full size if we want
      // but SX300 is perfectly fine for thumbnails!
      return data.Poster;
    }

    return null;
  } catch (error) {
    console.error("Error fetching poster server-side:", error);
    return null;
  }
}
