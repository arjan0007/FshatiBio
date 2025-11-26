const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const conversationSelectFields = `
  c.id,
  c.user_name,
  c.user_email,
  c.status,
  c.last_message_at,
  c.created_at,
  c.updated_at,
  c.admin_last_viewed_at
`;

async function getConversationById(id) {
  const result = await pool.query(
    `SELECT ${conversationSelectFields}
     FROM chat_conversations c
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function getMessagesByConversation(conversationId) {
  const result = await pool.query(
    `SELECT id, sender, message, created_at
     FROM chat_messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

// Public: create message (and conversation if needed)
router.post(
  '/messages',
  [
    body('message').trim().notEmpty().withMessage('Mesazhi është i detyrueshëm'),
    body('name').trim().notEmpty().withMessage('Emri është i detyrueshëm'),
    body('email').isEmail().withMessage('Email i pavlefshëm'),
    body('conversationId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('ID e bisedës është e pavlefshme')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Verifikoni të dhënat',
            details: errors.array()
          }
        });
      }

      const { message, name, email, conversationId } = req.body;
      let conversation = null;
      let conversationUuid = conversationId;

      if (conversationUuid) {
        conversation = await getConversationById(conversationUuid);
      }

      if (!conversation) {
        const result = await pool.query(
          `INSERT INTO chat_conversations (id, user_name, user_email)
           VALUES ($1, $2, $3)
           RETURNING id, user_name, user_email, status, last_message_at, created_at, updated_at`,
          [conversationUuid || uuidv4(), name.trim(), email.trim().toLowerCase()]
        );
        conversation = result.rows[0];
        conversationUuid = conversation.id;
      }

      const messageResult = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender, message)
         VALUES ($1, 'user', $2)
         RETURNING id, sender, message, created_at`,
        [conversationUuid, message.trim()]
      );

      await pool.query(
        `UPDATE chat_conversations
         SET last_message_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [conversationUuid]
      );

      // Create notification for admin users
      try {
        const adminUsers = await pool.query(
          `SELECT id FROM users WHERE role = 'admin'`
        );
        
        const notificationMessage = message.trim().length > 50 
          ? `${message.trim().substring(0, 50)}...` 
          : message.trim();
        
        for (const admin of adminUsers.rows) {
          // Use 'system' type since 'chat' might not be in the enum yet
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link_url)
             VALUES ($1, 'system', $2, $3, $4)`,
            [
              admin.id,
              'Mesazh i ri në Chat',
              `${name} dërgoi një mesazh: ${notificationMessage}`,
              '/admin/chat'
            ]
          );
        }
      } catch (notifError) {
        // Don't fail the request if notification creation fails
        console.error('Error creating admin notification:', notifError);
      }

      res.status(201).json({
        success: true,
        data: {
          conversation: conversation,
          message: messageResult.rows[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Public: fetch conversation messages by ID
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await getConversationById(id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Biseda nuk u gjet' }
      });
    }

    const messages = await getMessagesByConversation(id);
    res.json({
      success: true,
      data: { conversation, messages }
    });
  } catch (error) {
    next(error);
  }
});

// Admin: list conversations
router.get(
  '/admin/conversations',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT ${conversationSelectFields},
          (
            SELECT message FROM chat_messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message,
          (
            SELECT sender FROM chat_messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message_sender,
          (
            SELECT COUNT(*) FROM chat_messages cm
            WHERE cm.conversation_id = c.id
            AND cm.sender = 'user'
            AND (
              c.admin_last_viewed_at IS NULL 
              OR cm.created_at > c.admin_last_viewed_at
            )
          ) as unread_count,
          c.admin_last_viewed_at
         FROM chat_conversations c
         ORDER BY c.last_message_at DESC NULLS LAST`
      );

      res.json({
        success: true,
        data: { conversations: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: get unread conversations count
router.get(
  '/admin/conversations/unread-count',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      // Count conversations that have messages from users (not admin) that haven't been replied to
      // or conversations with new messages since last admin reply
      const result = await pool.query(
        `SELECT COUNT(DISTINCT c.id) as count
         FROM chat_conversations c
         WHERE EXISTS (
           SELECT 1 FROM chat_messages m
           WHERE m.conversation_id = c.id
           AND m.sender = 'user'
           AND NOT EXISTS (
             SELECT 1 FROM chat_messages m2
             WHERE m2.conversation_id = c.id
             AND m2.sender = 'admin'
             AND m2.created_at > m.created_at
           )
         )`
      );

      res.json({
        success: true,
        data: {
          unread_count: parseInt(result.rows[0].count) || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: get messages for conversation
router.get(
  '/admin/conversations/:id/messages',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const conversation = await getConversationById(id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Biseda nuk u gjet' }
        });
      }
      const messages = await getMessagesByConversation(id);
      res.json({
        success: true,
        data: { conversation, messages }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: reply
router.post(
  '/admin/conversations/:id/reply',
  authenticateToken,
  requireRole('admin'),
  [body('message').trim().notEmpty().withMessage('Mesazhi është i detyrueshëm')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Verifikoni të dhënat',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const conversation = await getConversationById(id);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Biseda nuk u gjet' }
        });
      }

      const messageResult = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender, message)
         VALUES ($1, 'admin', $2)
         RETURNING id, sender, message, created_at`,
        [id, req.body.message.trim()]
      );

      await pool.query(
        `UPDATE chat_conversations
         SET last_message_at = NOW(), updated_at = NOW(), status = 'open'
         WHERE id = $1`,
        [id]
      );

      res.status(201).json({
        success: true,
        data: { message: messageResult.rows[0] }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: close conversation
router.put(
  '/admin/conversations/:id/status',
  authenticateToken,
  requireRole('admin'),
  [body('status').isIn(['open', 'closed']).withMessage('Statusi duhet të jetë "open" ose "closed"')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: errors.array()[0]?.msg || 'Status i pavlefshëm',
            details: errors.array()
          }
        });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      // Sigurohu që status-i është string
      if (typeof status !== 'string' || !['open', 'closed'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status i pavlefshëm' }
        });
      }
      const result = await pool.query(
        `UPDATE chat_conversations
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING ${conversationSelectFields}`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Biseda nuk u gjet' }
        });
      }

      res.json({
        success: true,
        data: { conversation: result.rows[0] }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: mark conversation as read
router.post(
  '/admin/conversations/:id/mark-read',
  authenticateToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Update admin_last_viewed_at timestamp
      const result = await pool.query(
        `UPDATE chat_conversations
         SET admin_last_viewed_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Biseda nuk u gjet' }
        });
      }

      res.json({
        success: true,
        message: 'Mesazhet u shënuan si të lexuara'
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

