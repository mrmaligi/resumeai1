// Mock implementation for resume analysis without requiring OpenAI API key

export async function POST(req: Request) {
  try {
    console.log("Resume analysis API called")

    const body = await req.json().catch((err) => {
      console.error("Error parsing request body:", err)
      return {}
    })

    const { resumeText } = body

    console.log("Resume text received:", resumeText ? `${resumeText.slice(0, 50)}...` : "undefined")

    if (!resumeText || typeof resumeText !== "string") {
      console.error("Invalid resume text")
      return Response.json({ error: "Resume text is required" }, { status: 400 })
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Extract name from the first line
    const lines = resumeText.split("\n").filter((line) => line.trim().length > 0)
    console.log(`Found ${lines.length} non-empty lines`)

    const name = lines[0]?.trim() || "John Doe"
    console.log("Extracted name:", name)

    // Try to extract title from the second line
    const title = lines[1]?.trim() || "Professional"
    console.log("Extracted title:", title)

    // Create default sections
    const sections = [
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
    ]

    // Create the response object
    const result = {
      personalInfo: {
        name,
        title,
        email: "example@email.com",
        phone: "(123) 456-7890",
        location: "New York, NY",
      },
      sections,
    }

    console.log("Sending response:", JSON.stringify(result).slice(0, 100) + "...")
    return Response.json(result)
  } catch (error) {
    console.error("Error in resume analysis API:", error)
    return Response.json(
      {
        error: "Failed to analyze resume",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
