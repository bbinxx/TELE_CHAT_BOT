require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');

const users = {}; // Object to store waiting users

// Replace with your actual Telegram bot token
const token = process.env.TOKEN;

const bot = new TelegramBot(token);

// Function to handle new chat participants
function handleNewUser(chatId) {
  users[chatId] = { chatId, waiting: true }; // Add user to waiting list
  console.log(`User with chat ID ${chatId} joined the queue.`);
  bot.sendMessage(chatId, `You've been added to the queue. We'll connect you with another user as soon as possible.`);

  // Check if there's another user waiting
  if (Object.values(users).some(user => user.waiting)) {
    const user1 = users[chatId];
    const user2 = Object.values(users).find(user => user.waiting && user.chatId !== chatId);

    if (user2) {
      console.log(`Matching user ${chatId} with user ${user2.chatId}`);

      // Send starting message to both users, indicating temporary anonymity
      bot.sendMessage(user1.chatId, `Hi! You've been matched for an anonymous chat. Please note that true anonymity cannot be guaranteed. Remember to be respectful and responsible during your conversation.`);
      bot.sendMessage(user2.chatId, `Hi! You've been matched for an anonymous chat. Please note that true anonymity cannot be guaranteed. Remember to be respectful and responsible during your conversation.`);

      // Remove users from waiting list and enable messaging
      delete users[user1.chatId].waiting;
      delete users[user2.chatId].waiting;

      // Forward messages between users (avoid storing messages for privacy)
      bot.on('message', (msg) => {
        const fromChatId = msg.chat.id;
        const message = msg.text;

        if (!users[fromChatId] || !users[fromChatId].waiting) {
          return; // Not a relevant user in this chat
        }

        const partnerChatId = Object.keys(users).find(id => id !== fromChatId);
        if (!partnerChatId) {
          return; // Partner not found or no longer waiting
        }

        console.log(`Forwarding message from ${fromChatId} to ${partnerChatId}`);
        bot.sendMessage(partnerChatId, message);
      });
    }
  } else {
    console.log(`User with chat ID ${chatId} is still waiting for a partner.`);
    bot.sendMessage(chatId, `You've been added to the queue. We'll connect you with another user as soon as possible.`);
  }
}


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome \n /new \n /stop");
    });

// Handle incoming messages
bot.onText(/\/new/, (msg) => {
  const chatId = msg.chat.id;
  if (!users[chatId]) {
    handleNewUser(chatId);
  } else if (users[chatId].waiting) {
    // User already in queue, ignore message (could add further instructions)
  } else {
    // User is currently chatting, handle message forwarding as described above
    // (code omitted for brevity, refer to forwarding logic within handleNewUser)
  }
});

// Handle exiting chats (optional)
bot.on('left_chat_member', (msg) => {
  const leftChatId = msg.chat.id;
  if (users[leftChatId]) {
    delete users[leftChatId];
    console.log(`User with chat ID ${leftChatId} left the chat.`);

    // Optionally, notify the partner if they were still connected
  }
});

bot.startPolling().then(() => {
  console.log(`Bot started successfully!`);
});
