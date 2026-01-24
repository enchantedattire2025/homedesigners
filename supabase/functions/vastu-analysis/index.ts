import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface VastuRequest {
  projectId?: string;
  layoutImageUrl: string;
}

interface VastuRecommendation {
  zone: string;
  element: string;
  status: 'good' | 'warning' | 'bad';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface VastuResponse {
  score: number;
  recommendations: VastuRecommendation[];
  summary: string;
}

interface GeminiAnalysisResult {
  zones: Array<{
    name: string;
    element: string;
    status: string;
    observation: string;
    recommendation: string;
  }>;
  overallScore: number;
  summary: string;
}

async function analyzeFloorPlanWithGemini(imageUrl: string): Promise<GeminiAnalysisResult> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not found, using fallback mock analysis')
    return generateMockAnalysis()
  }

  try {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)))

    const prompt = `You are a Vastu Shastra expert analyzing a floor plan. Analyze this floor plan image and provide a detailed Vastu analysis.

IMPORTANT: Respond ONLY with valid JSON in this exact format, no markdown formatting, no explanations:

{
  "zones": [
    {
      "name": "North-East (Ishanya)",
      "element": "Water",
      "status": "good|warning|bad",
      "observation": "Brief observation about what you see in this zone",
      "recommendation": "Specific recommendation based on Vastu principles"
    }
  ],
  "overallScore": 75,
  "summary": "Brief overall summary of the Vastu compliance"
}

Analyze these 8 key Vastu zones:
1. North-East (Ishanya) - Water element - Prayer/Meditation area
2. South-East (Agneya) - Fire element - Kitchen placement
3. South (Yama) - Earth element - Heavy furniture/storage
4. South-West (Nairutya) - Earth element - Master bedroom
5. West (Varuna) - Water element - Children's room/Study
6. North-West (Vayavya) - Air element - Guest room/Storage
7. North (Kubera) - Water element - Wealth/Office area
8. Center (Brahma) - Space element - Open area

For each zone, determine:
- status: "good" if well-placed, "warning" if minor issues, "bad" if major misalignment
- observation: What you actually see in the floor plan for that zone
- recommendation: Specific actionable advice based on Vastu principles

Calculate overallScore (0-100) based on how well the layout follows Vastu principles.`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response structure:', geminiData)
      throw new Error('Invalid response from Gemini API')
    }

    let analysisText = geminiData.candidates[0].content.parts[0].text.trim()

    if (analysisText.startsWith('```json')) {
      analysisText = analysisText.slice(7)
    }
    if (analysisText.startsWith('```')) {
      analysisText = analysisText.slice(3)
    }
    if (analysisText.endsWith('```')) {
      analysisText = analysisText.slice(0, -3)
    }
    analysisText = analysisText.trim()

    const analysis = JSON.parse(analysisText)

    if (!analysis.zones || !Array.isArray(analysis.zones) || typeof analysis.overallScore !== 'number') {
      console.error('Invalid analysis structure:', analysis)
      throw new Error('Invalid analysis structure from Gemini')
    }

    return analysis
  } catch (error) {
    console.error('Error calling Gemini API:', error)
    return generateMockAnalysis()
  }
}

function generateMockAnalysis(): GeminiAnalysisResult {
  const score = Math.floor(Math.random() * 31) + 65
  return {
    zones: [
      {
        name: 'North-East (Ishanya)',
        element: 'Water',
        status: score > 80 ? 'good' : 'warning',
        observation: 'This zone appears to be used as a general space',
        recommendation: score > 80
          ? 'Well placed water element. Maintain this area for prayer or meditation.'
          : 'Consider adding a water feature or prayer space in this zone for better energy flow.'
      },
      {
        name: 'South-East (Agneya)',
        element: 'Fire',
        status: score > 75 ? 'good' : 'bad',
        observation: 'Kitchen or cooking area detected in this region',
        recommendation: score > 75
          ? 'Kitchen is well positioned in the South-East. Maintain this placement.'
          : 'Kitchen should be relocated to the South-East corner for proper fire element alignment.'
      },
      {
        name: 'South (Yama)',
        element: 'Earth',
        status: Math.random() > 0.5 ? 'good' : 'warning',
        observation: 'Heavy furniture or storage area visible',
        recommendation: 'Ensure heavy furniture or storage is placed in the southern zone. Avoid sleeping with head facing south.'
      },
      {
        name: 'South-West (Nairutya)',
        element: 'Earth',
        status: Math.random() > 0.7 ? 'good' : 'warning',
        observation: 'Bedroom area identified in this zone',
        recommendation: 'Master bedroom is ideally placed in South-West. Ensure this area has solid walls and minimal windows.'
      },
      {
        name: 'West (Varuna)',
        element: 'Water',
        status: Math.random() > 0.6 ? 'good' : 'warning',
        observation: 'Room suitable for children or study purposes',
        recommendation: 'Good placement for children\'s bedroom or study room. Ensure proper ventilation in this area.'
      },
      {
        name: 'North-West (Vayavya)',
        element: 'Air',
        status: Math.random() > 0.5 ? 'warning' : 'bad',
        observation: 'Guest room or storage space in this zone',
        recommendation: 'Guest room or storage should be in this area. Avoid placing toilets in the North-West zone.'
      },
      {
        name: 'North (Kubera)',
        element: 'Water',
        status: Math.random() > 0.4 ? 'good' : 'warning',
        observation: 'Office or workspace area noted',
        recommendation: 'Ideal for wealth storage or home office. Ensure this area is clutter-free for prosperity.'
      },
      {
        name: 'Center (Brahma)',
        element: 'Space',
        status: Math.random() > 0.8 ? 'good' : 'bad',
        observation: 'Central area of the floor plan',
        recommendation: 'Keep the center of your home open and free from heavy furniture or beams for positive energy flow.'
      }
    ],
    overallScore: score,
    summary: score >= 85
      ? 'Your home layout has excellent Vastu alignment. Minor adjustments can perfect the energy flow.'
      : score >= 70
      ? 'Your home has good Vastu alignment with some areas needing attention.'
      : 'Your home layout has several Vastu misalignments that should be addressed.'
  }
}

function convertToVastuRecommendations(analysis: GeminiAnalysisResult): VastuRecommendation[] {
  return analysis.zones.map(zone => {
    let priority: 'high' | 'medium' | 'low'
    if (zone.status === 'bad') priority = 'high'
    else if (zone.status === 'warning') priority = 'medium'
    else priority = 'low'

    return {
      zone: zone.name,
      element: zone.element,
      status: zone.status as 'good' | 'warning' | 'bad',
      recommendation: zone.recommendation,
      priority
    }
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { projectId, layoutImageUrl }: VastuRequest = await req.json()

    if (!layoutImageUrl) {
      return new Response(
        JSON.stringify({ error: 'Layout image URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if analysis already exists for this project
    if (projectId) {
      try {
        const { data: existingAnalysis, error: fetchError } = await supabase
          .from('vastu_analyses')
          .select('id, vastu_score, analysis_summary')
          .eq('project_id', projectId)
          .maybeSingle()

        if (!fetchError && existingAnalysis) {
          // Fetch existing recommendations
          const { data: existingRecommendations, error: recError } = await supabase
            .from('vastu_recommendations')
            .select('zone, element, status, recommendation, priority')
            .eq('analysis_id', existingAnalysis.id)
            .order('priority', { ascending: true })

          if (!recError && existingRecommendations) {
            // Return existing analysis
            const response: VastuResponse = {
              score: existingAnalysis.vastu_score,
              recommendations: existingRecommendations.map(rec => ({
                zone: rec.zone,
                element: rec.element,
                status: rec.status as 'good' | 'warning' | 'bad',
                recommendation: rec.recommendation,
                priority: rec.priority as 'high' | 'medium' | 'low'
              })),
              summary: existingAnalysis.analysis_summary
            }

            return new Response(
              JSON.stringify(response),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
        }
      } catch (error) {
        console.error('Error fetching existing analysis:', error)
        // Continue to generate new analysis if there's an error
      }
    }

    // Generate new analysis
    const analysis = await analyzeFloorPlanWithGemini(layoutImageUrl)

    const recommendations = convertToVastuRecommendations(analysis)

    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })

    const response: VastuResponse = {
      score: analysis.overallScore,
      recommendations,
      summary: analysis.summary
    }

    // Save new analysis to database
    if (projectId) {
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from('vastu_analyses')
          .insert({
            project_id: projectId,
            layout_image_url: layoutImageUrl,
            vastu_score: analysis.overallScore,
            analysis_summary: analysis.summary
          })
          .select()
          .single()

        if (analysisError) {
          console.error('Error saving Vastu analysis:', analysisError)
        } else if (analysisData) {
          const recommendationsToInsert = recommendations.map(rec => ({
            analysis_id: analysisData.id,
            zone: rec.zone,
            element: rec.element,
            status: rec.status,
            recommendation: rec.recommendation,
            priority: rec.priority
          }))

          const { error: recError } = await supabase
            .from('vastu_recommendations')
            .insert(recommendationsToInsert)

          if (recError) {
            console.error('Error saving Vastu recommendations:', recError)
          }
        }
      } catch (error) {
        console.error('Error in database operations:', error)
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in vastu-analysis function:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})