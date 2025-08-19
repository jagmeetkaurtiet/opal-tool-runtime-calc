require('dotenv').config();

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function fetchUnsplashImages(query: string, count: number = 5) {
  if (!query) throw new Error("Query parameter is required");

  const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
    query
  )}&count=${count}&orientation=landscape`;

  try {
    const fetchFunction = globalThis.fetch || require('node-fetch');
    const response = await fetchFunction(url, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.errors ? errorData.errors.join(", ") : "Error fetching random images"
      );
    }

    const data = await response.json();

    // Normalize whether it's array or single object
    const results = Array.isArray(data) ? data : [data];

    return results.map((img: any) => ({
      id: img.id,
      thumbUrl: img.urls.thumb,
      previewUrl: img.urls.small,
      fullUrl: img.urls.regular,
      photographer: img.user.name,
      photographerProfile: img.user.links.html,
      description: img.alt_description || "Unsplash Image",
    }));
  } catch (error) {
    console.error("Error fetching random Unsplash images:", error);
    throw error;
  }
}

export { fetchUnsplashImages };
