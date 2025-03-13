"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileUp, Download, Check, Moon, Sun, Database, FileText } from "lucide-react"

// Sample data for the "Try with sample data" feature
const sampleData = {
  reviews: [
    {
      reviewer: { displayName: "Sample User 1" },
      starRating: "FIVE",
      comment: "Great service!",
      createTime: "2025-02-15T07:45:54.637925Z",
    },
    {
      reviewer: { displayName: "Sample User 2" },
      starRating: "FOUR",
      comment: "Good product but delivery was slow",
      createTime: "2025-02-14T13:48:44.102355Z",
    },
    {
      reviewer: { displayName: "Sample User 3" },
      starRating: "FIVE",
      createTime: "2025-02-13T12:45:28.141593Z",
    },
  ],
}

// Map star ratings to numeric values for filtering and display
const starRatingMap: Record<string, string> = {
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
}

export default function Home() {
  const [jsonData, setJsonData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [filterRating, setFilterRating] = useState<string>("all")
  const [selectedFields, setSelectedFields] = useState({
    starRating: true,
    comment: true,
    reviewer: false,
    createTime: false,
  })
  const [activeTab, setActiveTab] = useState("upload")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processingStatus, setProcessingStatus] = useState<Record<string, boolean>>({})

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess(false)
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    setUploadedFiles(Array.from(files))

    // Initialize processing status for each file
    const initialStatus: Record<string, boolean> = {}
    Array.from(files).forEach((file) => {
      initialStatus[file.name] = false
    })
    setProcessingStatus(initialStatus)

    // Process each file
    const combinedData: any = { reviews: [] }
    let filesProcessed = 0

    Array.from(files).forEach((file) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const data = JSON.parse(content)

          // Merge reviews
          if (data.reviews && Array.isArray(data.reviews)) {
            combinedData.reviews = [...combinedData.reviews, ...data.reviews]
          }

          // Update processing status
          setProcessingStatus((prev) => ({
            ...prev,
            [file.name]: true,
          }))

          filesProcessed++

          // When all files are processed
          if (filesProcessed === files.length) {
            setJsonData(combinedData)
            setIsLoading(false)
            setActiveTab("preview")
          }
        } catch (error) {
          console.error(`Error parsing JSON from ${file.name}:`, error)
          setProcessingStatus((prev) => ({
            ...prev,
            [file.name]: true,
          }))

          filesProcessed++
          if (filesProcessed === files.length) {
            setIsLoading(false)
            if (combinedData.reviews.length > 0) {
              setJsonData(combinedData)
              setActiveTab("preview")
            }
          }
        }
      }

      reader.readAsText(file)
    })
  }

  // Load sample data
  const loadSampleData = () => {
    setJsonData(sampleData)
    setSuccess(false)
    setActiveTab("preview")
    setUploadedFiles([])
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  // Toggle field selection
  const toggleField = (field: keyof typeof selectedFields) => {
    setSelectedFields({
      ...selectedFields,
      [field]: !selectedFields[field],
    })
  }

  // Filter reviews based on selected star rating
  const getFilteredReviews = () => {
    if (!jsonData || !jsonData.reviews) return []

    return jsonData.reviews.filter((review: any) => {
      if (filterRating === "all") return true
      return review.starRating === filterRating
    })
  }

  // Export data to Excel/CSV
  const exportToExcel = () => {
    if (!jsonData || !jsonData.reviews) return

    const filteredReviews = getFilteredReviews()

    // Create headers based on selected fields
    const headers = Object.keys(selectedFields)
      .filter((key) => selectedFields[key as keyof typeof selectedFields])
      .map((key) => {
        if (key === "reviewer") return "Reviewer Name"
        if (key === "createTime") return "Date Created"
        if (key === "starRating") return "Star Rating"
        return key.charAt(0).toUpperCase() + key.slice(1)
      })

    // Add UTF-8 BOM
    let csvContent = "\ufeff"

    // Add headers
    csvContent += headers.join(",") + "\n"

    filteredReviews.forEach((review: any) => {
      const rowData: string[] = []

      if (selectedFields.starRating) {
        rowData.push(starRatingMap[review.starRating] || review.starRating || "")
      }

      if (selectedFields.comment) {
        const comment = review.comment || ""
        // Properly escape quotes and commas, preserve UTF-8 characters
        rowData.push(`"${comment.replace(/"/g, '""')}"`)
      }

      if (selectedFields.reviewer) {
        const reviewerName = review.reviewer?.displayName || ""
        rowData.push(`"${reviewerName.replace(/"/g, '""')}"`)
      }

      if (selectedFields.createTime) {
        const date = review.createTime ? new Date(review.createTime).toLocaleDateString() : ""
        rowData.push(date)
      }

      csvContent += rowData.join(",") + "\n"
    })

    // Create blob with UTF-8 encoding
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "reviews-export.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setSuccess(true)
  }

  // Handle file input click
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Reset file selection
  const resetFiles = () => {
    setUploadedFiles([])
    setJsonData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-4 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      <div
        className={`w-full max-w-4xl rounded-lg shadow-lg overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border border-gray-200"}`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Review Data Exporter</h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Import JSON review data and export to Excel/CSV
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Sun className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <Moon className={`h-4 w-4 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-3 px-4 text-center w-1/2 font-medium text-sm focus:outline-none ${
                activeTab === "upload"
                  ? `border-b-2 ${isDarkMode ? "border-blue-500 text-blue-500" : "border-blue-600 text-blue-600"}`
                  : `${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`
              }`}
            >
              Upload
            </button>
            <button
              onClick={() => jsonData && setActiveTab("preview")}
              disabled={!jsonData}
              className={`py-3 px-4 text-center w-1/2 font-medium text-sm focus:outline-none ${
                !jsonData ? "cursor-not-allowed opacity-50" : ""
              } ${
                activeTab === "preview"
                  ? `border-b-2 ${isDarkMode ? "border-blue-500 text-blue-500" : "border-blue-600 text-blue-600"}`
                  : `${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`
              }`}
            >
              Preview & Export
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 ${
                  isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
                }`}
              >
                <FileUp className={`h-12 w-12 mb-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Upload your JSON review file(s)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  multiple // Allow multiple file selection
                />
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleFileButtonClick}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-blue-500"
                        : "bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? "Processing..." : "Select Files"}
                  </button>
                  <button
                    onClick={loadSampleData}
                    className={`px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 hover:bg-gray-600 focus:ring-blue-500"
                        : "bg-gray-100 border-gray-200 hover:bg-gray-200 focus:ring-blue-500"
                    }`}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Try with Sample Data
                  </button>
                </div>
              </div>

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Selected Files ({uploadedFiles.length})
                    </h3>
                    <button
                      onClick={resetFiles}
                      className={`text-xs px-2 py-1 rounded ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className={`rounded-md border ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-60 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className={`h-4 w-4 mr-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                            <span className="text-sm truncate max-w-xs">{file.name}</span>
                          </div>
                          <div>
                            {processingStatus[file.name] ? (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isDarkMode ? "bg-green-900 text-green-400" : "bg-green-100 text-green-800"
                                }`}
                              >
                                Processed
                              </span>
                            ) : (
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isDarkMode ? "bg-yellow-900 text-yellow-400" : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                Processing...
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "preview" && jsonData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className={`p-3 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <p className="text-sm font-medium">Data loaded successfully</p>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {jsonData.reviews?.length || 0} reviews found
                    {uploadedFiles.length > 0 && ` from ${uploadedFiles.length} file(s)`}
                  </p>
                </div>

                <div className="relative">
                  <label
                    htmlFor="filter-rating"
                    className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Filter by Rating
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left border rounded-md shadow-sm focus:outline-none ${
                        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"
                      }`}
                    >
                      <span>
                        {filterRating === "all"
                          ? "All Ratings"
                          : `${starRatingMap[filterRating] || filterRating} Stars`}
                      </span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div
                        className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${
                          isDarkMode ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200"
                        }`}
                      >
                        <ul className="py-1 max-h-60 overflow-auto">
                          <li>
                            <button
                              onClick={() => {
                                setFilterRating("all")
                                setIsDropdownOpen(false)
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                isDarkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              All Ratings
                            </button>
                          </li>
                          {["FIVE", "FOUR", "THREE", "TWO", "ONE"].map((rating) => (
                            <li key={rating}>
                              <button
                                onClick={() => {
                                  setFilterRating(rating)
                                  setIsDropdownOpen(false)
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                  isDarkMode ? "hover:bg-gray-600 text-white" : "hover:bg-gray-100 text-gray-700"
                                }`}
                              >
                                {starRatingMap[rating]} Stars
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Fields to Export
                </label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="star-rating"
                      checked={selectedFields.starRating}
                      onChange={() => toggleField("starRating")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="star-rating"
                      className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Star Rating
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="comment"
                      checked={selectedFields.comment}
                      onChange={() => toggleField("comment")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="comment" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Comment
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reviewer"
                      checked={selectedFields.reviewer}
                      onChange={() => toggleField("reviewer")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="reviewer" className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Reviewer Name
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="create-time"
                      checked={selectedFields.createTime}
                      onChange={() => toggleField("createTime")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="create-time"
                      className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Date Created
                    </label>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-md border overflow-x-auto ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                    <tr>
                      {selectedFields.starRating && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Star Rating
                        </th>
                      )}
                      {selectedFields.comment && (
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-[500px]"
                        >
                          Comment
                        </th>
                      )}
                      {selectedFields.reviewer && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Reviewer
                        </th>
                      )}
                      {selectedFields.createTime && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Date Created
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {getFilteredReviews()
                      .slice(0, 5)
                      .map((review: any, index: number) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0
                              ? isDarkMode
                                ? "bg-gray-800"
                                : "bg-white"
                              : isDarkMode
                                ? "bg-gray-750"
                                : "bg-gray-50"
                          }
                        >
                          {selectedFields.starRating && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {starRatingMap[review.starRating] || review.starRating || "-"}
                            </td>
                          )}
                          {selectedFields.comment && (
                            <td className="px-6 py-4 text-sm font-medium">{review.comment || "-"}</td>
                          )}
                          {selectedFields.reviewer && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {review.reviewer?.displayName || "-"}
                            </td>
                          )}
                          {selectedFields.createTime && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {review.createTime ? new Date(review.createTime).toLocaleDateString() : "-"}
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
                {getFilteredReviews().length > 5 && (
                  <div className={`p-2 text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Showing 5 of {getFilteredReviews().length} reviews. Export to see all.
                  </div>
                )}
              </div>

              {success && (
                <div
                  className={`flex p-4 rounded-md ${isDarkMode ? "bg-green-900 border border-green-800" : "bg-green-50 border border-green-200"}`}
                >
                  <Check className={`h-5 w-5 mr-2 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
                  <p className={isDarkMode ? "text-green-400" : "text-green-600"}>Export completed successfully!</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={exportToExcel}
                  disabled={!jsonData || isLoading || Object.values(selectedFields).every((v) => !v)}
                  className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                      : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  } ${!jsonData || isLoading || Object.values(selectedFields).every((v) => !v) ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel (CSV)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

