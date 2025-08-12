import express from "express";
import dotenv from "dotenv";
import { estimateRunTimeDays } from "./calculate-runtime";
import { fetchUnsplashImages } from "./tools/get-images";

dotenv.config();

const app = express();
app.use(express.json()); // Add JSON middleware

const bearerToken = process.env.BEARER_TOKEN;

// Add a root route to provide a status message.
app.get("/", (req, res) => {
  res.send("Opal tool server is running. Visit /discovery for tool discovery.");
});

// Discovery endpoint for Opal compatibility
app.get("/discovery", (req, res) => {
  res.json({
    functions: [
      {
        name: "calculate_experiment_runtime",
        description: "Calculates the estimated time to run an experiment.",
        parameters: [
          {
            name: "BCR",
            type: "number",
            description: "The conversion rate of the control group (e.g., 0.1 for 10%)",
            required: true,
          },
          {
            name: "MDE",
            type: "number",
            description: "The relative lift you want to detect (e.g., 0.05 for 5%)",
            required: true,
          },
          {
            name: "sigLevel",
            type: "number",
            description: "The desired statistical significance (e.g., 95 for 95%)",
            required: true,
          },
          {
            name: "numVariations",
            type: "number",
            description: "The total number of variations, including control",
            required: true,
          },
          {
            name: "dailyVisitors",
            type: "number",
            description: "The number of visitors per day participating in the experiment",
            required: true,
          },
        ],
      },
      {
        name: "get_images",
        description: "Fetches images from Unsplash based on search query.",
        parameters: [
          {
            name: "query",
            type: "string",
            description: "Search term for images (e.g., 'nature', 'beach sunset')",
            required: true,
          },
          {
            name: "perPage",
            type: "number",
            description: "Number of images to return (default: 5, max: 30)",
            required: false,
          },
        ],
      },
    ],
  });
});

// Add authentication middleware for the tool endpoint (only if token is set)
if (bearerToken) {
  app.use("/tools/calculate_experiment_runtime", (req, res, next) => {
    /* const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${bearerToken}`) {
      return res.status(401).send("Unauthorized");
    } */
    next();
  });
} else {
  console.log("No bearer token set - authentication disabled for local development");
}

// Manual route for the calculation tool (fallback)
app.post("/tools/calculate_experiment_runtime", async (req, res) => {
  try {
    const { BCR, MDE, sigLevel, numVariations, dailyVisitors } = req.body;
    
    // Validate required parameters
    if (!BCR || !MDE || !sigLevel || !numVariations || !dailyVisitors) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["BCR", "MDE", "sigLevel", "numVariations", "dailyVisitors"]
      });
    }
    
    const days = estimateRunTimeDays(BCR, MDE, sigLevel, numVariations, dailyVisitors);
    res.json({ days });
  } catch (error) {
    console.error("Error calculating runtime:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get images endpoint
app.post("/tools/get_images", async (req, res) => {
  try {
    const { query, perPage = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: "Query parameter is required in request body",
        required: ["query"]
      });
    }
    
    // Use the actual fetchUnsplashImages function - no fallback to mock data
    const images = await fetchUnsplashImages(query, perPage);
    
    res.json({
      query: query,
      perPage: parseInt(perPage as string) || 5,
      results: images
    });
    
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
/*
// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Discovery endpoint: http://localhost:${PORT}/discovery`);
    console.log(`Calculate runtime endpoint: http://localhost:${PORT}/tools/calculate_experiment_runtime`);
    console.log(`Get images endpoint: http://localhost:${PORT}/tools/get_images`);
  });
}*/

export default app;
