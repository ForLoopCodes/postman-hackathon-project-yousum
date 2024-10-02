const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = 3000;
app.use(cors());
// Middleware to parse JSON bodies
app.use(
  express.json({
    strict: false,
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf.toString());
      } catch (err) {
        req.isJsonError = true;
      }
    },
  })
);

// Function to format the JSON data into the desired output
function formatTranscript(transcript) {
  return transcript
    .map((entry) => {
      return `start: ${entry.start}; duration: ${entry.duration.toFixed(
        2
      )}; text: "${entry.text}";`;
    })
    .join("\n");
}

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to summarize content using AI API
async function summarizeContent(content, userInput) {
  const data = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `!![DO NOT GIVE RESPONSES WHICH REPEAT THE INPUT, JUST GIVE THE OUTPUT STRAIGHT TO THE POINT]!! Based on the following transcript, please create bullet points, summarize each point, and include timestamps in hours min and sec. focus on this User Input: ${userInput} and subtitles: 😄\n\n${content}\n\n`,
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
    return response.data; // Adjust based on the actual response structure
  } catch (error) {
    throw new Error("Failed to summarize content: " + error.message);
  }
}

// REST API endpoint
app.post("/translate", async (req, res) => {
  if (req.isJsonError) {
    return res.status(400).json({ error: "Invalid JSON format" });
  }

  const { videoUrl, userInput } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "YouTube video URL is required" });
  }

  if (!userInput) {
    return res.status(400).json({ error: "User input is required" });
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return res.status(400).json({ error: "Invalid YouTube video URL" });
  }

  try {
    // Make a GET request to fetch the transcript
    const response = await axios.get(
      `http://127.0.0.1:5000/transcript?video_id=${videoId}`
    );

    // Format the response
    const formattedTranscript = formatTranscript(response.data.transcript);

    // Summarize the formatted transcript using AI API
    const summary = await summarizeContent(formattedTranscript, userInput);

    // Send the formatted transcript and summary
    res.json({
      transcript: formattedTranscript,
      summary: summary, // Adjust based on the response structure
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to fetch transcript or summarize content" });
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
