require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');

const waitingUsers = []; // Queue for users waiting for a chat room
const activeChats = {}; // Object to store active chat rooms (key: chat ID, value: array of user IDs)

// Replace with your actual Telegram bot token
const token = process.env.TOKEN;

const bot = new TelegramBot(token, {polling: true});

// Function to create a new chat room
function createChatRoom(user1, user2) {
  const chatId = Math.random().toString(36).substring(2, 15); // Generate unique chat ID
  activeChats[chatId] = [user1, user2];

  // Remove users from waiting queue
  waitingUsers.splice(waitingUsers.indexOf(user1), 1);
  waitingUsers.splice(waitingUsers.indexOf(user2), 1);

  statusMessage(user1, `You've been paired with another user! Chat ID: ${chatId}`);
  
  statusMessage(user2, `You've been paired with another user! Chat ID: ${chatId}`);

  // Implement logic to handle messages within the chat room (using chatId)
  handleChatMessages(chatId);
}

// Function to send message to a specific user
function sendMessage(userId, message) {
 // bot.sendMessage(userId, message);
  bot.sendMessage(userId,message, {
    "reply_markup": {
        "keyboard": [["/stop"], ["I'm robot"]]
    }
});

}

function statusMessage(userId, message) {
  bot.sendMessage(userId, message);
}

// Function to handle messages within a chat room
function handleChatMessages(chatId) {
  bot.on('message', (msg) => {
    const userId = msg.chat.id;
    const messageText = msg.text;

    // Check if user belongs to the chat room
    if (activeChats[chatId].includes(userId)) {
      const partnerId = activeChats[chatId].filter(id => id !== userId)[0];
      sendMessage(partnerId, `${userId}: ${messageText}`); // Send message to partner
    }
  });
}

// Handle incoming messages

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome \n /search");
});

bot.onText(/\/find/, (msg) => {
  bot.sendMessage(msg.chat.id, "Finding ", {
    "reply_markup": {
        "keyboard": [["/stopsearching"]]
    }
});
})

bot.onText(/\/stopsearching/, (msg) => {
  const userId = msg.chat.id;
  const userIndex = waitingUsers.indexOf(userId);

  if (userIndex > -1) {
    waitingUsers.splice(userIndex, 1);
  }
  
  bot.sendMessage(userId, "Search stopped!", {
    "reply_markup": {
      "keyboard": [["/search"]]
    }
  });
})


bot.onText(/\/search/, (msg) => {
  const userId = msg.chat.id;
  const username = msg.chat.username;

  if (!Object.values(activeChats).flat().includes(userId)) {
    // User not in a chat room, follow pairing logic
    if (waitingUsers.length === 1 && waitingUsers[0] !== userId) {
      const partnerId = waitingUsers.shift();
      createChatRoom(userId, partnerId);
    }else if(waitingUsers[0] == userId){
     // statusMessage(userId, `You are already on queue`);
      bot.sendMessage(userId, `You are already on queue`, {
        "reply_markup": {
            "keyboard": [["/stopsearching"]]
        }
    });
    } else {
      waitingUsers.push(userId);
    //  statusMessage(userId, `Hi ${username}! You've joined the queue. You'll be paired with another user soon.`);
      bot.sendMessage(userId, `Hi ${username}! You've joined the queue. You'll be paired with another user soon.`, {
        "reply_markup": {
            "keyboard": [["/stopsearching"]]
        }
    });
    }
  }


});

bot.onText(/\/stop/, (msg) => {


});


bot.on('message', (msg) => {

    // Optional: Logging code for debugging
    console.log("------------------------------");
    console.log("waitingUsers:",waitingUsers);
    console.log("activeChats",activeChats);
    console.log("------------------------------");

});