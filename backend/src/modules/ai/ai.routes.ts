import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../shared/database/prisma.js';
import { failure, success } from '../../shared/http.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { pageQuerySchema, parseId, studentForUser, paginationMeta } from '../../shared/utils.js';
import {
  buildCoachContext,
  generateCoachReply,
  isAiConfigured,
  AiNotConfiguredError,
  AiUnavailableError,
  type CoachChatMessage,
} from './ai.service.js';

const router = Router();
router.use(requireAuthentication);

// POST /api/v1/ai-coach/conversations
router.post('/conversations', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({
    title: z.string().trim().min(1).max(100).optional(),
  }).safeParse(req.body);

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const conversation = await prisma.aiConversation.create({
    data: {
      studentId: student.id,
      title: input.success && input.data.title ? input.data.title : 'Career Guidance Chat',
    },
  });

  return success(res, conversation, 201, 'AI conversation thread started.');
});

// GET /api/v1/ai-coach/conversations
router.get('/conversations', requireRole('STUDENT'), async (req, res) => {
  const query = pageQuerySchema.safeParse(req.query);
  if (!query.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid query parameters.', query.error.issues);

  const { page, limit, sort, order } = query.data;
  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const total = await prisma.aiConversation.count({ where: { studentId: student.id } });
  const conversations = await prisma.aiConversation.findMany({
    where: { studentId: student.id },
    skip: (page - 1) * limit,
    take: limit,
    include: { messages: { orderBy: { sentAt: 'asc' }, take: 1 } },
    orderBy: sort ? { [sort]: order } : { createdAt: 'desc' },
  });

  return success(res, conversations, 200, 'Conversations retrieved.', paginationMeta(total, page, limit));
});

// GET /api/v1/ai-coach/conversations/:conversationId
router.get('/conversations/:conversationId', requireRole('STUDENT'), async (req, res) => {
  const conversationId = parseId(req.params.conversationId);
  if (!conversationId) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid conversation ID.');

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  const conversation = await prisma.aiConversation.findFirst({
    where: { id: conversationId, studentId: student.id },
    include: { messages: { orderBy: { sentAt: 'asc' } } },
  });

  if (!conversation) return failure(res, 404, 'NOT_FOUND', 'Conversation not found.');
  return success(res, conversation);
});

// GET /api/v1/ai-coach/status  (lets the UI know whether the AI provider is ready)
router.get('/status', async (_req, res) => {
  return success(res, { configured: isAiConfigured() });
});

// POST /api/v1/ai-coach/messages
router.post('/messages', requireRole('STUDENT'), async (req, res) => {
  const input = z.object({
    conversationId: z.string().uuid().optional(),
    messageText: z.string().trim().min(1).max(4000),
  }).safeParse(req.body);

  if (!input.success) return failure(res, 422, 'VALIDATION_ERROR', 'Invalid message text.', input.error.issues);

  const student = await studentForUser(req.authUser!.id);
  if (!student) return failure(res, 404, 'NOT_FOUND', 'Student profile not found.');

  let conversationId = input.data.conversationId;
  if (conversationId) {
    // Ownership check: a student may only continue their own conversation.
    const owned = await prisma.aiConversation.findFirst({
      where: { id: conversationId, studentId: student.id },
      select: { id: true },
    });
    if (!owned) return failure(res, 404, 'NOT_FOUND', 'Conversation not found.');
  } else {
    const newConv = await prisma.aiConversation.create({
      data: {
        studentId: student.id,
        title: input.data.messageText.slice(0, 30) + '...',
      },
    });
    conversationId = newConv.id;
  }

  // Load recent history (this student's own conversation) before appending.
  const priorMessages = await prisma.aiMessage.findMany({
    where: { conversationId },
    orderBy: { sentAt: 'desc' },
    take: 10,
  });
  const history: CoachChatMessage[] = priorMessages
    .reverse()
    .filter((m): m is typeof m & { sender: 'USER' | 'AI_COACH' } => m.sender === 'USER' || m.sender === 'AI_COACH')
    .map((m) => ({ role: m.sender === 'USER' ? 'user' : 'assistant', content: m.messageText }));

  // Persist the user's message first so history is preserved even if the AI fails.
  const userMsg = await prisma.aiMessage.create({
    data: {
      conversationId,
      sender: 'USER',
      messageText: input.data.messageText,
    },
  });

  const context = await buildCoachContext(student.id);

  try {
    const aiReplyText = await generateCoachReply({
      context,
      history,
      userMessage: input.data.messageText,
    });

    // Save the real AI response.
    const aiMsg = await prisma.aiMessage.create({
      data: {
        conversationId,
        sender: 'AI_COACH',
        messageText: aiReplyText,
      },
    });

    return success(res, { conversationId, userMessage: userMsg, aiResponse: aiMsg }, 201, 'AI message processed.');
  } catch (error) {
    // Never persist a fake assistant reply. Surface a clear, human-readable error.
    if (error instanceof AiNotConfiguredError) {
      return failure(res, 503, 'AI_UNAVAILABLE', 'The AI Career Coach is not configured on this server yet. Ask an administrator to set the AI provider credentials.');
    }
    if (error instanceof AiUnavailableError) {
      return failure(res, 502, 'AI_UNAVAILABLE', error.message || 'The AI service is temporarily unavailable. Please try again.');
    }
    return failure(res, 500, 'INTERNAL_ERROR', 'Unable to process the AI request right now.');
  }
});

export default router;
