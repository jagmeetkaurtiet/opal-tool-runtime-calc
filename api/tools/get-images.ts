require('dotenv').config();

const ACCESS_KEY =process.env.UNSPLASH_ACCESS_KEY ;
async function fetchUnsplashImages(query: string, perPage: number = 5) {
  if (!query) throw new Error("Query parameter is required");
  
 

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  try {
    // Use global fetch if available (Node.js 18+), otherwise fallback to node-fetch
    const fetchFunction = globalThis.fetch || require('node-fetch');
    const response = await fetchFunction(url, {
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors ? errorData.errors.join(", ") : "Error fetching images");
    }

    const data = await response.json();

    // Map to desired format
    return data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      photographer: img.user.name,
      description: img.alt_description,
    }));
  } catch (error) {
    console.error("Error fetching from Unsplash:", error);
    throw error;
  }
}

export { fetchUnsplashImages };


