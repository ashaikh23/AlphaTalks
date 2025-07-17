"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { useState } from "react"

export default function RatingPage() {

const generationNames: Record<string, string> = {
    "gen-z": "Generation Z",
    "millennial": "Millennial",
    "boomers": "Baby Boomer",
  }

  const [generation, setGeneration] = useState("");
  const [textInput, setTextInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    console.log("Selected Generation:", generation);
    console.log("Text Input:", textInput);
    try {
      const res = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation,
          content: textInput,
        }),
      });

      const data = await res.json();
      setResult(data.similarity);
      console.log("Response from backend:", data.similarity);
    } catch (err) {
      console.error("Error calling backend:", err);
      setResult("Error processing request.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileText = event.target?.result as string;
      setTextInput(fileText || "");
    };
    reader.readAsText(file);
  };






  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-gray-400 text-sm">Rating Page</div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-orange-500">
            Home
          </Link>
          <Link href="/rating" className="text-white bg-orange-500 px-4 py-2 rounded-full font-medium">
            Rating
          </Link>
          <Link href="/translation" className="text-gray-600 hover:text-orange-500">
            Translation
          </Link>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-orange-500 text-lg leading-relaxed">
                Find out what percentage of your marketing content aligns with the language and tone of a specific
                generation.
              </p>

              <div className="flex items-center gap-4">
                <Select onValueChange={(value) => setGeneration(value)}>
                  <SelectTrigger className="w-48 bg-gray-200 border-0 rounded-full">
                    <SelectValue placeholder="Generation Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(generationNames).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                onClick={handleSubmit}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg">
                  Analyze
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200"
              />
              <div className="bg-gray-200 rounded-lg p-6 h-80">
                <Textarea
                  placeholder="..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-full border-0 bg-transparent resize-none text-gray-600 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Right Section - Results */}
          <div className="bg-orange-500 rounded-2xl p-8 text-white flex items-center justify-center">
            {loading ? (
              // Show spinner when loading
              <svg className="animate-spin h-12 w-12 text-white" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : result ? (
              // Show result if available
              <div className="space-y-4 text-center">
                <div className="text-8xl font-bold">{result}%</div>
                <p className="text-lg">
                  of your marketing content matches the slang used by{" "}
                  <span className="font-semibold">
                    {generationNames[generation] || "the selected generation"}
                  </span>
                </p>
              </div>
            ) : (
              // Default message before analysis
              <p className="text-lg text-center">
                Pick your generation and add your text, then click <span className="font-semibold">Analyze</span>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

