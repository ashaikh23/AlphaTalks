import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="text-gray-400 text-sm">Home Page</div>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-white bg-orange-500 px-4 py-2 rounded-full font-medium">
            Home
          </Link>
          <Link href="/rating" className="text-gray-600 hover:text-orange-500">
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

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-orange-500 leading-tight">
                ALPHA
                <br />
                TALKS
              </h1>
              <p className="text-xl text-orange-500 font-bold">An innovative way to connect generations!</p>
            </div>

            <p className="text-orange-500 text-lg leading-relaxed max-w-md">
              AlphaTalks analyzes your marketing content to show how much of it aligns with Gen Alpha's preferences, and
              even helps you adapt it for better impact.
            </p>

            <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full text-lg">
              Learn More
            </Button>
          </div>

          {/* Right Illustration */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
                <img src="/statistics.png"
                  alt="Statistics Illustration"
                  className="w-full h-auto rounded-lg shadow-lg"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}