const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3002;
const API_KEY = "AIzaSyDTscQDQ_kTo5xs_fnC76k07jZy2jQx5BE"; //"AIzaSyDjg-yzxF7_n5bzWr_a-4gdVummnk-5SCg";

// Function to search YouTube
async function searchYouTube(query, maxResults) {
  const url = `https://www.googleapis.com/youtube/v3/search`;
  const params = {
    part: "snippet",
    q: query,
    maxResults: maxResults,
    type: "video",
    key: API_KEY,
  };

  try {
    const response = await axios.get(url, { params });
    const videos = response.data.items;

    // Extract video links
    const videoLinks = videos.map((video) => {
      return `https://www.youtube.com/watch?v=${video.id.videoId}`;
    });

    return videoLinks;
  } catch (error) {
    console.error("Error fetching data from YouTube API:", error);
    throw new Error("YouTube API error");
  }
}

// Create a REST endpoint
app.get("/search", async (req, res) => {
  const { query, n } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  // Validate the 'n' parameter
  const maxResults = Math.min(Math.max(parseInt(n, 10) || 5, 1), 50); // Ensure it's between 1 and 50

  try {
    const videoLinks = await searchYouTube(query, maxResults);
    return res.json(videoLinks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
