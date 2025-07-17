'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Loader2, FileSpreadsheet, Download, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TabType = 'text' | 'image' | 'powerpoint';

export default function TranslationPage() {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Image functionality
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // PowerPoint functionality
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [slideData, setSlideData] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [selectedSlides, setSelectedSlides] = useState<number[]>([]);
  const [showSlideSelector, setShowSlideSelector] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [currentSlideBeingTranslated, setCurrentSlideBeingTranslated] = useState<number | null>(null);
  
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!inputText.trim() || !selectedGeneration) {
      toast({
        title: "Missing Information",
        description: "Please enter text and select a generation type.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          generation: selectedGeneration,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
      
      toast({
        title: "Translation Complete",
        description: "Your content has been successfully translated!",
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Failed",
        description: "There was an error translating your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedGeneration) {
      toast({
        title: "Missing Generation Type",
        description: "Please select a generation type before uploading an image.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('generation', selectedGeneration);

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Image analysis failed');
      }

      const data = await response.json();
      setTranslatedText(data.result);
      
      toast({
        title: "Image Analysis Complete",
        description: "Text extracted and translated from your image!",
      });
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: "Image Analysis Failed",
        description: "There was an error analyzing your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // PowerPoint functionality
  const analyzeSlides = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "analyze");

      const response = await fetch("/api/translate-powerpoint", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("PowerPoint analysis failed");
      }

      const data = await response.json();
      setSlideData(data.slides);
      setTotalCost(data.totalCost);
      setSelectedSlides(data.slides.map((slide: any) => slide.slideNumber)); // Select all slides by default
      setShowSlideSelector(true);

      toast({
        title: "PowerPoint Analyzed",
        description: `Found ${data.totalSlides} slides with translatable content.`,
      });
    } catch (error) {
      console.error("PowerPoint analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your PowerPoint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePowerPointUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" || 
        file.type === "application/vnd.ms-powerpoint") {
      setUploadedFile(file);
      setTranslatedText('');
      setDownloadUrl('');
      setShowSlideSelector(false);
      setShowDropdown(false);
      setSlideData([]);
      setSelectedSlides([]);
      setTranslationProgress(0);
      setCurrentSlideBeingTranslated(null);
      
      // Analyze slides automatically
      await analyzeSlides(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid PowerPoint file (.pptx or .ppt).",
        variant: "destructive",
      });
    }
  };

  const handlePowerPointTranslate = async () => {
    if (!uploadedFile || !selectedGeneration || selectedSlides.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please upload a PowerPoint, select a generation, and choose slides to translate.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTranslationProgress(0);
    setCurrentSlideBeingTranslated(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("generationType", selectedGeneration); // Fixed: use generationType
      formData.append("selectedSlides", selectedSlides.join(","));
      formData.append("action", "translate");

      // Simulate progress tracking
      const totalSlides = selectedSlides.length;
      let currentSlide = 0;

      // Start progress simulation
      const progressInterval = setInterval(() => {
        if (currentSlide < totalSlides) {
          currentSlide++;
          setTranslationProgress((currentSlide / totalSlides) * 100);
          setCurrentSlideBeingTranslated(selectedSlides[currentSlide - 1]);
        }
      }, 1000);

      const response = await fetch("/api/translate-powerpoint", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setTranslationProgress(100);
      setCurrentSlideBeingTranslated(null);

      if (!response.ok) {
        throw new Error("PowerPoint translation failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);

      toast({
        title: "Translation Complete",
        description: "Your PowerPoint has been translated! Click download to get the file.",
      });
    } catch (error) {
      console.error("PowerPoint translation error:", error);
      toast({
        title: "Translation Failed",
        description: "There was an error translating your PowerPoint. Please try again.",
        variant: "destructive",
      });
      setTranslationProgress(0);
      setCurrentSlideBeingTranslated(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && uploadedFile) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `translated_${uploadedFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleSlideSelection = (slideNumber: number) => {
    setSelectedSlides(prev => 
      prev.includes(slideNumber)
        ? prev.filter(num => num !== slideNumber)
        : [...prev, slideNumber]
    );
  };

  const generationLabels = {
    'gen-z': 'Gen Z',
    'millennials': 'Millennials', 
    'boomers': 'Boomers',
  };

  const tabs = [
    { id: 'text' as TabType, label: 'Text Translation', icon: FileText },
    { id: 'image' as TabType, label: 'Image Translation', icon: Image },
    { id: 'powerpoint' as TabType, label: 'PowerPoint Translation', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-gray-400 text-sm">Translation Page</div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-orange-500">
            Home
          </Link>
          <Link href="/rating" className="text-gray-600 hover:text-orange-500">
            Rating
          </Link>
          <Link href="/translation" className="text-white bg-orange-500 px-4 py-2 rounded-full font-medium">
            Translation
          </Link>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Tab Slider */}
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-full p-1 flex">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'text-gray-600 hover:text-orange-500'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <p className="text-orange-500 text-lg">
              {activeTab === 'text' && "Translate your marketing content to align with the language and tone of a specific generation."}
              {activeTab === 'image' && "Upload an image with text content to extract and translate it for a specific generation."}
              {activeTab === 'powerpoint' && "Upload a PowerPoint presentation and translate all text content to align with a specific generation."}
            </p>
          </div>

          {/* Generation Selector and Action Button */}
          <div className="flex justify-center gap-4">
            <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
              <SelectTrigger className="w-48 bg-gray-200 border-0 rounded-full">
                <SelectValue placeholder="Generation Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(generationLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={
                activeTab === 'text' ? handleTranslate : 
                activeTab === 'powerpoint' ? handlePowerPointTranslate : 
                handleTranslate // For image tab, we handle the action differently
              }
              disabled={
                isLoading || 
                !selectedGeneration || 
                (activeTab === 'text' && !inputText.trim()) || 
                (activeTab === 'powerpoint' && !uploadedFile) ||
                (activeTab === 'image' && !imageFile)
              }
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {activeTab === 'text' ? 'Translating...' : 
                   activeTab === 'image' ? 'Analyzing...' : 'Translating...'}
                </>
              ) : (
                'Translate'
              )}
            </Button>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'text' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Original Content */}
              <div className="bg-gray-200 rounded-lg p-6">
                <div className="mb-2 text-sm text-gray-600 font-medium">Original Content</div>
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter your marketing content here..."
                  className="w-full h-80 border-0 bg-transparent resize-none text-gray-700"
                />
              </div>

              {/* Translated Content */}
              <div className="bg-gray-200 rounded-lg p-6">
                <div className="mb-2 text-sm text-gray-600 font-medium">
                  Translated Content
                  {selectedGeneration && (
                    <span className="ml-2 text-orange-500">
                      ({generationLabels[selectedGeneration as keyof typeof generationLabels]})
                    </span>
                  )}
                </div>
                <div className="h-80 overflow-y-auto text-gray-700 whitespace-pre-wrap">
                  {translatedText || "Translation will appear here..."}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Image Upload */}
              <div className="bg-gray-200 rounded-lg p-6">
                <div className="mb-2 text-sm text-gray-600 font-medium">Upload Image</div>
                <div className="flex items-center justify-center h-80">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isLoading}
                  />
                  <label 
                    htmlFor="image-upload" 
                    className={`cursor-pointer flex flex-col items-center gap-4 p-8 rounded-lg border-2 border-dashed transition-colors ${
                      isLoading 
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-orange-500 text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    <Upload className="w-12 h-12" />
                    <div className="text-center">
                      <div className="text-lg font-medium mb-2">
                        {imageFile ? imageFile.name : 'Upload Image'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Supports JPG, PNG, and other image formats
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Translated Content */}
              <div className="bg-gray-200 rounded-lg p-6">
                <div className="mb-2 text-sm text-gray-600 font-medium">
                  Extracted & Translated Content
                  {selectedGeneration && (
                    <span className="ml-2 text-orange-500">
                      ({generationLabels[selectedGeneration as keyof typeof generationLabels]})
                    </span>
                  )}
                </div>
                <div className="h-80 overflow-y-auto text-gray-700 whitespace-pre-wrap">
                  {translatedText || "Translation will appear here..."}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'powerpoint' && (
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* PowerPoint Upload & Controls */}
              <div className="bg-gray-200 rounded-lg p-6" style={{minHeight: '400px'}}>
                <div className="w-full h-full flex flex-col">
                  {/* File Upload Area */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-lg p-6 mb-4">
                    <input
                      type="file"
                      accept=".pptx,.ppt"
                      onChange={handlePowerPointUpload}
                      className="hidden"
                      id="powerpoint-upload"
                    />
                    <label htmlFor="powerpoint-upload" className="cursor-pointer text-center">
                      <div className="text-4xl mb-4">📄</div>
                      <div className="text-gray-600 text-lg mb-2">
                        {uploadedFile ? uploadedFile.name : "Click to upload PowerPoint"}
                      </div>
                      <div className="text-gray-500 text-sm">
                        Supports .pptx and .ppt files
                      </div>
                    </label>
                  </div>

                  {/* Slide Selector Dropdown */}
                  {uploadedFile && (
                    <div className="mt-4">
                      {showSlideSelector && slideData.length > 0 ? (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Select slides to translate:
                          </div>
                          <div className="relative">
                            <Button
                              type="button"
                              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg p-3 text-left flex items-center justify-between"
                              onClick={() => setShowDropdown(!showDropdown)}
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-medium">
                                  {selectedSlides.length} of {slideData.length} slides selected
                                </span>
                              </span>
                              <svg
                                className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                            
                            {showDropdown && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-gray-200 space-y-1">
                                  <button
                                    onClick={() => setSelectedSlides(slideData.map(slide => slide.slideNumber))}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm font-medium text-orange-600"
                                  >
                                    ✓ Select All Slides
                                  </button>
                                  <button
                                    onClick={() => setSelectedSlides([])}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm text-gray-600"
                                  >
                                    ✗ Clear All
                                  </button>
                                </div>
                                {slideData.map((slide) => (
                                  <div
                                    key={slide.slideNumber}
                                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                                      selectedSlides.includes(slide.slideNumber) ? 'bg-orange-50' : ''
                                    }`}
                                    onClick={() => toggleSlideSelection(slide.slideNumber)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedSlides.includes(slide.slideNumber)}
                                          onChange={() => toggleSlideSelection(slide.slideNumber)}
                                          className="w-4 h-4 text-orange-500 rounded"
                                        />
                                        <div>
                                          <div className="font-medium text-gray-800">
                                            Slide {slide.slideNumber}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {slide.wordCount} words
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                                      {slide.textPreview}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            {selectedSlides.length > 0 ? (
                              `Selected slides: ${selectedSlides.sort((a, b) => a - b).join(', ')}`
                            ) : (
                              'No slides selected'
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm text-blue-800">
                            {slideData.length === 0 ? 'Analyzing slides...' : 'Loading slide selector...'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!uploadedFile && (
                    <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
                      <div className="text-sm text-gray-600 mb-2">
                        📋 Upload a PowerPoint file to see slide selection options here
                      </div>
                      <div className="text-xs text-gray-500">
                        The dropdown will appear automatically after file analysis
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results & Download */}
              <div className="bg-gray-200 rounded-lg p-6" style={{minHeight: '400px'}}>
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {isLoading && activeTab === "powerpoint" ? (
                    <div className="text-center w-full">
                      <div className="text-4xl mb-4">🔄</div>
                      <div className="text-gray-600 text-lg mb-4">
                        Translating PowerPoint...
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full max-w-md mx-auto mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{Math.round(translationProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                          <div 
                            className="bg-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${translationProgress}%` }}
                          ></div>
                        </div>
                        {currentSlideBeingTranslated && (
                          <div className="text-sm text-gray-500 mt-2">
                            Currently translating slide {currentSlideBeingTranslated}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Please wait while we translate your slides...
                      </div>
                    </div>
                  ) : downloadUrl ? (
                    <div className="text-center">
                      <div className="text-4xl mb-4">✅</div>
                      <div className="text-gray-600 text-lg mb-4">
                        Translation completed!
                      </div>
                      <a
                        href={downloadUrl}
                        download={`translated_${uploadedFile?.name}`}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-lg inline-flex items-center gap-2"
                      >
                        📥 Download Translated PowerPoint
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-4">📊</div>
                      <div className="text-lg">
                        Translated PowerPoint will be available for download here
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}