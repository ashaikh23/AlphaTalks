# AlphaTalks

AlphaTalks is a web application that helps marketers and content creators analyze and adapt their marketing content to resonate with different generations: Gen Z, Millennials, and Boomers. The app leverages Azure OpenAI for advanced text analysis and translation, supporting text, image, and PowerPoint content.

# AlphaTalks

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![Azure OpenAI](https://img.shields.io/badge/Azure-OpenAI-blue)](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
[![GPT-4](https://img.shields.io/badge/GPT--4-Vision-green)](https://openai.com/gpt-4)
[![Grok-3](https://img.shields.io/badge/Grok--3-AI-purple)]([https://grok.x.ai/](https://x.ai/news/grok-3))

AlphaTalks is a web application that helps marketers and content creators analyze and adapt their marketing content to resonate with different generations: Gen Z, Millennials, and Boomers. The app leverages Azure OpenAI for advanced text analysis and translation, supporting text, image, and PowerPoint content.

## Features

- **Text Analysis & Translation:**
  - Analyze how much your marketing content aligns with the language and tone of a specific generation.
  - Instantly translate your content to match Gen Z, Millennial, or Boomer communication styles.

- **Image Text Extraction & Translation:**
  - Upload images with embedded text (e.g., ads, posters).
  - Extracts text and translates it to the selected generation’s style.

- **PowerPoint Translation:**
  - Upload PowerPoint presentations (.pptx).
  - Analyze slides for translatable content and translate selected slides to the target generation’s style.

- **Modern UI:**
  - Built with Next.js, React, and Tailwind CSS for a responsive, user-friendly experience.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend:** Next.js, Python
- **AI Integration:** Azure OpenAI (for text analysis and translation)
- **NLP Libraries:** 
  - sentence-transformers (for semantic embeddings)
  - scikit-learn (for cosine similarity calculations)
  - NLTK (for text preprocessing and lemmatization)
- **Other Libraries:**
  - JSZip (PowerPoint file handling)
  - Tesseract.js (OCR for image text extraction)

## NLP Algorithm: How Generational Score Rating Works

AlphaTalks uses advanced Natural Language Processing techniques to analyze and score how well marketing content aligns with different generational communication styles. Here's how the algorithm works:

### 1. Text Preprocessing Pipeline

**Step 1: Text Cleaning and Flattening**
- Removes non-alphabetic characters and normalizes text
- Converts all text to lowercase for consistency
- Extracts only meaningful words using regex patterns

**Step 2: Lemmatization**
- Uses NLTK's WordNetLemmatizer to reduce words to their base forms
- Examples: "running" → "run", "better" → "good"
- This ensures semantic consistency across different word forms

### 2. Word Embeddings Generation

Instead of traditional bag-of-words or TF-IDF approaches, AlphaTalks uses **semantic embeddings** powered by the `sentence-transformers` library:

- **Model Used:** `all-MiniLM-L6-v2` - a pre-trained transformer model
- **Embedding Dimension:** 384-dimensional dense vectors
- **Semantic Understanding:** Captures contextual meaning, not just word frequency
- **Benefits:** Words with similar meanings get similar vector representations

### 3. Cosine Similarity Calculation

**Mathematical Foundation:**
Cosine similarity measures the angle between two vectors in high-dimensional space:

```
cosine_similarity(A, B) = (A · B) / (||A|| × ||B||)
```

**Range:** -1 to 1 (where 1 = identical, 0 = orthogonal, -1 = opposite)

**How We Apply It:**
1. Generate embeddings for reference texts (Gen Z, Millennial, Boomer corpora)
2. Generate embeddings for input marketing content
3. Calculate cosine similarity between input and each generational reference
4. Higher similarity scores indicate better alignment with that generation's style

### 4. Generational Reference Training

The system is trained on curated text corpora for each generation:
- **Gen Z:** Social media posts, memes, contemporary slang
- **Millennial:** Early internet culture, pop culture references
- **Boomer:** Traditional media, formal communication styles

Each reference corpus is processed through the same pipeline (cleaning → lemmatization → embedding) to create baseline vectors for comparison.

### 5. Scoring and Analysis

**Output Format:**
The cosine similarity is calculated between the input and the selected target reference, returning a similarity score between 0-100%

This approach provides more nuanced and semantically-aware generational analysis compared to simple keyword matching or frequency-based methods.

## Translation Engine: AI-Powered Generational Content Adaptation

AlphaTalks includes a sophisticated translation engine that automatically adapts marketing content to match the communication style, tone, and cultural references of different generations. The system leverages Azure OpenAI's advanced language models to provide context-aware translations that go beyond simple word replacement.

### How the Translation System Works

The translation engine operates through a multi-layered approach that combines generational psychology, linguistic patterns, and AI-powered content adaptation:

### 1. Generational Context Framework

Each generation has a detailed context profile that includes:
- **Core Characteristics:** Values, life experiences, and cultural touchstones
- **Language Patterns:** Communication preferences and structural tendencies  
- **Common Slang & Terms:** Generation-specific vocabulary with definitions
- **Cultural References:** Relevant pop culture, technology, and historical context

**Example Profiles:**
- **Gen Z:** Digital natives with TikTok influence, social justice awareness, and authenticity focus
- **Millennials:** Work-life balance seekers with 90s/2000s nostalgia and practical concerns
- **Boomers:** Traditional communicators valuing quality, reliability, and formal language

### 2. Azure OpenAI Integration

The system uses multiple Azure OpenAI deployments for different content types:

**Text Translation (`/api/translate`):**
- **Model:** Grok-3 (via Azure AI Studio)
- **Endpoint:** Custom Azure AI endpoint with Bearer token authentication
- **Process:** Direct text-to-text translation with generational context injection

**Image Text Translation (`/api/analyze-image`):**
- **Model:** GPT-4 Vision (o4-mini deployment)
- **Capability:** OCR + translation in a single API call
- **Process:** Image → Base64 encoding → Vision API → Text extraction + translation

**PowerPoint Translation (`/api/translate-powerpoint`):**
- **Model:** GPT-4 (o4-mini deployment)
- **Process:** File parsing → Text extraction → Batch translation → File reconstruction

### 3. Multi-Modal Content Support

**Text Translation:**

User Input → Generational Context Injection → Azure OpenAI API → Translated Output

**Image Translation:**

Image Upload → Base64 Conversion → GPT-4 Vision API → Text Extraction + Translation → Result Display

**PowerPoint Translation:**

.pptx Upload → JSZip Parsing → XML Text Extraction → Slide Analysis → Selective Translation → XML Reconstruction → Modified .pptx Download


### 4. API Architecture

#### Text Translation API (`/api/translate/route.ts`)
- **Input:** Raw text + generation type
- **Processing:** Injects generational context into prompt template
- **Output:** Culturally adapted text maintaining core message
- **Model:** Grok-3 via Azure AI Studio

#### Image Analysis API (`/api/analyze-image/route.ts`)
- **Input:** Image file + generation type
- **Processing:** 
  1. Converts image to base64 format
  2. Sends to GPT-4 Vision with generational context
  3. Extracts text and translates simultaneously
- **Output:** Original text + translated text
- **Model:** GPT-4 Vision (o4-mini)

#### PowerPoint Translation API (`/api/translate-powerpoint/route.ts`)
- **Input:** .pptx file + generation type + selected slide numbers
- **Processing:**
  1. Uses JSZip to parse PowerPoint file structure
  2. Extracts text from XML slide files using regex patterns
  3. Analyzes each slide for translatable content
  4. Applies batch translation to selected slides only
  5. Reconstructs PowerPoint with translated content
- **Output:** Modified .pptx file for download
- **Model:** GPT-4 (o4-mini)

### 5. Advanced PowerPoint Processing

The PowerPoint translation feature includes sophisticated XML manipulation:

**File Structure Analysis:**
- Parses `ppt/slides/slideX.xml` files within the .pptx container
- Identifies text within `<a:t>` XML tags (PowerPoint text elements)
- Handles XML encoding/decoding for special characters
- Preserves formatting, images, and non-text elements

**Intelligent Text Extraction:**
- Categorizes text by context (title, body, bullet points)
- Filters out non-translatable content (URLs, numbers)
- Maintains slide structure and visual hierarchy

**Selective Translation:**
- Users can preview all slides and select specific ones for translation
- Shows word count and estimated processing cost per slide
- Processes only selected slides to optimize API usage and cost

### 6. Prompt Engineering Strategy

Each API call uses carefully crafted prompts that include:

1. **Role Definition:** "You are a marketing translation expert specializing in [Generation] communication"
2. **Contextual Framework:** Detailed generational characteristics and preferences  
3. **Task Specification:** Clear instructions to maintain core message while adapting style
4. **Output Formatting:** Structured response format for consistent results

**Example Prompt Structure:**

[Generational Context Block]

Please translate the following marketing content to match the communication style of this generation. Maintain the core message while adapting the language, tone, and cultural references appropriately:

Original content: "[USER_INPUT]"

Translated content:

### 7. Quality Assurance Features

- **Context Validation:** Verifies generation type exists before processing
- **Error Handling:** Graceful fallbacks for API failures or invalid inputs
- **Cost Optimization:** Token limits and selective processing for PowerPoint files
- **File Integrity:** Maintains PowerPoint file structure and non-text elements
- **Progress Tracking:** Real-time feedback during PowerPoint processing

This comprehensive translation system ensures that marketing content resonates authentically with target audiences while preserving the original message's intent and effectiveness.

## Project Structure

```
app/                # Next.js app directory (pages, API routes)
  ├─ api/           # API endpoints (image, text, ppt translation)
  ├─ rating/        # UI for content rating
  ├─ translation/   # UI for translation features
  └─ ...
components/         # Reusable UI components
hooks/              # Custom React hooks
lib/                # Generation context definitions, utilities
public/             # Static assets (images, logos)
python_score_gen/   # Python scripts for text scoring (optional)
styles/             # Global styles
```

## Prerequisites
- Node.js 18+
- npm or pnpm package manager
- Azure OpenAI Service account with the following deployed models:
  - Grok-3 model (for text translation)
  - GPT-4 Vision (o4-mini for image analysis and PowerPoint processing)
- Python 3.8+ (Optional for local NLP Processing)

## Hackathon Video

**Watch AlphaTalks in Action:**  
[Project Demo Video](https://youtu.be/37JVtLwUz3I)  

[![Project Video](https://img.youtube.com/vi/37JVtLwUz3I/0.jpg)](https://youtu.be/37JVtLwUz3I)

## Getting Started

1. **Install dependencies:**
   ```sh
   pnpm install
   # or
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory and add your Azure OpenAI credentials:
   ```env
   AZURE_OPENAI_ENDPOINT=your-endpoint-url
   AZURE_OPENAI_KEY=your-api-key
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   # For PowerPoint translation:
   AZURE_OPENAI_API_KEY=your-api-key
   AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

3. **Run the development server:**
   ```sh
   pnpm dev
   # or
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Home:** Overview and navigation.
- **Rating:** Paste your marketing content and see what percentage matches the selected generation’s style.
- **Translation:**
  - **Text:** Paste and translate text.
  - **Image:** Upload an image to extract and translate text.
  - **PowerPoint:** Upload a .pptx file, analyze slides, and translate selected slides.

## Customization

- Update generation context definitions in `lib/generation-contexts.ts` to fine-tune translation styles.
- Add or modify UI components in `components/` as needed.

## License

MIT

## Authors

- Aymaan Shaikh (AI Platform)
- Aarya Mandvilkar (Gen Purpose)
- Ashley Woertz (Edge + Platform)
- Cesar De Leon Terrero (DevDiv)
- Fabio Villatoro Nunez (Analytics Data Eng)
- Katherine Comer (DC Operations and Policy Leadership)
- Nat Nguyendinh (WSSI Win Silicn & Sys)
- Tiffany Lu (IDM Services ENG)
- Vinit Shenoy (E D OPEX US)
- Jaime Ortiz de la Torre (DevDiv)

---

*Built for the 2025 Microsoft Global Intern Hackathon *
**3rd Place Winner** in the category of Microsoft Customer Engagement & Sales
