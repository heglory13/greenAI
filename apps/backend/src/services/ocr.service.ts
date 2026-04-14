import Tesseract from 'tesseract.js'
import path from 'path'
import fs from 'fs'
import Groq from 'groq-sdk'
import OCRTraining from '../models/OCRTraining.model.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export class OCRService {
  private static trainingPatterns: Map<string, number> = new Map()
  private static lastTrainingLoad = 0
  private static CACHE_DURATION = 5 * 60 * 1000

  static async loadTrainingPatterns() {
    const now = Date.now()
    if (now - this.lastTrainingLoad < this.CACHE_DURATION && this.trainingPatterns.size > 0) return
    try {
      const trainingData = await OCRTraining.find().limit(1000)
      this.trainingPatterns.clear()
      trainingData.forEach(data => {
        if (data.rawText) this.trainingPatterns.set(data.rawText.trim().toLowerCase(), data.correctValue)
      })
      this.lastTrainingLoad = now
      console.log(`Loaded ${this.trainingPatterns.size} OCR training patterns`)
    } catch (error) {
      console.error('Failed to load training patterns:', error)
    }
  }

  // Primary: Use Groq Vision AI to read meter
  static async readMeterWithAI(imagePath: string): Promise<{ value: number; confidence: number; rawText?: string } | null> {
    try {
      const absolutePath = path.resolve(imagePath)
      const imageBuffer = fs.readFileSync(absolutePath)
      const base64Image = imageBuffer.toString('base64')
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg'

      const completion = await groq.chat.completions.create({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
              },
              {
                type: 'text',
                text: 'This is a photo of an electricity meter. Read ONLY the main kWh counter display (the row of numbers showing total electricity consumption). Ignore serial numbers, model numbers, and other text. Return ONLY the number, nothing else. For example: 5051'
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 50,
      })

      const response = completion.choices[0]?.message?.content?.trim() || ''
      console.log('AI Vision response:', response)

      // Extract number from response
      const match = response.match(/\d+/)
      if (match) {
        const value = parseInt(match[0])
        if (value >= 0 && value < 999999) {
          console.log('AI Vision reading:', value)
          return { value, confidence: 0.92, rawText: `AI: ${response}` }
        }
      }
      return null
    } catch (error: any) {
      console.error('AI Vision OCR failed:', error.message)
      return null
    }
  }

  // Fallback: Tesseract OCR
  static async readMeterWithTesseract(imagePath: string): Promise<{ value: number; confidence: number; rawText?: string }> {
    try {
      const absolutePath = path.resolve(imagePath)
      if (!fs.existsSync(absolutePath)) {
        return { value: 0, confidence: 0 }
      }

      await this.loadTrainingPatterns()

      const result = await Tesseract.recognize(absolutePath, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      const text = result.data.text.trim()
      console.log('Tesseract Raw Text:', text)

      // Check training patterns
      const textKey = text.toLowerCase()
      if (this.trainingPatterns.has(textKey)) {
        const learnedValue = this.trainingPatterns.get(textKey)!
        return { value: learnedValue, confidence: 0.95, rawText: text }
      }

      if (!text || text.length === 0) {
        return { value: 0, confidence: 0 }
      }

      // Extract numbers
      const allNumbers = text.match(/\d+\.?\d*/g) || []
      const readings = allNumbers
        .map(n => parseFloat(n))
        .filter(n => !isNaN(n) && n >= 10 && n < 999999)
        .sort((a, b) => b - a)

      if (readings.length === 0) {
        return { value: 0, confidence: 0 }
      }

      // Prefer 4-6 digit numbers (meter readings)
      let value = readings[0]
      const meterLike = readings.filter(n => n >= 1000 && n <= 999999)
      if (meterLike.length > 0) {
        const fiveToSix = meterLike.filter(n => n >= 10000)
        value = fiveToSix.length > 0 ? fiveToSix[0] : meterLike[0]
      }

      const confidence = result.data.confidence / 100
      return {
        value: Math.round(value),
        confidence: Math.max(0.3, Math.min(1, confidence)),
        rawText: text
      }
    } catch (error) {
      console.error('Tesseract OCR Error:', error)
      return { value: 0, confidence: 0 }
    }
  }

  // Main method: try AI first, fallback to Tesseract
  static async extractMeterReading(imagePath: string): Promise<{ value: number; confidence: number; rawText?: string }> {
    console.log('Starting OCR for:', imagePath)

    // Try AI Vision first
    const aiResult = await this.readMeterWithAI(imagePath)
    if (aiResult && aiResult.value > 0) {
      console.log('Using AI Vision result:', aiResult.value)
      return aiResult
    }

    // Fallback to Tesseract
    console.log('AI Vision failed, falling back to Tesseract...')
    return this.readMeterWithTesseract(imagePath)
  }
}
