export const DEFAULT_API_URL = 'http://10.7.1.51:3000';

/**
 * Helper to build headers with Basic auth
 * Backend expects: Authorization: Basic <username>:<password>
 */
export function getAuthHeaders(username, password) {
  const authHeader = `Basic ${username}:${password}`;
  return {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
    'Autorization': authHeader,
    'authorization': authHeader,
  };
}

/**
 * GET /user/profile
 * Returns authenticated caller's profile or target user profile if userId is passed
 */
export async function getProfile(baseUrl, username, password, userId = null) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const url = userId
    ? `${cleanBase}/user/profile?user_id=${encodeURIComponent(userId)}`
    : `${cleanBase}/user/profile`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(username, password),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * GET /user
 * Returns list of all registered users
 */
export async function getAllUsers(baseUrl, username, password) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const res = await fetch(`${cleanBase}/user`, {
    method: 'GET',
    headers: getAuthHeaders(username, password),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Failed to load users (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * GET /conversation
 * Returns all conversations the authenticated user participates in
 */
export async function getConversations(baseUrl, username, password) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const res = await fetch(`${cleanBase}/conversation`, {
    method: 'GET',
    headers: getAuthHeaders(username, password),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Failed to load conversations (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * POST /conversation
 * Creates or finds a conversation (DM or Group)
 * Body: { type, name, participants_ids }
 */
export async function createConversation(baseUrl, username, password, payload) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const res = await fetch(`${cleanBase}/conversation`, {
    method: 'POST',
    headers: getAuthHeaders(username, password),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Failed to create conversation (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * GET /message
 * Fetches messages for a conversation with cursor pagination
 * Query: conversation_id (required), from_message_cursor (optional)
 * Returns { data: MessageResponseDto[], nextCursor, count }
 */
export async function getMessages(baseUrl, username, password, conversationId, fromCursor = null) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  let url = `${cleanBase}/message?conversation_id=${encodeURIComponent(conversationId)}`;
  if (fromCursor) {
    url += `&from_message_cursor=${encodeURIComponent(fromCursor)}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(username, password),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Failed to load messages (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}

/**
 * POST /message
 * Send a message to a conversation
 * Body: { conversation_id, content }
 */
export async function sendMessageApi(baseUrl, username, password, conversationId, content) {
  const cleanBase = (baseUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const res = await fetch(`${cleanBase}/message`, {
    method: 'POST',
    headers: getAuthHeaders(username, password),
    body: JSON.stringify({
      conversation_id: conversationId,
      content: content.trim(),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Failed to send message (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch (e) {
      if (errorText) message = errorText;
    }
    throw new Error(message);
  }
  return res.json();
}
