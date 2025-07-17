import { NextRequest, NextResponse } from "next/server"
import JSZip from "jszip"
import { generationContexts, GenerationType } from '@/lib/generation-contexts' // Add this import

// Translation function - simplified without length constraints
async function translateText(text: string, generationType: string, maxLength?: number): Promise<string> {
  try {
    // Don't translate if text is too short or empty
    if (!text || text.trim().length === 0) {
      return text
    }

    // Call Azure OpenAI directly for translation without length restrictions
    const translatedText = await callAzureOpenAI(text, generationType)

    console.log(`Translated "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" to "${translatedText.substring(0, 50)}${translatedText.length > 50 ? '...' : ''}"`)
    return translatedText
  } catch (error) {
    console.error('Translation error:', error)
    // Return original text if translation fails
    return text
  }
}


async function callAzureOpenAI(text: string, generationType: string): Promise<string> {
  // Check if generation type exists in the context library
  if (!(generationType in generationContexts)) {
    throw new Error(`Invalid generation type: ${generationType}`)
  }

  // Use the context library instead of hardcoded prompts
  const generationContext = generationContexts[generationType as GenerationType]

  // Azure OpenAI configuration
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview"

  if (!endpoint || !apiKey || !deploymentName) {
    throw new Error("Azure OpenAI configuration missing")
  }

  const response = await fetch(`${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content: "You are a marketing content translator that adapts messaging for different generations. Maintain the core message while adapting the language, tone, and references to resonate with the target generation. Keep responses concise."
        },
        {
          role: "user",
          content: `${generationContext}\n\nPlease translate the following marketing content to match the communication style of this generation. Maintain the core message while adapting the language, tone, and cultural references appropriately:\n\nOriginal content: "${text}"`
        }
      ],
      max_completion_tokens: 900,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Azure OpenAI API error:', errorText)
    throw new Error(`Azure OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const translatedText = data.choices?.[0]?.message?.content || text
  
  // Log usage for cost tracking
  const usage = data.usage
  if (usage) {
    console.log(`🔥 API Usage - Input tokens: ${usage.prompt_tokens}, Output tokens: ${usage.completion_tokens}, Total: ${usage.total_tokens}`)
  }

  return translatedText
}

// Extract and replace text in PowerPoint XML
function replaceTextInXML(xmlContent: string, originalTexts: string[], translatedTexts: string[]): string {
  let modifiedXML = xmlContent
  
  for (let i = 0; i < originalTexts.length; i++) {
    const original = originalTexts[i]
    const translated = translatedTexts[i]
    
    if (original && translated && original.trim() !== "") {
      // Properly encode special characters for XML
      const encodedTranslated = translated
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      
      // Encode the original text to match what's in XML
      const encodedOriginal = original
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
      
      // Replace text content in PowerPoint XML structure
      // PowerPoint text is usually wrapped in <a:t> tags
      const textRegex = new RegExp(`(<a:t[^>]*>)${escapeRegex(encodedOriginal)}(</a:t>)`, 'g')
      const replacementCount = (modifiedXML.match(textRegex) || []).length
      
      if (replacementCount > 0) {
        modifiedXML = modifiedXML.replace(textRegex, `$1${encodedTranslated}$2`)
        console.log(`✅ Replaced "${original}" with "${translated}" (${replacementCount} occurrences)`)
      } else {
        // Try a more flexible approach - look for the original text pattern
        const flexibleRegex = new RegExp(escapeRegex(encodedOriginal), 'g')
        const flexibleCount = (modifiedXML.match(flexibleRegex) || []).length
        
        if (flexibleCount > 0) {
          modifiedXML = modifiedXML.replace(flexibleRegex, encodedTranslated)
          console.log(`✅ Flexible replacement of "${original}" with "${translated}" (${flexibleCount} occurrences)`)
        } else {
          // Try replacing the unencoded version (in case XML isn't properly encoded)
          const originalRegex = new RegExp(escapeRegex(original), 'g')
          const originalCount = (modifiedXML.match(originalRegex) || []).length
          
          if (originalCount > 0) {
            modifiedXML = modifiedXML.replace(originalRegex, translated)
            console.log(`✅ Raw replacement of "${original}" with "${translated}" (${originalCount} occurrences)`)
          } else {
            console.log(`⚠️ Could not find text to replace: "${original}"`)
          }
        }
      }
    }
  }
  
  return modifiedXML
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Simplified text extraction without length constraints
function extractTextFromXML(xmlContent: string): Array<{text: string, context: string, estimatedMaxLength: number}> {
  const textElements: Array<{text: string, context: string, estimatedMaxLength: number}> = []
  const foundTexts = new Set<string>() // Prevent duplicates
  
  // Match text within <a:t> tags (PowerPoint text elements)
  const textMatches = xmlContent.match(/<a:t[^>]*>([^<]*?)<\/a:t>/g)
  
  if (textMatches) {
    textMatches.forEach(match => {
      const textContent = match.replace(/<a:t[^>]*>([^<]*?)<\/a:t>/, '$1')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim()
      
      if (textContent.length > 0 && !foundTexts.has(textContent)) {
        foundTexts.add(textContent)
        
        // Simple context determination - no length restrictions
        let context = "body"
        if (textContent.length <= 30 && !textContent.includes('.') && !textContent.includes(',')) {
          context = "title"
        } else if (textContent.length <= 20) {
          context = "short"
        } else if (textContent.startsWith('•') || textContent.startsWith('-')) {
          context = "bullet"
        }
        
        textElements.push({
          text: textContent,
          context,
          estimatedMaxLength: 0 // No length restrictions
        })
        
        console.log(`📝 Extracted text (${context}): "${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}"`)
      }
    })
  }
  
  // Also look for text in paragraph elements that might not be wrapped in <a:t>
  const paragraphMatches = xmlContent.match(/<a:p[^>]*>[\s\S]*?<\/a:p>/g)
  if (paragraphMatches) {
    paragraphMatches.forEach(paragraph => {
      // Extract all text content from the paragraph, even if not in <a:t> tags
      const allText = paragraph.replace(/<[^>]*>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
      
      if (allText.length > 0 && !foundTexts.has(allText)) {
        // Check if this text is already captured by <a:t> tags
        const hasAtTags = paragraph.includes('<a:t')
        if (!hasAtTags) {
          foundTexts.add(allText)
          
          let context = "body"
          if (allText.length <= 30 && !allText.includes('.') && !allText.includes(',')) {
            context = "title"
          } else if (allText.length <= 20) {
            context = "short"
          }
          
          textElements.push({
            text: allText,
            context,
            estimatedMaxLength: 0 // No length restrictions
          })
          
          console.log(`📝 Extracted paragraph text (${context}): "${allText.substring(0, 50)}${allText.length > 50 ? '...' : ''}"`)
        }
      }
    })
  }
  
  return textElements
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const generationType = formData.get("generationType") as string
    const selectedSlides = formData.get("selectedSlides") as string // Comma-separated slide numbers
    const action = formData.get("action") as string // "analyze" or "translate"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    console.log(`Processing PowerPoint for action: ${action}`)
    console.log(`File: ${file.name}, Size: ${file.size} bytes`)

    // Convert file to buffer and load with JSZip
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Extract slide information
    const slideInfo: Array<{
      slideNumber: number
      filename: string
      textElements: Array<{text: string, context: string, estimatedMaxLength: number}>
      wordCount: number
    }> = []

    const slideFiles: { [key: string]: string } = {}

    // Process each slide file
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
        const xmlContent = await (zipEntry as any).async('text')
        slideFiles[filename] = xmlContent
        
        // Extract slide number from filename (e.g., "ppt/slides/slide1.xml" -> 1)
        const slideNumberMatch = filename.match(/slide(\d+)\.xml$/)
        const slideNumber = slideNumberMatch ? parseInt(slideNumberMatch[1]) : 0
        
        // Extract text from this slide with context
        const textElements = extractTextFromXML(xmlContent)
        const wordCount = textElements.map(el => el.text).join(' ').split(/\s+/).filter(word => word.length > 0).length
        
        slideInfo.push({
          slideNumber,
          filename,
          textElements,
          wordCount
        })
      }
    }

    // Sort slides by slide number
    slideInfo.sort((a, b) => a.slideNumber - b.slideNumber)

    // If action is "analyze", return slide information
    if (action === "analyze") {
      const analysis = slideInfo.map(slide => ({
        slideNumber: slide.slideNumber,
        textPreview: slide.textElements.slice(0, 3).map(el => el.text).join(' | ').substring(0, 100) + (slide.textElements.map(el => el.text).join(' ').length > 100 ? '...' : ''),
        textCount: slide.textElements.length,
        wordCount: slide.wordCount,
        estimatedCost: Math.max(2, Math.ceil(slide.wordCount * 0.15)), // $0.15 per word, min $2
        contexts: slide.textElements.map(el => el.context)
      }))

      return NextResponse.json({
        slides: analysis,
        totalSlides: slideInfo.length,
        totalCost: analysis.reduce((sum, slide) => sum + slide.estimatedCost, 0)
      })
    }

    // If action is "translate", proceed with translation
    if (!generationType) {
      return NextResponse.json({ error: "No generation type specified" }, { status: 400 })
    }

    if (!selectedSlides) {
      return NextResponse.json({ error: "No slides selected for translation" }, { status: 400 })
    }

    const selectedSlideNumbers = selectedSlides.split(',').map(num => parseInt(num.trim()))
    console.log(`Translating slides: ${selectedSlideNumbers.join(', ')} for generation: ${generationType}`)

    // Filter slides to translate only selected ones
    const slidesToTranslate = slideInfo.filter(slide => selectedSlideNumbers.includes(slide.slideNumber))
    
    // Translate selected slides
    for (const slide of slidesToTranslate) {
      console.log(`Processing slide ${slide.slideNumber}...`)
      const translatedTexts: string[] = []
      const originalTexts: string[] = []
      
      for (const textElement of slide.textElements) {
        originalTexts.push(textElement.text)
        
        if (textElement.text.trim().length > 0) {
          console.log(`Translating ${textElement.context}: "${textElement.text.substring(0, 50)}${textElement.text.length > 50 ? '...' : ''}"`)
          try {
            const translated = await translateText(textElement.text, generationType)
            translatedTexts.push(translated)
            console.log(`Translated to (${translated.length}/${textElement.estimatedMaxLength} chars): "${translated.substring(0, 50)}${translated.length > 50 ? '...' : ''}"`)
          } catch (error) {
            console.error(`Failed to translate: "${textElement.text}"`, error)
            translatedTexts.push(textElement.text) // Keep original text if translation fails
          }
        } else {
          translatedTexts.push(textElement.text)
        }
      }
      
      // Replace text in this slide's XML
      const modifiedXML = replaceTextInXML(slideFiles[slide.filename], originalTexts, translatedTexts)
      zip.file(slide.filename, modifiedXML)
    }

    // Generate the modified PowerPoint file
    const modifiedBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    return new NextResponse(modifiedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="translated_${file.name}"`,
      },
    })

  } catch (error: any) {
    console.error("PowerPoint translation error:", error)
    return NextResponse.json(
      { error: "Failed to process PowerPoint file", details: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}