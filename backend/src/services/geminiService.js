const https = require('https');
const logger = require('../config/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

/**
 * Make a direct HTTPS call to Google Generative Language API
 */
function callGemini(model, prompt, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1500
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000 // 15 seconds timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode === 200 && json.candidates?.[0]?.content?.parts?.[0]?.text) {
            resolve({
              success: true,
              model,
              text: json.candidates[0].content.parts[0].text
            });
          } else {
            const errMsg = json.error?.message || `HTTP ${res.statusCode}: ${body}`;
            reject(new Error(errMsg));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Gemini request timeout (${model})`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Parses JSON or structured text analysis into distinct sections
 */
function parseAnalysisSections(rawText) {
  const result = {
    executiveSummary: '',
    studentFacultyCollaboration: '',
    researchAndOutreach: '',
    recommendations: ''
  };

  if (!rawText) return result;

  // Attempt JSON parsing first
  try {
    const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.executiveSummary || parsed.studentFacultyCollaboration) {
      result.executiveSummary = String(parsed.executiveSummary || '').trim();
      result.studentFacultyCollaboration = String(parsed.studentFacultyCollaboration || '').trim();
      result.researchAndOutreach = String(parsed.researchAndOutreach || '').trim();
      result.recommendations = String(parsed.recommendations || '').trim();
      return result;
    }
  } catch (e) {
    // Fall back to regex parsing below
  }

  // Regex-based section extraction
  const sec1Match = rawText.match(/(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?EXECUTIVE ACADEMIC EVALUATION[:\*]??)([\s\S]*?)(?=(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?STUDENT & FACULTY COLLABORATION|$))/i);
  const sec2Match = rawText.match(/(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?STUDENT & FACULTY COLLABORATION(?: ANALYSIS)?[:\*]??)([\s\S]*?)(?=(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?RESEARCH|$))/i);
  const sec3Match = rawText.match(/(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?RESEARCH[^\n]*?[:\*]??)([\s\S]*?)(?=(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?(?:ACCREDITATION|STRATEGIC RECOMMENDATIONS)|$))/i);
  const sec4Match = rawText.match(/(?:(?:###\s*|\*\*\s*|[0-9]\.\s*)?(?:ACCREDITATION|STRATEGIC RECOMMENDATIONS)[^\n]*?[:\*]??)([\s\S]*)$/i);

  result.executiveSummary = (sec1Match ? sec1Match[1] : '').replace(/^\s*[\*#:\-]+\s*/gm, '').trim();
  result.studentFacultyCollaboration = (sec2Match ? sec2Match[1] : '').replace(/^\s*[\*#:\-]+\s*/gm, '').trim();
  result.researchAndOutreach = (sec3Match ? sec3Match[1] : '').replace(/^\s*[\*#:\-]+\s*/gm, '').trim();
  result.recommendations = (sec4Match ? sec4Match[1] : '').replace(/^\s*[\*#:\-]+\s*/gm, '').trim();

  // If regex parsing didn't match cleanly, provide the entire text under executiveSummary
  if (!result.executiveSummary && !result.studentFacultyCollaboration) {
    result.executiveSummary = rawText.replace(/[*#]/g, '').trim();
  }

  return result;
}

/**
 * Analyze monthly achievements dataset with Gemini Flash model
 */
async function generateAcademicAuditAnalysis(dataset) {
  const staffName = dataset.staff?.name || dataset.staffUser?.displayName || 'Faculty Member';
  const department = dataset.staff?.department || dataset.staffUser?.department || 'Academic Department';
  const cycle = dataset.month?.monthName ? `${dataset.month.monthName} ${dataset.month.yearId?.yearKey || ''}`.trim() : (dataset.month || 'Current Reporting Cycle');

  if (!GEMINI_API_KEY) {
    logger.warn('GEMINI_API_KEY not configured. Falling back to default deterministic audit summary.');
    return generateLocalFallbackSummary(dataset);
  }

  const prompt = `You are a Senior Institutional Accreditation Auditor & Evaluator specializing in Higher Education standards (NBA Criteria, NAAC, NIRF).
Analyze the following comprehensive monthly academic achievements dataset for staff member "${staffName}" (${department}) for the cycle "${cycle}".

DATASET:
${JSON.stringify(dataset, null, 2)}

Provide an authoritative, detailed, and professionally structured academic evaluation.
Return your response strictly as a JSON object with exactly these keys:
{
  "executiveSummary": "Thorough evaluation of the staff member's productivity and achievements across teaching, research, and institutional contribution.",
  "studentFacultyCollaboration": "Detailed analysis of student engagement, faculty mentorship, co-curricular outcomes, and project collaboration.",
  "researchAndOutreach": "Assessment of research papers, industry linkages, patents, corporate training, guest sessions, and societal outreach.",
  "recommendations": "2-3 specific, high-impact recommendations for accreditation readiness (NAAC/NBA) in the upcoming reporting cycle."
}
Keep each field concise, analytical, and professional (around 60-90 words per section).`;

  // Try primary model first, followed by fallbacks if necessary
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

  for (const model of modelsToTry) {
    try {
      logger.info({ model }, 'Calling Gemini API for academic analysis...');
      const result = await callGemini(model, prompt, GEMINI_API_KEY);
      if (result.success && result.text) {
        logger.info({ model }, 'Gemini academic analysis generated successfully.');
        const parsed = parseAnalysisSections(result.text);
        return {
          aiGenerated: true,
          modelUsed: model,
          analysisText: result.text,
          ...parsed
        };
      }
    } catch (err) {
      logger.warn({ model, error: err.message }, 'Gemini API call failed for model, trying next fallback...');
    }
  }

  // Graceful fallback if all API calls fail
  logger.error('All Gemini API models failed or timed out. Generating deterministic audit analysis.');
  return generateLocalFallbackSummary(dataset);
}

/**
 * Deterministic local fallback in case of network or API outage
 */
function generateLocalFallbackSummary(dataset) {
  const staffName = dataset.staff?.name || dataset.staffUser?.displayName || 'Faculty Member';
  const totalEntries = dataset.stats?.totalEntries || dataset.totalEntries || 0;
  const studentsCount = dataset.stats?.studentsEngaged || (dataset.studentRoster ? dataset.studentRoster.length : 0);
  const sheetsCount = dataset.stats?.nonEmptySheets || (dataset.reportSections ? dataset.reportSections.length : 0);

  const fallbackText = `1. EXECUTIVE ACADEMIC EVALUATION
During this reporting period, ${staffName} recorded a cumulative total of ${totalEntries} academic activities across ${sheetsCount} active departmental criteria sheets. The portfolio reflects continuous involvement in departmental responsibilities and student development activities aligned with institutional standards.

2. STUDENT & FACULTY COLLABORATION ANALYSIS
A total of ${studentsCount} students actively collaborated or participated under the guidance and mentorship of ${staffName}. Faculty-guided initiatives encompassed project mentorship, technical training, and participation in competitive events, reinforcing experiential learning outcomes.

3. RESEARCH, INDUSTRY LINKAGES & COMMUNITY OUTREACH
The faculty portfolio demonstrates consistent engagement with industry and academic networks. Collaborative activities, guest lectures, and student projects conducted during this cycle bridge academic theory with practical engineering applications.

4. ACCREDITATION RECOMMENDATIONS & ACTION PLAN
For subsequent accreditation reviews, it is recommended to expand co-authored research publications in indexed journals (Scopus/WoS), secure funded research or consultancy grants, and systematize student outcome attainment documentation.`;

  const parsed = parseAnalysisSections(fallbackText);
  return {
    aiGenerated: false,
    modelUsed: 'deterministic-fallback',
    analysisText: fallbackText,
    ...parsed
  };
}

module.exports = {
  generateAcademicAuditAnalysis
};
