
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    QuizQuestion, MentorPersona, GigOffer, CharacterClass, ContractClause,
    TermSheetClause, Gemstone, MarketNews, InvestorProfile, FinalExamQuestion,
    ScopeCreepEvent, UpsellOpportunity, PropertyListing, StartupOpportunity,
    PitchEvaluation, ClientTrait, StartupRegion, StartupSector, PitchSectionType
} from "../types";

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "").trim();
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Robustly extracts JSON from a string that might contain conversational text.
 */
const extractJson = (text: string) => {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch (e) {
        // Try regex match for JSON blocks
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (innerE) {
                console.error("Failed to parse extracted JSON:", innerE);
                return null;
            }
        }
        return null;
    }
};

/**
 * Executes an AI prompt with retries and robust JSON handling.
 */
const runAIPrompt = async (prompt: string, isJson: boolean = false, retries: number = 2) => {
    if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
        console.warn("Gemini API Key is missing or placeholder. Using fallback data.");
        return null;
    }

    for (let i = 0; i <= retries; i++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
            });
            const text = result.response.text();

            if (isJson) {
                const parsed = extractJson(text);
                if (parsed) return parsed;
                // If parsing failed but we still have retries, continue
            } else {
                return text;
            }
        } catch (error: any) {
            console.error(`Gemini AI Error (Attempt ${i + 1}):`, error);

            // Exponential backoff for rate limits
            if (error.status === 429 && i < retries) {
                const wait = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, wait));
                continue;
            }

            if (i === retries) return null;
        }
    }
    return null;
};

const MENTOR_MAP: Record<MentorPersona, { name: string, description: string }> = {
    'WALL_ST': { name: 'The Wall St. Shark', description: 'Aggressive, profit-focused, and highly cynical. Values growth above all.' },
    'ZEN_MONK': { name: 'The Zen Monk', description: 'Patient, holistic, and focused on sustainable wealth and mental peace.' },
    'GAMER_BRO': { name: 'The Gamer Bro', description: 'Energetic, high-risk, and talks in RPG terms. Loves big "plays".' }
};

export const getMentorFeedback = async (action: string, persona: MentorPersona): Promise<string> => {
    const details = MENTOR_MAP[persona];
    const prompt = `You are a business mentor with the persona: ${details.name}. Description: ${details.description}. 
    The player just did this action: ${action}. 
    Give a short, punchy, personality-driven piece of advice (max 2 sentences).`;

    const feedback = await runAIPrompt(prompt);
    return feedback || "Keep grinding, the ledger doesn't balance itself.";
};

export const getQuizScenario = async (topic: string): Promise<QuizQuestion> => {
    const prompt = `Generate a multiple-choice quiz question about: ${topic}. 
    Return a JSON object: { "question": string, "options": [{ "id": "A"|"B"|"C", "text": string, "isCorrect": boolean }], "explanation": string }. 
    Make it educational and challenging.`;

    const result = await runAIPrompt(prompt, true);
    return result || {
        question: `How do you handle ${topic}?`,
        options: [{ id: "A", text: "Do it correctly", isCorrect: true }, { id: "B", text: "Do it wrong", isCorrect: false }],
        explanation: "Always follow compliance."
    };
};

export const negotiateContract = async (
    role: CharacterClass,
    bid: number,
    hasTemplate: boolean,
    clientVibe: string,
    paymentTerm: string
): Promise<{ accepted: boolean, message: string }> => {
    const prompt = `You are a client with a '${clientVibe}' vibe. A '${role}' is bidding $${bid} for a project. 
    They ${hasTemplate ? 'have' : 'lack'} a professional invoice template. Payment terms: ${paymentTerm}.
    Decide if you accept or reject (or counter). 
    Return JSON: { "accepted": boolean, "message": string }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { accepted: true, message: "Fine, let's do it." };
};

export const generateScopeCreep = async (): Promise<ScopeCreepEvent> => {
    const prompt = `Generate a 'Scope Creep' event for a freelance project. 
    Return JSON: { "title": string, "description": string, "impactCost": number }. 
    Cost should be between 200 and 1500.`;

    const result = await runAIPrompt(prompt, true);
    return result || { title: "Extra Revisions", description: "The client wants 'just one more thing'.", impactCost: 500 };
};

export const generateUpsellOpportunity = async (): Promise<UpsellOpportunity> => {
    const prompt = `Generate an 'Upsell' opportunity where a freelancer can sell more services. 
    Return JSON: { "title": string, "description": string, "potentialRevenue": number, "costEnergy": number }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { title: "Maintenance Retainer", description: "Suggest a monthly support plan.", potentialRevenue: 1000, costEnergy: 20 };
};

export const checkW8BEN = async (data: any, expectedArticle: string): Promise<{ valid: boolean, message: string }> => {
    const prompt = `Evaluate this W-8BEN form data: ${JSON.stringify(data)}. 
    Is the 'article' provided (${data.article}) correct for '${expectedArticle}'?
    Return JSON: { "valid": boolean, "message": string }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { valid: true, message: "Valid submission." };
};

export const generateRealEstateListing = async (): Promise<PropertyListing> => {
    const prompt = `Generate a realistic real estate investment listing. 
    Return JSON: { "id": string, "name": string, "type": "RESIDENTIAL"|"COMMERCIAL", "price": number, "location": string, "rentalYield": number, "condition": number (0-100), "appreciationRate": number (0-0.1), "isOffMarket": boolean, "downPaymentPct": number }.`;

    const result = await runAIPrompt(prompt, true);
    return result || {
        id: Date.now().toString(),
        name: "Sunset Apartments",
        type: 'RESIDENTIAL',
        price: 450000,
        location: "Mumbai Suburbs",
        rentalYield: 4.5,
        condition: 85,
        appreciationRate: 0.05,
        isOffMarket: false,
        downPaymentPct: 20
    };
};

export const generateStartupPitch = async (): Promise<StartupOpportunity> => {
    return generateGlobalStartup('SILICON_VALLEY', 'AI_INFRA');
};

export const evaluatePitch = async (pitch: string): Promise<number> => {
    const prompt = `On a scale of 1-100, how good is this startup pitch: "${pitch}"? 
    Return only the number.`;

    const result = await runAIPrompt(prompt);
    return parseInt(result || "80") || 80;
};

export const generateFinalExam = async (): Promise<FinalExamQuestion[]> => {
    const prompt = `Generate 3 advanced financial strategy questions for an 'Audit' session. 
    Return JSON array: [{ "question": string, "options": [{ "id": "A"|"B"|"C", "text": string, "isCorrect": boolean }] }].`;

    const result = await runAIPrompt(prompt, true);
    return result || [{
        question: "What is the primary benefit of Section 44ADA?",
        options: [{ id: "A", text: "Flat 50% Profit", isCorrect: true }, { id: "B", text: "No GST", isCorrect: false }]
    }];
};

export const analyzePitchSection = async (text: string, type: PitchSectionType, traits: ClientTrait[]): Promise<PitchEvaluation> => {
    const prompt = `Analyze this ${type} section of a pitch: "${text}". 
    The client has these traits: ${traits.join(', ')}. 
    Return JSON: { "score": number (0-100), "tone": "ASSERTIVE"|"EMPATHETIC"|"DATA_DRIVEN", "feedback": string }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { score: 85, tone: 'ASSERTIVE', feedback: "Strong opening." };
};

export const generateClientObjection = async (pitch: string): Promise<{ objection: string, correctRebuttal: string }> => {
    const prompt = `Based on this pitch: "${pitch}", generate a tough client objection. 
    Return JSON: { "objection": string, "correctRebuttal": string (hint) }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { objection: "Your price is much higher than local competitors.", correctRebuttal: "Focus on Value over Cost." };
};

export const explainConcept = async (term: string, persona: MentorPersona): Promise<string> => {
    const details = MENTOR_MAP[persona] || MENTOR_MAP['NONE'];
    const prompt = `Explain '${term}' as the mentor ${details.name}. Keep it under 50 words.`;
    const result = await runAIPrompt(prompt);
    return result || `${term} is essential for your growth.`;
};

export const getSpacedRepetitionQuestion = async (level: number): Promise<QuizQuestion> => {
    const prompt = `Generate a review question for Level ${level} of a financial game. 
    Return JSON: { "question": string, "options": [{ "id": "A"|"B"|"C", "text": string, "isCorrect": boolean }], "explanation": string }.`;

    const result = await runAIPrompt(prompt, true);
    return result || {
        question: "Ready for a review?",
        options: [{ id: "A", text: "Yes", isCorrect: true }, { id: "B", text: "No", isCorrect: false }],
        explanation: "Stay sharp."
    };
};

export const generateGigOffer = async (): Promise<GigOffer> => {
    const prompt = `Generate a freelance gig offer. 
    Return JSON: { "clientName": string, "projectTitle": string, "budget": string, "description": string, "isGoodDeal": boolean, "flags": string[] }.`;

    const result = await runAIPrompt(prompt, true);
    return result || {
        clientName: "Alpha Corp",
        projectTitle: "Dashboard Redesign",
        budget: "$2,500",
        description: "Modernize our legacy internal tools.",
        isGoodDeal: true,
        flags: ["Professional", "Urgent"]
    };
};

export const generateContractScenarios = async (): Promise<ContractClause[]> => {
    const prompt = `Generate 3 contract clauses (some predatory, some safe). 
    Return JSON array: [{ "id": string, "text": string, "type": "SAFE"|"PREDATORY"|"IDEAL", "explanation": string }].`;

    const result = await runAIPrompt(prompt, true);
    return result || [{ id: "1", text: "Net 90 Payment Terms", type: 'PREDATORY' as any, explanation: "Too slow for cashflow." }];
};

export const generateInvestors = async (): Promise<InvestorProfile[]> => {
    const prompt = `Generate 3 potential startup investors. 
    Return JSON array: [{ "name": string, "firm": string, "style": string, "offerValuation": number, "offerAmount": number }].`;

    const result = await runAIPrompt(prompt, true);
    return result || [{ name: "Sarah Chen", firm: "Nebula Ventures", style: "Founder Friendly", offerValuation: 5000000, offerAmount: 500000 }];
};

export const generateTermSheet = async (): Promise<TermSheetClause[]> => {
    const prompt = `Generate 3 term sheet clauses. 
    Return JSON array: [{ "id": string, "term": string, "description": string, "isStandard": boolean }].`;

    const result = await runAIPrompt(prompt, true);
    return result || [{ id: "1", term: "Liquidation Preference", description: "1x Non-participating", isStandard: true }];
};

export const generateCommodityEvent = async (): Promise<MarketNews> => {
    const prompt = `Generate a 'Market News' event affecting commodities (Oil, Gold, etc.). 
    Return JSON: { "headline": string, "lore": string, "sector": string, "impact": "BULLISH"|"BEARISH" }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { headline: "Pipeline Leak", lore: "Major infrastructure failure in the North Sea.", sector: "ENERGY", impact: 'BULLISH' };
};

export const appraiseGemstone = async (name: string): Promise<Gemstone> => {
    const prompt = `Appraise this gemstone: "${name}". 
    Return JSON: { "id": string, "name": string, "description": string, "trueValue": number, "askingPrice": number }.`;

    const result = await runAIPrompt(prompt, true);
    return result || { id: "1", name, description: "A sparkling prospect.", trueValue: 1200, askingPrice: 1000 };
};

export const generateHiddenGem = async (): Promise<PropertyListing> => {
    return generateRealEstateListing();
};

export const generateGlobalStartup = async (region: StartupRegion, sector: StartupSector): Promise<StartupOpportunity> => {
    const prompt = `Generate a startup investment opportunity in ${region} for the ${sector} sector. 
    Return JSON: { "id": string, "name": string, "pitch": string, "region": "${region}", "sector": "${sector}", "valuation": number, "ask": number, "equityOffered": number, "burnRate": number, "runwayMonths": number, "traction": number, "redFlags": string[], "greenFlags": string[], "founder": { "name": string, "role": string, "archetype": string, "skill": number (0-100), "integrity": number (0-100), "pitchStyle": string }, "round": string, "status": "OPEN" }.`;

    const result = await runAIPrompt(prompt, true);
    return result || {
        id: `startup_${Date.now()}`,
        name: "EcoLogistics",
        pitch: "AI-optimized last-mile delivery with zero emissions.",
        region,
        sector,
        valuation: 8000000,
        ask: 500000,
        equityOffered: 0.1,
        burnRate: 40000,
        runwayMonths: 18,
        traction: 5000,
        redFlags: ["High customer churn"],
        greenFlags: ["Strategic partnerships"],
        founder: { name: "Alex Rivera", role: "CEO", archetype: "VISIONARY", skill: 90, integrity: 85, pitchStyle: "Charismatic" },
        round: "SEED" as any,
        status: "OPEN" as any
    };
};
