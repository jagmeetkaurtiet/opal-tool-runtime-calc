import {
  ToolsService,
  tool,
  ParameterType,
} from "@optimizely-opal/opal-tools-sdk";
import express from "express";
import dotenv from "dotenv";
import { estimateRunTimeDays } from "./calculate-runtime";
import { fetchUnsplashImages } from "./fetch-unsplash";

dotenv.config();

const app = express();
app.use(express.json());

const toolsService = new ToolsService(app);
const bearerToken = process.env.BEARER_TOKEN;

// Root route
app.get("/", (req, res) => {
  res.send("Opal tool server is running. Visit /discovery for tool discovery.");
});

/* ------------------- Calculate Runtime Tool ------------------- */

type CalculateRuntimeParams = {
  BCR: number;
  MDE: number;
  sigLevel: number;
  numVariations: number;
  dailyVisitors: number;
};

async function calculateRuntime(
  params: CalculateRuntimeParams
): Promise<{ days: number | null }> {
  const { BCR, MDE, sigLevel, numVariations, dailyVisitors } = params;
  const days = estimateRunTimeDays(
    BCR,
    MDE,
    sigLevel,
    numVariations,
    dailyVisitors
  );
  return { days };
}

tool({
  name: "calculate_experiment_runtime",
  description: "Calculates the estimated time to run an experiment.",
  parameters: [
    { name: "BCR", type: ParameterType.Number, description: "Control group conversion rate (0.1 for 10%)", required: true },
    { name: "MDE", type: ParameterType.Number, description: "Relative lift to detect (0.05 for 5%)", required: true },
    { name: "sigLevel", type: ParameterType.Number, description: "Statistical significance (e.g., 95 for 95%)", required: true },
    { name: "numVariations", type: ParameterType.Number, description: "Total number of variations including control", required: true },
    { name: "dailyVisitors", type: ParameterType.Number, description: "Visitors per day in the experiment", required: true },
  ],
})(calculateRuntime);

// Local test route for runtime calculation
app.post("/tools/calculateRuntime", async (req, res) => {
  try {
    const result = await calculateRuntime(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------- Unsplash Tool ------------------- */

type UnsplashParams = {
  query: string;
  perPage?: number;
};

async function unsplashSearch(
  params: UnsplashParams
): Promise<{ images: any[] }> {
  const { query, perPage = 5 } = params;
  const images = await fetchUnsplashImages(query, perPage);
  return { images };
}

tool({
  name: "fetch_unsplash_images",
  description: "Fetches images from Unsplash based on a search query.",
  parameters: [
    { name: "query", type: ParameterType.String, description: "Search keyword", required: true },
    { name: "perPage", type: ParameterType.Number, description: "Number of images to return (default: 5)", required: false },
  ],
})(unsplashSearch);

// Local test route for Unsplash search
app.post("/tools/unsplashSearch", async (req, res) => {
  try {
    const result = await unsplashSearch(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------- Auth Middleware (optional) ------------------- */
if (bearerToken) {
  app.use("/tools", (req, res, next) => {
    const authHeader = req.headers.authorization;
    // Uncomment if you want to enforce auth
    // if (!authHeader || authHeader !== `Bearer ${bearerToken}`) {
    //   return res.status(401).send("Unauthorized");
    // }
    next();
  });
}

/* ------------------- Local Dev Server ------------------- */
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔍 Discovery endpoint: http://localhost:${PORT}/discovery`);
  });
}

export default app;
