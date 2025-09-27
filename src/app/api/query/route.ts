import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { query } = await req.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // 🧠 Enhanced RAG-style instruction prompt
    const systemPrompt = `
    You are "OceanRAG", an advanced retrieval-augmented reasoning agent specializing in 
    oceanography, marine science, and ARGO float data.

    - Search and reason over trusted domain knowledge as if you have access to a large 
      database and the web.
    - Provide concise, factually accurate, and context-aware answers.
    - If relevant, cite known scientific facts, research, or datasets.
    - When possible, structure your response into clear sections (e.g., "Overview", 
      "Analysis", "Trends", "Conclusion").
    - Prefer Markdown formatting (headings, bullet points, bold) so the frontend can 
      render it nicely.
    - If you don't know something, say so — but still offer helpful related information.
    `

    const userPrompt = `
    User query: ${query}

    ✅ Please behave as if you are part of a real RAG pipeline — 
    retrieve relevant information, summarize it, and answer with clarity and accuracy.
    `

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Groq API error:", err)
      return NextResponse.json(
        { error: "Groq API request failed", details: err },
        { status: response.status }
      )
    }

    const data = await response.json()
    const message = data?.choices?.[0]?.message?.content || "No response generated."

    return NextResponse.json({ response: message })
  } catch (err) {
    console.error("Query route error:", err)
    return NextResponse.json(
      { error: "Failed to process query", details: (err as Error).message },
      { status: 500 }
    )
  }
}
