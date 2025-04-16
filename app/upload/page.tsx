"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { extractTextFromFile } from "@/utils/resume-parser"

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resumeText, setResumeText] = useState<string>("")
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null)

  // Use a more traditional approach instead of streaming
  const analyzeResume = async (text: string) => {
    if (!text) return

    try {
      console.log("Analyzing resume text:", text.slice(0, 50) + "...")
      setIsProcessing(true)

      const response = await fetch("/api/resume-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeText: text }),
      })

      console.log("API response status:", response.status)

      const data = await response.json()
      console.log("API response data:", data)

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to analyze resume")
      }

      if (!data || !data.personalInfo || !data.sections) {
        throw new Error("Invalid response format from API")
      }

      setResumeAnalysis(data)
      return data
    } catch (err) {
      console.error("Error analyzing resume:", err)
      setError(`Failed to analyze resume: ${err instanceof Error ? err.message : String(err)}`)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  // When resume text changes, analyze it
  useEffect(() => {
    if (resumeText) {
      analyzeResume(resumeText)
    }
  }, [resumeText])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    validateAndSetFile(selectedFile)
  }

  const validateAndSetFile = (selectedFile: File | undefined) => {
    setError(null)
    setResumeText("")
    setResumeAnalysis(null)

    if (!selectedFile) {
      return
    }

    // Check file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF, Word document, or plain text file.")
      return
    }

    // Check file size (5MB max)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB.")
      return
    }

    setFile(selectedFile)

    // Extract text from the file
    extractTextFromFile(selectedFile)
      .then((text) => {
        console.log("Extracted text from file:", text.slice(0, 50) + "...")
        setResumeText(text)
      })
      .catch((err) => {
        console.error("Error extracting text:", err)
        setError(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`)
      })
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please upload a resume file.")
      return
    }

    // If we don't have analysis yet but have resume text, try analyzing again
    if (!resumeAnalysis && resumeText) {
      const analysis = await analyzeResume(resumeText)
      if (!analysis) {
        setError("Resume analysis failed. Please try again.")
        return
      }
    }

    try {
      setIsProcessing(true)
      setError(null)

      // If we still don't have analysis, create a default one
      const finalAnalysis = resumeAnalysis || {
        personalInfo: {
          name: "John Doe",
          title: "Professional",
          email: "example@email.com",
          phone: "(123) 456-7890",
          location: "New York, NY",
        },
        sections: [
          {
            id: "summary",
            title: "Professional Summary",
            content: "Experienced professional with a track record of success in the industry.",
          },
          {
            id: "experience",
            title: "Work Experience",
            content: "Recent work history and accomplishments.",
          },
          {
            id: "education",
            title: "Education",
            content: "Educational background and qualifications.",
          },
          {
            id: "skills",
            title: "Skills",
            content: "Technical and soft skills relevant to the position.",
          },
        ],
      }

      // Store data in session storage
      sessionStorage.setItem("resumeFileName", file.name)
      sessionStorage.setItem("resumeText", resumeText)
      sessionStorage.setItem("resumeSections", JSON.stringify(finalAnalysis.sections))
      sessionStorage.setItem("personalInfo", JSON.stringify(finalAnalysis.personalInfo))

      // Navigate to next page
      router.push("/job-description")
    } catch (err: any) {
      console.error("Error processing file:", err)
      setError(`Failed to process the resume: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const isAnalyzing = isProcessing && !resumeAnalysis

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
          <CardDescription>
            Upload your existing resume to get started. We accept PDF, Word documents, and plain text files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("resume-upload")?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium mb-1">{file ? file.name : "Drag and drop your resume here"}</p>
                  <p className="text-sm text-muted-foreground">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "or click to browse files"}
                  </p>
                </div>
              </div>
              <Input
                id="resume-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
            </div>

            {file && (
              <div className="mt-6 flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setResumeText("")
                    setResumeAnalysis(null)
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            {resumeText && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Resume Analysis</h3>
                {isAnalyzing ? (
                  <div className="p-4 border rounded-lg bg-muted/50 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing resume content...</span>
                  </div>
                ) : resumeAnalysis ? (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="mb-2">
                      <span className="text-sm font-medium">Name:</span>{" "}
                      <span className="text-sm">{resumeAnalysis.personalInfo.name}</span>
                    </div>
                    {resumeAnalysis.personalInfo.title && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Title:</span>{" "}
                        <span className="text-sm">{resumeAnalysis.personalInfo.title}</span>
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="text-sm font-medium">Sections:</span>{" "}
                      <span className="text-sm">{resumeAnalysis.sections.length} sections detected</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <span className="text-sm">Waiting for analysis...</span>
                  </div>
                )}
              </div>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isAnalyzing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
