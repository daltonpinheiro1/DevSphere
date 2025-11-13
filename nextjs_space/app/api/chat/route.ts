
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, message } = await request.json()

    if (!conversation_id || !message) {
      return NextResponse.json(
        { error: 'Missing conversation_id or message' },
        { status: 400 }
      )
    }

    // Save user message to database
    await prisma.messages.create({
      data: {
        id: uuidv4(),
        conversation_id,
        content: message,
        sender: 'user'
      }
    })

    // Call the LLM API with streaming
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é a IA da DevSphere.ai, uma plataforma avançada de automação empresarial. Você é especializado em ajudar com consultas empresariais, análises, suporte técnico, automatização de processos, gestão de WhatsApp Business e insights estratégicos. Responda de forma profissional, precisa e útil, sempre focando em soluções práticas para o ambiente corporativo. Mantenha um tom cordial mas profissional.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: true,
        max_tokens: 3000,
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API responded with status: ${response.status}`)
    }

    // Create a readable stream to forward the LLM response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let aiContent = ''

        try {
          if (!reader) {
            throw new Error('Response body reader is null')
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // Save AI response to database
                  await prisma.messages.create({
                    data: {
                      id: uuidv4(),
                      conversation_id,
                      content: aiContent,
                      sender: 'ai'
                    }
                  })
                  
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    aiContent += parsed.choices[0].delta.content
                  }
                  
                  // Forward the chunk to the client
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
