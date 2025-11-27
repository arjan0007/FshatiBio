let admin = null;
const { pool } = require('../config/database');

// Initialize Firebase Admin (do të konfigurohet me environment variables)
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;

  try {
    // Try to require firebase-admin, but don't fail if not installed
    try {
      admin = require('firebase-admin');
    } catch (e) {
      console.log('⚠️  firebase-admin not installed - notifications disabled');
      return;
    }

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️  Firebase credentials not found - notifications disabled');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
}

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to user
 */
async function sendNotification(userId, title, message, data = {}) {
  if (!firebaseInitialized || !admin) {
    console.log('Firebase not initialized - skipping notification');
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Get user's FCM token from database
    const result = await pool.query(
      'SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL',
      [userId]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'User has no FCM token' };
    }

    const fcmToken = result.rows[0].fcm_token;

    // Send notification
    const messagePayload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(messagePayload);

    // Save notification to database
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        data.type || 'system',
        title,
        message,
        data.link_url || null,
      ]
    );

    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification when order status changes
 */
async function notifyOrderStatusChange(orderId, newStatus) {
  try {
    const orderResult = await pool.query(
      `SELECT o.user_id, o.order_number, u.first_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) return;

    const order = orderResult.rows[0];
    const statusMessages = {
      pending: 'Porosia juaj u krijua me sukses! Po pritet konfirmimi.',
      confirmed: 'Porosia juaj u konfirmua!',
      preparing: 'Porosia juaj po përgatitet.',
      on_delivery: 'Porosia juaj është në rrugë!',
      delivered: 'Porosia juaj u dorëzua me sukses!',
      cancelled: 'Porosia juaj u anulua.',
    };

    const message = statusMessages[newStatus] || `Statusi i porosisë u ndryshua në: ${newStatus}`;
    const title = `Porosia #${order.order_number}`;
    const linkUrl = `/orders/${orderId}`;

    // Always save notification to database, even if push notification fails
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        order.user_id,
        'order_status',
        title,
        message,
        linkUrl
      ]
    );

    // Try to send push notification if FCM is available
    try {
      await sendNotification(
        order.user_id,
        title,
        message,
        {
          type: 'order_status',
          order_id: orderId,
          order_number: order.order_number,
          status: newStatus,
          link_url: linkUrl,
        }
      );
    } catch (pushError) {
      // Push notification failed, but database notification was saved
      console.log('Push notification failed, but database notification saved:', pushError.message);
    }
  } catch (error) {
    console.error('Error notifying order status change:', error);
  }
}

/**
 * Send promotional notification to all users
 */
async function sendPromotionalNotification(title, message, linkUrl = null) {
  if (!firebaseInitialized || !admin) return { success: false, error: 'Firebase not configured' };

  try {
    const usersResult = await pool.query(
      "SELECT id, fcm_token FROM users WHERE fcm_token IS NOT NULL AND role = 'customer'"
    );

    const tokens = usersResult.rows.map((row) => row.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      return { success: false, error: 'No users with FCM tokens' };
    }

    const messagePayload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        type: 'promotion',
        link_url: linkUrl || '',
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);

    // Save notifications to database
    for (const user of usersResult.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url)
         VALUES ($1, 'promotion', $2, $3, $4)`,
        [user.id, title, message, linkUrl]
      );
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error sending promotional notification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
  notifyOrderStatusChange,
  sendPromotionalNotification,
  initializeFirebase,
};

