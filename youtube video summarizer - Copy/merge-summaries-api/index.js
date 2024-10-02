const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

// Function to create a comprehensive summary with explanations
async function createComprehensiveSummary(
  searchTerm,
  depth,
  summarizationStyle,
  summaries
) {
  // Constructing the summaries string using a loop and JSON.stringify
  let summariesText = "";
  for (const summary of summaries) {
    summariesText += `${JSON.stringify(summary)}\n`; // Convert each summary to a string
  }

  const data = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Given the search term "${searchTerm}", please summarize the following points into a concise way, it should not look like only timestamps and things, extract all important knowledge from it. Emphasize key takeaways and provide explanations for each point based on the depth of "${depth}" and style "${summarizationStyle}":\n\n${summariesText}\n\n`,
          },
        ],
      },
    ],
  });

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyALA8VWwXGHeW_pGyTCyBsx72z9PF1Cz-0",
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);

    // Extracting only the text content
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates.length > 0
    ) {
      return response.data.candidates[0].content.parts[0].text; // Get only the text
    } else {
      throw new Error("Unexpected response structure");
    }
  } catch (error) {
    throw new Error("Failed to generate summary: " + error.message);
  }
}

// REST API endpoint
app.post("/summarize", async (req, res) => {
  const { searchTerm, depth, summarizationStyle, summaries } = req.body;

  // Input validation
  if (
    !searchTerm ||
    !depth ||
    !summarizationStyle ||
    !Array.isArray(summaries) ||
    summaries.length === 0
  ) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const comprehensiveSummary = await createComprehensiveSummary(
      searchTerm,
      depth,
      summarizationStyle,
      summaries
    );

    res.json({
      summary: comprehensiveSummary,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to create summary: " + error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }
  next();
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
