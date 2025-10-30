/**
 * Patient Input to Doctor Summary Generator
 * Takes patient's conversational input and generates structured medical summaries
 */

class PatientSummaryGenerator {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.apiEndpoint = 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Main function to generate doctor summary from patient input
   */
  async generateDoctorSummary(patientInput, options = {}) {
    const {
      includeSymptoms = true,
      includeDuration = true,
      includeSeverity = true,
      includeHistory = true,
      format = 'structured' // 'structured' or 'narrative'
    } = options;

    const prompt = this.buildPrompt(patientInput, {
      includeSymptoms,
      includeDuration,
      includeSeverity,
      includeHistory,
      format
    });

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const summaryText = data.content[0].text;

      if (format === 'structured') {
        return this.parseStructuredSummary(summaryText);
      } else {
        return {
          narrative: summaryText,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for the AI to generate medical summary
   */
  buildPrompt(patientInput, options) {
    const { format } = options;

    if (format === 'structured') {
      return `You are a medical documentation assistant. A patient has described their health concerns below. Extract and organize this information into a structured medical summary for their doctor.

Patient's description:
"${patientInput}"

Generate a structured summary in the following JSON format:
{
  "chiefComplaint": "Brief main reason for visit",
  "symptoms": [
    {
      "symptom": "name",
      "duration": "how long",
      "severity": "mild/moderate/severe",
      "frequency": "constant/intermittent/occasional",
      "notes": "additional details"
    }
  ],
  "relevantHistory": {
    "medicalConditions": [],
    "medications": [],
    "allergies": [],
    "recentChanges": ""
  },
  "functionalImpact": "How symptoms affect daily activities",
  "patientConcerns": "What worries the patient most",
  "redFlags": ["Any concerning symptoms requiring immediate attention"],
  "suggestedQuestions": ["Questions doctor should ask for clarification"]
}

Return ONLY the JSON object, no other text.`;
    } else {
      return `You are a medical documentation assistant. A patient has described their health concerns below. Write a concise, professional narrative summary for their doctor in standard SOAP note format (Subjective, Objective, Assessment, Plan sections). Focus on the Subjective section based on patient's input.

Patient's description:
"${patientInput}"

Write a clear, clinical narrative summary that a doctor can quickly read and understand. Use medical terminology where appropriate but keep it concise.`;
    }
  }

  /**
   * Parse structured summary response
   */
  parseStructuredSummary(summaryText) {
    try {
      // Remove markdown code blocks if present
      const cleanText = summaryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanText);
      
      return {
        ...parsed,
        timestamp: new Date().toISOString(),
        format: 'structured'
      };
    } catch (error) {
      console.error('Error parsing structured summary:', error);
      return {
        error: 'Failed to parse summary',
        rawText: summaryText,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate a quick summary without AI (rule-based extraction)
   */
  generateQuickSummary(patientInput) {
    const summary = {
      wordCount: patientInput.split(/\s+/).length,
      extractedInfo: {},
      timestamp: new Date().toISOString()
    };

    // Extract time-related information
    const timePatterns = [
      /(\d+)\s*(day|week|month|year)s?\s*(ago)?/gi,
      /(yesterday|today|last\s+\w+)/gi,
      /(since|for|about)\s+(\d+\s*\w+)/gi
    ];
    
    const timeMatches = [];
    timePatterns.forEach(pattern => {
      const matches = patientInput.match(pattern);
      if (matches) timeMatches.push(...matches);
    });
    
    if (timeMatches.length > 0) {
      summary.extractedInfo.duration = timeMatches;
    }

    // Extract severity indicators
    const severityWords = {
      severe: ['severe', 'terrible', 'unbearable', 'excruciating', 'worst'],
      moderate: ['moderate', 'significant', 'bothersome', 'uncomfortable'],
      mild: ['mild', 'slight', 'minor', 'little']
    };

    for (const [level, words] of Object.entries(severityWords)) {
      if (words.some(word => patientInput.toLowerCase().includes(word))) {
        summary.extractedInfo.severityIndicator = level;
        break;
      }
    }

    // Extract common symptoms
    const commonSymptoms = [
      'pain', 'ache', 'headache', 'fever', 'cough', 'nausea',
      'dizzy', 'tired', 'fatigue', 'rash', 'swelling', 'bleeding'
    ];

    const foundSymptoms = commonSymptoms.filter(symptom => 
      patientInput.toLowerCase().includes(symptom)
    );

    if (foundSymptoms.length > 0) {
      summary.extractedInfo.possibleSymptoms = foundSymptoms;
    }

    // Extract medications mentioned
    const medicationPattern = /(?:taking|on|prescribed)\s+([A-Z][a-z]+(?:in|ol|ide|ate|ine)?)\b/g;
    const medications = [];
    let match;
    while ((match = medicationPattern.exec(patientInput)) !== null) {
      medications.push(match[1]);
    }

    if (medications.length > 0) {
      summary.extractedInfo.mentionedMedications = medications;
    }

    return summary;
  }

  /**
   * Format summary for display to doctor
   */
  formatForDoctor(summary) {
    if (summary.format === 'structured') {
      return `
PATIENT SUMMARY
Generated: ${new Date(summary.timestamp).toLocaleString()}

CHIEF COMPLAINT:
${summary.chiefComplaint}

PRESENT ILLNESS:
${summary.symptoms.map(s => 
  `• ${s.symptom} - ${s.severity} severity, ${s.duration}, ${s.frequency}
  ${s.notes ? '  Note: ' + s.notes : ''}`
).join('\n')}

FUNCTIONAL IMPACT:
${summary.functionalImpact}

RELEVANT HISTORY:
${summary.relevantHistory.medicalConditions.length > 0 ? 
  '• Conditions: ' + summary.relevantHistory.medicalConditions.join(', ') : ''}
${summary.relevantHistory.medications.length > 0 ? 
  '• Medications: ' + summary.relevantHistory.medications.join(', ') : ''}
${summary.relevantHistory.allergies.length > 0 ? 
  '• Allergies: ' + summary.relevantHistory.allergies.join(', ') : ''}
${summary.relevantHistory.recentChanges ? 
  '• Recent Changes: ' + summary.relevantHistory.recentChanges : ''}

PATIENT CONCERNS:
${summary.patientConcerns}

${summary.redFlags && summary.redFlags.length > 0 ? 
  `⚠️ RED FLAGS:\n${summary.redFlags.map(f => '• ' + f).join('\n')}` : ''}

SUGGESTED FOLLOW-UP QUESTIONS:
${summary.suggestedQuestions.map(q => '• ' + q).join('\n')}
`;
    } else {
      return `
PATIENT SUMMARY
Generated: ${new Date(summary.timestamp).toLocaleString()}

${summary.narrative}
`;
    }
  }
}

// Example usage without API (demonstration)
function demonstrateUsage() {
  const generator = new PatientSummaryGenerator();
  
  // Example patient input
  const patientInput = `I've been having really bad headaches for about 2 weeks now. They usually start in the morning and get worse throughout the day. The pain is mostly on the right side of my head and feels like a throbbing sensation. I've been taking ibuprofen but it only helps a little bit. I also feel nauseous sometimes when the headache is really bad. I'm worried because my mom had migraines and I don't want this to be the same thing. It's been hard to focus at work because of the pain.`;

  // Generate quick summary (no API needed)
  const quickSummary = generator.generateQuickSummary(patientInput);
  console.log('Quick Summary:', JSON.stringify(quickSummary, null, 2));

  // To use with API:
  // const generator = new PatientSummaryGenerator('your-api-key');
  // const summary = await generator.generateDoctorSummary(patientInput);
  // console.log(generator.formatForDoctor(summary));
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PatientSummaryGenerator;
}

// Run demonstration
demonstrateUsage();