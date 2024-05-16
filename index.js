require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const INACTIVE_TIMEOUT = 60 * 5; // 5 minutes of inactivity

const users = {}; // Object to store waiting users (with last active time)

// Replace with your actual Telegram bot token
const token = process.env.TOKEN;

const bot = new TelegramBot(token);

// Function to handle disconnects (user leaving or inactivity)
function handleDisconnect(chatId) {
  if (!users[chatId]) return;

  const partnerChatId = Object.keys(users).find(id => id !== chatId);
  if (partnerChatId) {
    bot.sendMessage(partnerChatId, `**Your chat partner has disconnected.**`);
  }
  delete users[chatId];
  console.log(`User with chat ID ${chatId} disconnected.`);
}

// Function to handle new chat participants
function handleNewUser(chatId) {
  users[chatId] = { chatId, waiting: true, lastActive: Date.now() }; // Add user with timestamp
  console.log(`User with chat ID ${chatId} joined the queue.`);
  bot.sendMessage(chatId, `**Welcome!** You've been added to the queue. We'll connect you with another user as soon soon as possible.`);

  // Check if there's another user waiting
  if (Object.values(users).some(user => user.waiting)) {
    const user1 = users[chatId];
    const user2 = Object.values(users).find(user => user.waiting && user.chatId !== chatId);

    if (user2) {
      console.log(`Matching user ${chatId} with user ${user2.chatId}`);

      // Send starting message to both users
      const message = `**Hi! You've been matched for an anonymous chat.** Please note that anonymity cannot be guaranteed. Be respectful and responsible. Type '/stop' to leave the chat.`;
      bot.sendMessage(user1.chatId, message);
      bot.sendMessage(user2.chatId, message);

      // Remove users from waiting list and enable messaging
      delete users[user1.chatId].waiting;
      delete users[user2.chatId].waiting;

      // Forward messages between users (avoid storing messages)
      const forwardMessage = (fromChatId, message) => {
        if (!users[fromChatId] || !users[fromChatId].waiting) {
          return; // Not a relevant user
        }

        // Check for inactivity before forwarding
        if (Date.now() - users[fromChatId].lastActive > INACTIVE_TIMEOUT * 1000) {
          handleDisconnect(fromChatId);
          return;
        }

        users[fromChatId].lastActive = Date.now(); // Update activity time
        const partnerChatId = Object.keys(users).find(id => id !== fromChatId);
        if (!partnerChatId) {
          return; // Partner not found or no longer waiting
        }
        bot.sendMessage(partnerChatId, message);
      };

      bot.on('message', forwardMessage); // Efficient listener for both users
    }
  } else {
    console.log(`User with chat ID ${chatId} is still waiting for a partner.`);
    bot.sendMessage(chatId, `You're still in the queue. We'll notify you when you're matched with another user.`);
  }
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "**Welcome!** Use /new to join the queue or /stop to leave an ongoing chat.");
});

// Handle incoming messages
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    handleNewUser(chatId);
  } else if (users[chatId].waiting) {
    // User already in queue, ignore message (optional: send a message like "You're already in queue")
  } else {
    // User is currently chatting, handle forwarding using existing logic
  }
});

// Handle user leaving the chat
bot.on('left_chat_member', (msg) => {
  handleDisconnect(msg.chat.id);
});

bot.startPolling();
