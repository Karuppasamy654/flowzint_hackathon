function analyzeRequest(text) {
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
    const highUrgency = /urgent|emergency|asap|immediately|dying|critical|life.?threatening|accident|bleeding|help now|sos|please help/i;
    const medUrgency = /soon|today|need|required|important|quickly|fast/i;

    if (highUrgency.test(lower)) urgency = 'high';
    else if (medUrgency.test(lower)) urgency = 'medium';

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

    return {
        type,
        urgency,
        location,
        skillsNeeded,
        bloodGroup,
        summary: generateSummary(type, urgency, bloodGroup),
        confidence: 0.92
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
            '🩸 Contact nearest blood bank via 1800-XXX-XXXX',
            '📱 Share your blood group info with potential donors',
            '🏥 Nearest hospitals with blood banks are being identified',
            '⏱️ Blood requests typically get matched within 15 minutes'
        ],
        medical: [
            '🚑 Call 108 for medical emergency ambulance',
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

module.exports = { analyzeRequest, detectFakeRequest, getQuickAssist };
