import Link from "next/link";
import { ArrowRight, Search, FileSpreadsheet, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Keyword Analysis Tool
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Analyze keyword relevance and performance for your products
          </p>
          <Link
            href="/keyword-analysis"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Product Input</h3>
            <p className="text-gray-600">
              Enter product details using ASIN + country code or product description
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">CSV Upload</h3>
            <p className="text-gray-600">
              Upload your keywords list with automatic column detection
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Analysis & Export</h3>
            <p className="text-gray-600">
              Get detailed analysis and export results to CSV or Excel
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <ol className="text-left inline-block space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
              <span>Enter your product information using ASIN or description</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
              <span>Upload a CSV file with your keywords list</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">3</span>
              <span>Wait for the analysis to complete (30-60 seconds)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">4</span>
              <span>View results and export to CSV or Excel</span>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}