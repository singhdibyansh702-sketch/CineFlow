import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { AuthRequest } from '../types';
import { createNotification } from '../services/notification.service';

// ----------------------------------------------------
// LIST CONVERSATIONS (Admin view of all client & editor chats)
// ----------------------------------------------------
export async function getAdminConversations(req: AuthRequest, res: Response): Promise<void> {
  const adminId = req.user!.id;

  // Find all active Clients and Editors
  const [clients, editors] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CLIENT', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clientProfile: { select: { companyName: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'EDITOR', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        editorProfile: { select: { skills: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // For each user, get the last message and unread count
  const enrichUserWithChatMeta = async (u: any) => {
    const lastMsg = await prisma.directMessage.findFirst({
      where: {
        OR: [
          { senderId: u.id, receiverId: adminId },
          { senderId: adminId, receiverId: u.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.directMessage.count({
      where: {
        senderId: u.id,
        receiverId: adminId,
        isRead: false,
      },
    });

    return {
      ...u,
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.createdAt || null,
      unreadCount,
    };
  };

  const [clientChats, editorChats] = await Promise.all([
    Promise.all(clients.map(enrichUserWithChatMeta)),
    Promise.all(editors.map(enrichUserWithChatMeta)),
  ]);

  // Sort by most recent message first
  clientChats.sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  editorChats.sort((a, b) => {
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  res.json({
    clientChats,
    editorChats,
  });
}

// ----------------------------------------------------
// GET MESSAGES THREAD (Strictly Admin <-> User only)
// ----------------------------------------------------
export async function getChatMessages(req: AuthRequest, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const currentRole = req.user!.role;
  let otherUserId = req.params.otherUserId;

  // If Client or Editor and otherUserId is "admin", resolve default Admin
  if (currentRole !== 'ADMIN') {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true, name: true, role: true },
    });

    if (!adminUser) {
      res.status(404).json({ error: 'Agency admin is not currently available.' });
      return;
    }

    otherUserId = adminUser.id;
  } else {
    // Current user is ADMIN: verify otherUser exists and is CLIENT or EDITOR
    const targetUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, role: true, name: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Conversation participant not found.' });
      return;
    }
  }

  // Fetch messages between current user and target user
  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Mark unread messages sent to current user as read
  await prisma.directMessage.updateMany({
    where: {
      senderId: otherUserId,
      receiverId: currentUserId,
      isRead: false,
    },
    data: { isRead: true },
  });

  // Target contact info
  const targetContact = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      role: true,
      clientProfile: { select: { companyName: true } },
      editorProfile: { select: { skills: true } },
    },
  });

  res.json({
    messages,
    contact: targetContact,
  });
}

// ----------------------------------------------------
// SEND MESSAGE
// ----------------------------------------------------
const sendMessageSchema = z.object({
  receiverId: z.string().optional(),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

export async function sendChatMessage(req: AuthRequest, res: Response): Promise<void> {
  const currentUserId = req.user!.id;
  const currentRole = req.user!.role;
  const data = sendMessageSchema.parse(req.body);

  let targetReceiverId = data.receiverId;

  // If Client or Editor: message must strictly go to Admin!
  if (currentRole !== 'ADMIN') {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });

    if (!adminUser) {
      res.status(500).json({ error: 'No agency administrator found.' });
      return;
    }

    targetReceiverId = adminUser.id;
  } else {
    // Current role is ADMIN: verify receiverId is provided
    if (!targetReceiverId) {
      res.status(400).json({ error: 'Receiver ID is required for admin replies.' });
      return;
    }

    const receiver = await prisma.user.findUnique({
      where: { id: targetReceiverId },
      select: { id: true, role: true },
    });

    if (!receiver) {
      res.status(404).json({ error: 'Recipient not found.' });
      return;
    }
  }

  // Create message
  const msg = await prisma.directMessage.create({
    data: {
      senderId: currentUserId,
      receiverId: targetReceiverId,
      content: data.content.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  // Notify receiver
  await createNotification({
    userId: targetReceiverId,
    title: `New Message from ${req.user!.name} (${currentRole})`,
    message: data.content.substring(0, 100),
    link: currentRole === 'ADMIN' ? '/chat' : '/chat',
    type: 'DIRECT_MESSAGE',
  });

  res.status(201).json({ message: msg });
}

