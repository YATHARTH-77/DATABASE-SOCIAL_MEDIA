const STORAGE_KEY = "social_conversations_v1";

function slugify(name) {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "");
}

// Default conversations with ISO timestamps for messages
const DEFAULT = [
  {
    id: "1",
    name: "Person-1",
    username: slugify("Person-1"),
    time: new Date().toISOString(),
    unread: false,
    lastMessage: "How are you?",
    messages: [
      { id: 1, text: "How are you?", sender: "them", time: new Date().toISOString() },
      { id: 2, text: "I'm doing great! Thanks for asking 😊", sender: "me", time: new Date().toISOString() },
    ],
  },
  {
    id: "2",
    name: "Person-2",
    username: slugify("Person-2"),
    time: new Date().toISOString(),
    unread: true,
    lastMessage: "Heyy",
    messages: [
      { id: 1, text: "Heyy", sender: "them", time: new Date().toISOString() },
    ],
  },
  {
    id: "3",
    name: "Person-3",
    username: slugify("Person-3"),
    time: new Date().toISOString(),
    unread: false,
    lastMessage: "wassup",
    messages: [
      { id: 1, text: "wassup", sender: "them", time: new Date().toISOString() },
    ],
  },
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT));
      return JSON.parse(JSON.stringify(DEFAULT));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load conversations", e);
    return JSON.parse(JSON.stringify(DEFAULT));
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // notify other tabs/components that conversations changed
    try { window.dispatchEvent(new Event('conversations:changed')); } catch (e) { /* ignore in non-browser env */ }
  } catch (e) {
    console.error("Failed to save conversations", e);
  }
}

export function getAll() {
  return load();
}

export function getById(id) {
  const all = load();
  return all.find((c) => String(c.id) === String(id));
}

export function addConversation(name) {
  const all = load();
  const id = Date.now().toString();
  const conv = {
    id,
    name,
    username: slugify(name),
    time: new Date().toISOString(),
    unread: false,
    lastMessage: "",
    messages: [],
  };
  all.push(conv);
  save(all);
  return conv;
}

export function addMessage(conversationId, message) {
  const all = load();
  const conv = all.find((c) => String(c.id) === String(conversationId));
  if (!conv) return null;
  const newMsg = {
    id: conv.messages.length ? conv.messages[conv.messages.length - 1].id + 1 : 1,
    ...message,
    time: new Date().toISOString(),
    read: message.sender === 'me' ? true : false,
  };
  conv.messages.push(newMsg);
  conv.lastMessage = newMsg.text;
  conv.time = newMsg.time;
  // If the incoming message is from the other person, mark conversation unread
  conv.unread = message.sender === 'them' ? true : false;
  save(all);
  return newMsg;
}

export function markAsRead(conversationId) {
  const all = load();
  const conv = all.find((c) => String(c.id) === String(conversationId));
  if (!conv) return false;
  conv.unread = false;
  if (Array.isArray(conv.messages)) {
    conv.messages = conv.messages.map((m) => ({ ...m, read: true }));
  }
  save(all);
  return true;
}
