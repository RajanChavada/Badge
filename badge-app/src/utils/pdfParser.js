import pdfToText from 'react-pdftotext'

/**
 * Extract text from a PDF file
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} - The extracted text from the PDF
 */
export async function extractTextFromPDF(file) {
  try {
    const text = await pdfToText(file)
    return text
  } catch (err) {
    console.error('Error parsing PDF:', err)
    throw new Error('Failed to parse PDF file')
  }
}

/**
 * Parse resume text and extract key information
 * @param {string} text - The resume text
 * @returns {Object} - Extracted resume data
 */
export function parseResumeText(text) {
  const result = {
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: '',
    education: '',
  }

  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  if (emailMatch) {
    result.email = emailMatch[0]
  }

  // Extract phone
  const phoneMatch = text.match(/(\+?1?\s*)?(\()?(\d{3})(\))?[\s.-]?(\d{3})[\s.-]?(\d{4})/)
  if (phoneMatch) {
    result.phone = phoneMatch[0]
  }

  // Try to extract name (usually first line)
  const lines = text.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length > 0) {
    const firstLine = lines[0].trim()
    if (!firstLine.includes('@') && firstLine.length > 0 && firstLine.length < 100) {
      result.name = firstLine
    }
  }

  // Extract education section
  const eduMatch = text.match(/(?:education|bachelor|master|phd|bs|ms|ma|degree)(.*?)(?=experience|skills|$)/is)
  if (eduMatch) {
    result.education = eduMatch[1].trim().substring(0, 300)
  }

  // Extract experience section
  const expMatch = text.match(/(?:experience|employment)(.*?)(?=education|skills|$)/is)
  if (expMatch) {
    result.experience = expMatch[1].trim().substring(0, 500)
  }

  // Extract skills
  const skillKeywords = [
    'javascript',
    'typescript',
    'python',
    'java',
    'react',
    'vue',
    'angular',
    'node',
    'express',
    'mongodb',
    'sql',
    'aws',
    'docker',
    'kubernetes',
    'git',
    'html',
    'css',
    'devops',
    'machine learning',
    'ai',
    'api',
    'rest',
    'graphql',
    'agile',
    'scrum',
  ]

  const textLower = text.toLowerCase()
  const foundSkills = skillKeywords.filter((skill) => textLower.includes(skill))
  result.skills = [...new Set(foundSkills)]

  return result
}

