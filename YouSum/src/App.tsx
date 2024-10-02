import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent } from "@/components/ui/card"; // Import the ShadCN Card component
import "./App.css";
import { ThemeProvider } from "@/components/theme-provider";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [depth, setDepth] = useState(5);
  const [summarizationStyle, setSummarizationStyle] = useState(
    "I prefer a summary that is brief yet informative, focusing on the main arguments and essential details without unnecessary fluff. Aim for clarity and simplicity."
  );
  const [results, setResults] = useState([]);
  const [finalSummary, setFinalSummary] = useState("");
  const [progress, setProgress] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [noResults, setNoResults] = useState(false); // New state for no results

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleDepthChange = (event) => {
    setDepth(event.target.value);
  };

  const handleSummarizationChange = (event) => {
    setSummarizationStyle(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    setResults([]);
    setFinalSummary("");
    setProgress("Extracting videos...");
    setIsVisible(false);
    setCurrentVideo(0);
    setTotalVideos(0);
    setOverallProgress(0);
    setNoResults(false); // Reset no results state

    try {
      const response = await fetch(
        `http://localhost:3002/search?query=${inputValue}&n=${depth}`
      );
      const links = await response.json();
      setTotalVideos(links.length);
      setProgress(`Found ${links.length} videos. Processing...`);
      setOverallProgress(25);

      if (links.length === 0) {
        setNoResults(true); // Set no results if there are no links
        return; // Exit early
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      const resultsArray = await Promise.all(
        links.map(async (link, index) => {
          setCurrentVideo(index + 1);
          setProgress(`Processing your videos...`);
          setOverallProgress(50);

          const apiResponse = await fetch(`http://localhost:3000/translate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              videoUrl: link,
              userInput: summarizationStyle,
            }),
          });
          return apiResponse.json();
        })
      );

      const summarizedResults = resultsArray
        .map(
          (result) => result.summary?.candidates?.[0]?.content?.parts[0]?.text
        )
        .filter(Boolean);

      setResults(summarizedResults);

      const summaryPayload = {
        searchTerm: inputValue,
        depth: depth === 5 ? "high" : "low",
        summarizationStyle: summarizationStyle,
        summaries: summarizedResults.map((content, index) => ({
          title: `Summary ${index + 1}`,
          content: content,
        })),
      };

      setProgress("Summarizing all into one...");
      setOverallProgress(75);

      const summaryResponse = await fetch(`http://localhost:3003/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(summaryPayload),
      });

      const summaryResult = await summaryResponse.json();
      setFinalSummary(summaryResult.summary);
      setProgress("Done!");
      setOverallProgress(100);
      setIsVisible(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setProgress("Error fetching data.");
      setOverallProgress(0);
    }
  };

  // Check if all fields are filled
  const isFormValid = () => {
    return inputValue && depth && summarizationStyle;
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="w-screen h-full flex flex-col justify-start items-start">
        <div className="w-full flex justify-center items-start content-start gap-20">
          <div className="w-1/4 text-start mt-16">
            <div className="flex w-full p-4 mb-5 gap-5 rounded-lg border-2 items-center content-center border-neutral-300 border-dashed">
              <p className="text-4xl mx-2">✨</p>
              <div className="flex flex-col">
                <div className="text-xl font-medium text-neutral-300 bg-gradient-to-r from-yellow-400 to-red-600 inline-block text-transparent bg-clip-text">
                  YouSum
                </div>
                <div className="text-xs mt-1 font-medium text-neutral-300 bg-gradient-to-r from-neutral-100 to-neutral-200 inline-block text-transparent bg-clip-text">
                  YouSum - Your AI-Based YouTube Content Summarizer and Tutor.
                </div>
              </div>
            </div>
            <h3 className="text-xs font-medium opacity-70">
              YOUR SEARCH QUERY:
            </h3>
            <Input
              size="sm"
              className="w-full mt-2 border-neutral-500"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={"Chess tutorial"}
            />
            <h3 className="text-xs font-medium opacity-70 mt-4">
              DEPTH: (MORE DEPTH, MORE ACCURATE, MORE SLOWER)
            </h3>
            <Input
              type="number"
              size="sm"
              className="w-full mt-2 border-neutral-500"
              value={depth}
              onChange={handleDepthChange}
              onKeyPress={handleKeyPress}
            />
            <h3 className="text-xs font-medium opacity-70 mt-4">
              CUSTOM SUMMARIZATION STYLE:
            </h3>
            <Textarea
              size="sm"
              className="w-full mt-2 border-neutral-500 no-scrollbar min-h-40"
              value={summarizationStyle}
              onChange={handleSummarizationChange}
              onKeyPress={handleKeyPress}
              placeholder={"Enter your custom summarization style here."}
            />
            <Button
              onClick={handleSearch}
              disabled={!isFormValid()} // Disable button if form is not valid
              className="mt-4 w-full text-xs bg-white text-black hover:bg-neutral-200 text-black"
            >
              {"GO ->"}
            </Button>
          </div>
          <div className="w-1/2 pt-8 h-screen overflow-x-hidden overflow-y-scroll no-scrollbar">
            {!progress && !finalSummary && !noResults && (
              <div className="mt-4 p-2">
                <h4 className="font-medium opacity-70 text-xs">
                  YOUR SEARCH RESULTS WILL BE SHOWN HERE
                </h4>
                <p className="font-semibold text-neutral-200">{progress}</p>
              </div>
            )}
            {progress && !finalSummary && (
              <div className="mt-4 p-2">
                <h4 className="font-medium opacity-70 text-xs">
                  PROCESSING YOUR RESULTS
                </h4>

                {progress == "Done!" && results.length == 0 ? (
                  <div className="mt-4">
                    <h4 className="font-medium text-neutral-300 text-sm">
                      Oops! Seems like our AI can't watch relevant videos.
                    </h4>
                    <p className="text-sm text-neutral-300 mt-1 pb-3">
                      Please try using a different depth or search term.
                    </p>
                  </div>
                ) : (
                  <h4 className="font-medium opacity-100 mt-3 mb-2 text-sm">
                    {progress}
                  </h4>
                )}
                <Progress value={overallProgress} className="mt-2" />
                <div className="grid grid-cols-3 gap-5 mt-10">
                  {results.map((result, index) => (
                    <Card
                      key={index}
                      className={`mb-2 bg-black rounded-xl text-neutral-300 text-xs border-neutral-500 border-2 border-dashed fade-in ${
                        isVisible ? "show" : ""
                      } opacity-30`} // Add some margin between cards
                    >
                      <CardHeader>{`Result for Video #${
                        index + 1
                      }`}</CardHeader>
                      <CardContent>
                        {result.length > 1000
                          ? `${result.slice(0, 1000)}...`
                          : result}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {finalSummary && (
              <div
                className={`p-4 pt-0 block fade-in ${isVisible ? "show" : ""}`}
              >
                <div className="markd mb-20">
                  <ReactMarkdown>
                    {`# Final Summary: \n` + finalSummary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
