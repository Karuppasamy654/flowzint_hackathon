// Local regex-based fallback classifier
function fallbackAnalyzeRequest(text) {
    const lower = text.toLowerCase();

    // Detect request type
    let type = 'general';
    const typePatterns = {
        blood: /blood|donor|transfusion|plasma|platelet|o\+|o-|a\+|a-|b\+|b-|ab\+|ab-/i,
        medical: /medical|doctor|hospital|ambulance|emergency|injury|accident|health|medicine|sick|pain/i,
        study: /study|tutor|exam|homework|assignment|learn|teach|course|math|science|engineering/i,
        money: /money|financial|fund|loan|rent|fee|payment|donate|crowdfund|rupee|dollar/i,
        food: /food|hungry|meal|cook|ration|grocery|eat|starving/i,
        shelter: /shelter|accommodation|house|room|stay|homeless|roof/i,
        transport: /transport|ride|cab|travel|pick.?up|drop|vehicle|drive/i,
        mental_health: /mental|anxiety|depression|stress|counsel|therapy|lonely|suicide|sad/i,
        legal: /legal|lawyer|police|fir|court|rights|harassment|abuse/i
    };

    for (const [t, pattern] of Object.entries(typePatterns)) {
        if (pattern.test(lower)) {
            type = t;
            break;
        }
    }

    // Detect urgency
    let urgency = 'low';
    let emergencyScore = 30;
    const highUrgency = /urgent|emergency|asap|immediately|dying|critical|life.?threatening|accident|bleeding|help now|sos|please help/i;
    const medUrgency = /soon|today|need|required|important|quickly|fast/i;

    if (highUrgency.test(lower)) {
        urgency = 'high';
        emergencyScore = 90;
    } else if (medUrgency.test(lower)) {
        urgency = 'medium';
        emergencyScore = 60;
    }

    // Detect location
    let location = { lat: 28.6139, lng: 77.2090, label: 'Central Delhi (auto-detected)' };
    const locationPatterns = {
        'Connaught Place': { lat: 28.6315, lng: 77.2167 },
        'Karol Bagh': { lat: 28.6519, lng: 77.1905 },
        'Saket': { lat: 28.5244, lng: 77.2066 },
        'Dwarka': { lat: 28.5921, lng: 77.0460 },
        'Rohini': { lat: 28.7495, lng: 77.0565 }
    };

    for (const [name, coords] of Object.entries(locationPatterns)) {
        if (lower.includes(name.toLowerCase())) {
            location = { ...coords, label: name };
            break;
        }
    }

    // Detect relevant skills needed
    const skillsNeeded = [];
    if (type === 'blood') skillsNeeded.push('blood_donation', 'medical');
    if (type === 'medical') skillsNeeded.push('medical', 'first_aid', 'emergency');
    if (type === 'study') skillsNeeded.push('tutoring');
    if (type === 'money') skillsNeeded.push('financial_help', 'crowdfunding');
    if (type === 'food') skillsNeeded.push('food_supply', 'cooking');
    if (type === 'shelter') skillsNeeded.push('shelter', 'accommodation');
    if (type === 'transport') skillsNeeded.push('transport', 'driving');
    if (type === 'mental_health') skillsNeeded.push('counseling', 'mental_health');
    if (type === 'legal') skillsNeeded.push('legal_aid');

    // Extract blood group if mentioned
    let bloodGroup = null;
    const bgMatch = lower.match(/\b(o|a|b|ab)[+-]\b/i);
    if (bgMatch) bloodGroup = bgMatch[0].toUpperCase();

    // Sentiment detection
    let sentiment = 'neutral';
    if (/dying|scared|panic|pain|please|sos|bleeding|critical|emergency/i.test(lower)) sentiment = 'desperate';
    else if (/sad|depressed|lonely|anxiety/i.test(lower)) sentiment = 'anxious';

    const riskLevel = urgency === 'high' ? 'critical' : urgency === 'medium' ? 'high' : 'medium';
    
    // Extract keywords
    const keywordsSet = new Set();
    const matches = lower.match(/\b(blood|medical|emergency|critical|urgency|accident|injury|oxygen|help|dying|pain|hospital|doctor|ambulance|first.?aid|sos|asap)\b/g);
    if (matches) matches.forEach(m => keywordsSet.add(m));
    const detectedKeywords = Array.from(keywordsSet);

    const reasoning = `Detected high-risk emergency markers (${detectedKeywords.join(', ') || 'general help'}). Matching immediately with nearby ${type} specialists.`;

    return {
        type,
        urgency,
        location,
        skillsNeeded,
        bloodGroup,
        summary: generateSummary(type, urgency, bloodGroup),
        confidence: 0.85,
        emergencyScore,
        urgencyScore: emergencyScore,
        riskLevel,
        reasoning,
        detectedKeywords,
        sentiment,
        quickAssist: getQuickAssist({ type })
    };
}

function generateSummary(type, urgency, bloodGroup) {
    const typeLabels = {
        blood: 'Blood Donation Request',
        medical: 'Medical Emergency',
        study: 'Study/Academic Help',
        money: 'Financial Assistance',
        food: 'Food/Nutrition Help',
        shelter: 'Shelter/Housing Help',
        transport: 'Transportation Help',
        mental_health: 'Mental Health Support',
        legal: 'Legal Assistance',
        general: 'General Help Request'
    };

    let summary = typeLabels[type] || 'General Request';
    if (bloodGroup) summary += ` (${bloodGroup})`;
    summary += ` — Urgency: ${urgency.toUpperCase()}`;
    return summary;
}

function detectFakeRequest(text) {
    const lower = text.toLowerCase();
    const spamPatterns = [
        /buy now/i, /click here/i, /free money/i, /lottery/i,
        /nigerian prince/i, /send me \$\d+/i, /bitcoin/i,
        /(.)\1{10,}/  // Repeated characters
    ];
    const isFake = spamPatterns.some(p => p.test(lower));
    const tooShort = text.trim().length < 5;

    return {
        isFake: isFake || tooShort,
        reason: isFake ? 'Detected spam patterns' : tooShort ? 'Request too short' : null,
        confidence: isFake ? 0.85 : tooShort ? 0.70 : 0
    };
}

function getQuickAssist(analysis) {
    const tips = {
        blood: [
            '🩸 Contact nearest blood bank via 1800-11-8700',
            '📱 Share your blood group info with potential donors',
            '🏥 Nearest hospitals with blood banks are being identified',
            '⏱️ Blood requests typically get matched within 15 minutes'
        ],
        medical: [
            '🚑 Call 102/108 for medical emergency ambulance',
            '💊 Keep any current medications accessible',
            '📋 Prepare a brief medical history if possible',
            '🏥 Nearest hospitals are being identified'
        ],
        study: [
            '📚 Check online resources while waiting for a tutor',
            '🎓 University help desks can provide additional support',
            '💡 Break your problem into smaller parts',
            '📝 Prepare specific questions for your helper'
        ],
        money: [
            '💰 Verify eligibility for government aid programs',
            '📋 Prepare documentation of your financial situation',
            '🏦 Contact local NGOs for emergency financial aid',
            '🤝 Community support networks are being activated'
        ],
        food: [
            '🍲 Community kitchens in your area are being identified',
            '📍 Nearest food banks are being located',
            '🤝 Local volunteers are being notified',
            '⏱️ Help typically arrives within 30 minutes'
        ],
        mental_health: [
            '🧘 Take slow, deep breaths — you are not alone',
            '📞 Vandrevala Foundation Helpline: 1860-2662-345',
            '💬 iCall: 9152987821 (Mon-Sat, 8am-10pm)',
            '🤝 A trained counselor will connect with you shortly'
        ],
        general: [
            '📋 Provide as much detail as possible for faster matching',
            '📍 Share your location for proximity-based matching',
            '⏱️ Our system typically finds help within 5 minutes',
            '🤝 You are connected to multiple helper communities'
        ]
    };

    return tips[analysis.type] || tips.general;
}

// Google Gemini API integration
async function analyzeRequest(text) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log('[AI Service] No GEMINI_API_KEY found in environment. Falling back to local Regex parser...');
        return fallbackAnalyzeRequest(text);
    }

    try {
        const systemPrompt = `Analyze the following social crisis request text. Classify and extract metadata.
You must return a valid, parsable JSON object EXACTLY conforming to this JSON schema (do not wrap in markdown or backticks like \`\`\`json, return the raw JSON text directly):
{
  "type": "blood" | "medical" | "study" | "money" | "food" | "shelter" | "transport" | "mental_health" | "legal" | "general",
  "urgency": "high" | "medium" | "low",
  "location": {
     "lat": number,
     "lng": number,
     "label": string
  },
  "skillsNeeded": [string],
  "bloodGroup": string | null,
  "summary": string,
  "confidence": number,
  "emergencyScore": number,
  "urgencyScore": number,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "reasoning": string,
  "detectedKeywords": [string],
  "sentiment": string,
  "quickAssist": [string]
}

For locations in Delhi, default coordinates if not matched specifically:
- Connaught Place: { "lat": 28.6315, "lng": 77.2167 }
- Karol Bagh: { "lat": 28.6519, "lng": 77.1905 }
- Saket: { "lat": 28.5244, "lng": 77.2066 }
- Dwarka: { "lat": 28.5921, "lng": 77.0460 }
- Rohini: { "lat": 28.7495, "lng": 77.0565 }
If no specific Delhi locality is matched, use default Delhi center: { "lat": 28.6139, "lng": 77.2090, "label": "Delhi" }.

Request Text: "${text.replace(/"/g, '\\"')}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemPrompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            throw new Error('Empty response from Gemini API');
        }

        const parsedAnalysis = JSON.parse(responseText.trim());
        
        // Ensure standard keys exist
        return {
            type: parsedAnalysis.type || 'general',
            urgency: parsedAnalysis.urgency || 'low',
            location: parsedAnalysis.location || { lat: 28.6139, lng: 77.2090, label: 'Delhi' },
            skillsNeeded: parsedAnalysis.skillsNeeded || [],
            bloodGroup: parsedAnalysis.bloodGroup || null,
            summary: parsedAnalysis.summary || generateSummary(parsedAnalysis.type || 'general', parsedAnalysis.urgency || 'low', parsedAnalysis.bloodGroup),
            confidence: parsedAnalysis.confidence || 0.9,
            emergencyScore: parsedAnalysis.emergencyScore || 50,
            urgencyScore: parsedAnalysis.urgencyScore || parsedAnalysis.emergencyScore || 50,
            riskLevel: parsedAnalysis.riskLevel || (parsedAnalysis.urgency === 'high' ? 'critical' : parsedAnalysis.urgency === 'medium' ? 'high' : 'medium'),
            reasoning: parsedAnalysis.reasoning || `Classified as ${parsedAnalysis.type} with ${parsedAnalysis.urgency} urgency. Dispatching network scans.`,
            detectedKeywords: parsedAnalysis.detectedKeywords || [parsedAnalysis.type || 'help'],
            sentiment: parsedAnalysis.sentiment || 'neutral',
            quickAssist: parsedAnalysis.quickAssist || getQuickAssist({ type: parsedAnalysis.type || 'general' })
        };
    } catch (err) {
        console.error('[AI Service] Gemini API Call failed:', err.message);
        console.log('[AI Service] Falling back to local Regex parser...');
        return fallbackAnalyzeRequest(text);
    }
}

function fallbackSuggestRequestRefinement(title, description) {
    const text = (title + " " + description).toLowerCase();
    let category = 'General Help';
    let tags = ['General'];
    let solutions = [
        '💡 Try explaining the problem to someone else (Rubber Duck debugging)',
        '🔍 Search official documentation for key error statements',
        '⏱️ Break down the task into smaller steps and verify each one'
    ];

    if (text.includes('react') || text.includes('js') || text.includes('javascript') || text.includes('state') || text.includes('css') || text.includes('html') || text.includes('vite') || text.includes('tailwind')) {
        category = 'Web Development';
        tags = ['React', 'JavaScript', 'TailwindCSS'];
        solutions = [
            '📦 Verify your package.json node_modules are fully installed',
            '💡 Check console logs and React Developer Tools to trace state updates',
            '🔧 Ensure components are correctly mounted and props are not undefined'
        ];
    } else if (text.includes('figma') || text.includes('ux') || text.includes('ui') || text.includes('design') || text.includes('photoshop')) {
        category = 'Design';
        tags = ['UI/UX', 'Figma', 'Design System'];
        solutions = [
            '📐 Check alignment grids and component autolayout settings in Figma',
            '🎨 Ensure consistent color palette tokens are mapped to your variables',
            '💡 Benchmark your spacing against popular design systems like Material UI'
        ];
    } else if (text.includes('resume') || text.includes('cv') || text.includes('interview') || text.includes('career') || text.includes('job')) {
        category = 'Career Advice';
        tags = ['Resume Review', 'Interview Prep'];
        solutions = [
            '📝 Ensure your resume utilizes action verbs and quantifies bullet metrics',
            '💼 Format details cleanly using the Harvard Resume Style guide',
            '🤝 Practice STAR method response sheets for behavioral queries'
        ];
    } else if (text.includes('math') || text.includes('physics') || text.includes('calculus') || text.includes('exam') || text.includes('homework') || text.includes('college')) {
        category = 'Academics';
        tags = ['Mathematics', 'Tutoring'];
        solutions = [
            '📝 Review the basic formulas and work through a simple example problem',
            '📚 Consult khan academy or textbook worksheets for similar derivations',
            '💡 Write down assumptions and boundary conditions first before executing'
        ];
    } else if (text.includes('blood') || text.includes('hospital') || text.includes('donor') || text.includes('emergency')) {
        category = 'Medical / Blood Donation';
        tags = ['First Aid', 'Blood Donation'];
        solutions = [
            '🩸 Contact nearest blood bank via central helpline 1800-11-8700',
            '🏥 Identify nearest government or private hospital ICU unit locations',
            '🚨 Alert local neighborhood WhatsApp communities with exact details'
        ];
    }

    return {
        titleSuggestions: [
            `Optimize: ${title}`,
            `Need help with: ${title} / ${tags[0] || 'General'}`
        ],
        category,
        tags,
        possibleSolutions: solutions
    };
}

async function suggestRequestRefinement(title, description) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.log('[AI Service] No GEMINI_API_KEY found. Using fallback suggestions.');
        return fallbackSuggestRequestRefinement(title, description);
    }

    try {
        const systemPrompt = `You are a helpful assistant for FlowZint (a peer matching help platform).
Analyze the following user help request:
Title: "${title}"
Description: "${description}"

Provide request optimization suggestions. You MUST return a valid, parsable JSON object conforming to this exact schema (do not wrap in markdown or backticks):
{
  "titleSuggestions": [string, string],
  "category": string,
  "tags": [string],
  "possibleSolutions": [string, string, string]
}

Suggested Categories: Web Development, Design, Career Advice, Academics, Medical, Blood Donation, Volunteering, General Help.
Return the raw JSON text directly.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: { responseMimeType: 'application/json' }
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!responseText) throw new Error('Empty response');

        const parsed = JSON.parse(responseText.trim());
        return {
            titleSuggestions: parsed.titleSuggestions || [`Refine: ${title}`, `Review: ${title}`],
            category: parsed.category || 'General Help',
            tags: parsed.tags || ['General'],
            possibleSolutions: parsed.possibleSolutions || [
                '💡 Review details and specifications in your request text',
                '🔍 Search documentation on the related tags',
                '🤝 Connect with online helpers on FlowZint for assistance'
            ]
        };
    } catch (err) {
        console.error('[AI Service] Gemini refine request failed:', err.message);
        return fallbackSuggestRequestRefinement(title, description);
    }
}

module.exports = { 
    analyzeRequest, 
    detectFakeRequest, 
    getQuickAssist, 
    fallbackAnalyzeRequest,
    suggestRequestRefinement 
};
