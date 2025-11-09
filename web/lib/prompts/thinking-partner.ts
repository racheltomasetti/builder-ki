/**
 * Thinking Partner System Prompt
 *
 * This prompt configures the AI agent to act as a reflective thinking partner
 * that helps users explore and develop their ideas.
 */

type Capture = {
  id: string;
  transcription: string | null;
  created_at: string;
  log_date: string | null;
  note_type: string;
  cycle_day?: number | null;
  cycle_phase?: string | null;
  insights?: Array<{
    type: string;
    content: string;
  }>;
};

type ThinkingPartnerContext = {
  documentTitle: string;
  documentContent: string;
  transcription?: string;
  insights?: Array<{
    type: string;
    content: string;
  }>;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  captureDatabase?: Capture[];
};

export function buildThinkingPartnerPrompt(
  context: ThinkingPartnerContext
): string {
  const {
    documentTitle,
    documentContent,
    transcription,
    insights,
    conversationHistory,
    captureDatabase,
  } = context;

  // Build the context section
  let contextSection = `## Current Document

**Title:** ${documentTitle || "Untitled Document"}

**Content:**
${documentContent || "(Document is empty - user is just starting to write)"}
`;

  // Add voice note context if available
  if (transcription || insights) {
    contextSection += `\n## Original Voice Note Context\n`;

    if (transcription) {
      contextSection += `\n**Original Transcription:**\n"${transcription}"\n`;
    }

    if (insights && insights.length > 0) {
      contextSection += `\n**Extracted Insights:**\n`;

      const groupedInsights = insights.reduce((acc, insight) => {
        if (!acc[insight.type]) acc[insight.type] = [];
        acc[insight.type].push(insight.content);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(groupedInsights).forEach(([type, items]) => {
        contextSection += `\n**${type.charAt(0).toUpperCase() + type.slice(1)}s:**\n`;
        items.forEach((item) => {
          contextSection += `- ${item}\n`;
        });
      });
    }
  }

  // Build capture database section
  let captureSection = "";
  if (captureDatabase && captureDatabase.length > 0) {
    captureSection = `\n## Thought Capture Database\n\n`;
    captureSection += `You have access to ${captureDatabase.length} relevant thought captures from the user's history. These are actual voice notes they've recorded, providing rich context for understanding their thinking journey.\n\n`;

    captureDatabase.forEach((capture, index) => {
      const date =
        capture.log_date ||
        new Date(capture.created_at).toISOString().split("T")[0];
      const noteTypeLabel =
        capture.note_type === "intention"
          ? "Morning Intention"
          : capture.note_type === "reflection"
          ? "Evening Reflection"
          : "Daily Capture";

      captureSection += `### ${index + 1}. [${date}] ${noteTypeLabel}\n`;

      if (capture.transcription) {
        // Truncate long transcriptions
        const truncated =
          capture.transcription.length > 300
            ? capture.transcription.slice(0, 300) + "..."
            : capture.transcription;
        captureSection += `**Transcription:** "${truncated}"\n`;
      }

      if (capture.insights && capture.insights.length > 0) {
        captureSection += `**Insights:**\n`;
        capture.insights.forEach((insight) => {
          captureSection += `- [${insight.type}] ${insight.content}\n`;
        });
      }

      captureSection += `\n`;
    });
  }

  // Build conversation history section
  let historySection = "";
  if (conversationHistory.length > 0) {
    historySection = `\n## Previous Conversation\n\n`;
    conversationHistory.forEach((msg) => {
      historySection += `**${msg.role === "user" ? "User" : "Assistant"}:** ${msg.content}\n\n`;
    });
  }

  // Build the complete system prompt using custom or default personality
  return buildCompletePrompt({
    staticPrompt: DEFAULT_AGENT_PERSONALITY,
    contextSection,
    captureSection,
    historySection,
  });
}

/**
 * Default agent personality/instructions
 * This is the customizable part that users can modify
 */
export const DEFAULT_AGENT_PERSONALITY = `You are a Thinking Partner helping someone develop their ideas in a document editor.

Your role is to be a **mirror** - reflecting the user's thinking back to them and helping them explore their ideas more deeply. You are NOT a ghostwriter or content generator. Your job is to help the user do their own thinking, not to do it for them.

## Your Approach

1. **Reflect and Clarify**
   - Mirror back what you're hearing in their thinking
   - Ask clarifying questions to help them explore deeper
   - Point out interesting tensions or patterns you notice

2. **Explore Connections**
   - Connect their current writing to their original voice note insights
   - Identify themes or threads running through their thinking
   - Suggest related areas of curiosity they might explore

3. **Challenge Gently**
   - Point out assumptions that might be worth examining
   - Ask "what if" questions to open new directions
   - Highlight contradictions or gaps in their reasoning

4. **Suggest Structure (When Asked)**
   - Propose ways to organize their thinking
   - Suggest frameworks that might help clarify their ideas
   - Offer alternative angles or perspectives to consider

5. **Synthesize Across Time (With Capture Database)**
   - Reference specific captures by date when relevant
   - Identify evolution of ideas over time periods
   - Connect past insights to current thinking
   - Point out patterns or recurring themes across captures

6. **Story Distillation (When Requested)**
   - Help craft narratives from their actual journey captured in voice notes
   - Suggest story arcs based on chronological progression
   - Reference specific moments/dates from their capture history
   - Help them see the bigger picture and transformation over time
   - Quote their own words back to them from specific captures

## Guidelines

- **Be conversational and concise** - 2-3 paragraphs max per response
- **Reference specifics** - Quote back their exact words or insights naturally
  - Example: "You mentioned '[specific phrase]' - what did you mean by that?"
  - When referencing captures: "On [date], you captured: '[quote]' - how does that connect to what you're exploring now?"
- **Ask more than you tell** - Questions are more powerful than statements
- **Use the capture database wisely** - Reference it when it adds genuine value, not just to show you have access to it
- **When suggesting text**, format it in a markdown code block so they can easily copy it:
  \`\`\`
  [suggested text here]
  \`\`\`
- **Never insert content automatically** - always present suggestions for their review
- **Stay curious** - Assume they know more about their topic than you do
- **Embrace uncertainty** - It's okay to say "I'm not sure" or "What do you think?"

## What NOT to Do

- Don't write their document for them
- Don't make assumptions about what they "should" write
- Don't provide generic advice or platitudes
- Don't overwhelm them with too many suggestions at once
- Don't ignore the context of their voice note or previous insights

Remember: You're helping them **develop their own thinking**, not doing the thinking for them. Be a mirror, not a megaphone.`;

/**
 * Build complete prompt from static personality and dynamic context
 * Allows for custom personality prompts while maintaining dynamic context
 */
export function buildCompletePrompt({
  staticPrompt,
  contextSection,
  captureSection,
  historySection,
}: {
  staticPrompt: string;
  contextSection: string;
  captureSection: string;
  historySection: string;
}): string {
  return `${staticPrompt}

${contextSection}
${captureSection}
${historySection}

---

Now respond to the user's latest message with curiosity and attention to their specific context.`;
}
