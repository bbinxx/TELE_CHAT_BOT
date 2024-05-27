const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');
require('dotenv').config()
//const { MongoClient, ServerApiVersion } = require('mongodb');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const uri =process.env.URI;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static( __dirname + '/public'));

const bot = new TelegramBot(token, {polling: true});
const connection = mysql.createConnection({
    host: 'localhost', // Replace with your MySQL host
    user: 'root', // Replace with your username
    password: '', // Replace with your password
    database: 'test' // Replace with your database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }else{
      console.log('Connected to MySQL database!');
      connection.query('CREATE TABLE IF NOT EXISTS users (SL INT AUTO_INCREMENT PRIMARY KEY, UID INT)', (err, result) => {
        if (err) throw err;
        console.log('Table created (if it did not exist)!');
    });
    }
});

function checkAndAddUser(uid) {
  connection.query('SELECT UID FROM `users` WHERE UID = ?', [uid], (err, rows) => {
    if (err) {
      console.error('Error checking user:', err);
      // Handle the error appropriately (e.g., return an error code)
    } else if (rows.length === 0) {
      console.log("user doesnt exist in database");
      // User doesn't exist, add them
      addUser(uid);
    } else {
      console.log(`User with ID ${uid} already exists.`);
    }
  });
}

function addUser(uid) {
  const newUser = { uid: uid };

  connection.query('INSERT INTO users SET ?', newUser, (err, result) => {
    if (err) {
      console.error('Error adding user:', err);
      // Handle the error appropriately (e.g., return an error code)
    } else {
      console.log('User added:', result);
    }
  });
}
    // Route to display admin panel
    app.get('/admin', (req, res) => {
      connection.query('SELECT UID FROM `users`', (err, rows) => {
        if (err) {
          console.error('Error checking user:', err);
          // Handle the error appropriately (e.g., return an error code)
        } else {
          res.render('admin-panel',{
            users:rows
          }); // Render the EJS template
            users:rows
            console.log(rows);
          console.log(`Users fetched `);
        }
      });
     
    });
//notificaion
    app.post('/send-notification', async (req, res) => {
      const { uid, message } = req.body;
      console.log(uid, message);
      try {
        if (uid === "all") {0
          connection.query('SELECT UID FROM `users`', (err, rows) => {
            if (err) {
              console.error('Error fetching user IDs:', err);
              // Handle error (e.g., send error response to client)
              return;
            }
    
            // Iterate through retrieved UIDs and send message to each user
            rows.forEach((row) => {
              const userUid = row.UID;
              bot.sendMessage(userUid, message); // Assuming message is in req.body
            });
    
            res.send('Notifications sent successfully to all users'); // Send success response
          });
        } else {
          const { uid, message } = req.body;
          console.log(uid, message);
          bot.sendMessage(uid, message);
        }
      } catch (err) {
        console.error('Error sending notification:', err);
        // Handle error (e.g., send error response to client)
      }
    });

    app.listen(80, () => {
      console.log("Running!")
    })

const waitingUsers = []; // Queue for users waiting for a chat room
const activeChats = {}; // Object to store active chat rooms (key: chat ID, value: array of user IDs)

// Function to create a new chat room
function createChatRoom(user1, user2) {
  const chatId = Math.random().toString(36).substring(2, 15); // Generate unique chat ID
  activeChats[chatId] = [user1, user2];

  // Remove users from waiting queue
  waitingUsers.splice(waitingUsers.indexOf(user1), 1);
  waitingUsers.splice(waitingUsers.indexOf(user2), 1);
   console.log("------------------------------");
   console.log("waitingUsers:",waitingUsers);
   console.log("activeChats",activeChats);
   console.log("------------------------------");
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
    if (activeChats[chatId] && activeChats[chatId].includes(userId)) {
      const partnerId = activeChats[chatId].filter(id => id !== userId)[0];

      // Error handling: check if partner found
      if (partnerId) {
        sendMessage(partnerId, `${userId}: ${messageText}`); // Send message to partner
      } else {
        console.log("------------------------------");
        console.log("activeChats",activeChats);
       // console.error(`Error: Partner not found in chat ${chatId} for user ${userId}`);
        console.log("------------------------------");
      }
    } else {
      console.log("------------------------------");
      console.log("activeChats",activeChats);
      //console.error(`Error: User ${userId} not found in active chat list for chat ${chatId}`);
      
      console.log("------------------------------");
    }
  });
}
// Handle incoming messages
bot.onText(/\/start/, async (msg) => {
  try {
    checkAndAddUser(msg.chat.id);
    //addUser(msg.chat.id)
    //await log(msg.chat.id); // Wait for log to finish
  } catch (error) {
    console.error(error);
  }
  bot.sendMessage(msg.chat.id, "Welcome \n /search");
});
// /Stop

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
try{
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

}catch(err){
  console.log(err);
}
});
// Assuming you know the usernames (user1 and user2)
function getChatId(user1) {
  // Loop through all active chats
  for (const chatId in activeChats) {
    const participants = activeChats[chatId];
    // Check if the participants match the provided users
    if (participants.includes(user1)) {
      console.log(`Found the chat ID ${user1}`);
      return chatId; // Found the chat ID, return it
    }
  }
  console.log("Chat ID not found");
  return null; // Chat ID not found
}

function deleteChatRoom(chatId) {
  if (activeChats.hasOwnProperty(chatId)) {
    console.log("activeChats",activeChats);

    console.log(activeChats[chatId]);
    console.log(activeChats[chatId][0]);
    console.log(activeChats[chatId][1]);


    delete activeChats[chatId];
    // Additional steps might be needed, like notifying users and removing messages (implementation not shown)
    console.log(`Chat room with ID ${chatId} deleted.`);
    console.log("activeChats",activeChats);
  } else {
    console.log(`Chat room with ID ${chatId} not found.`);
  }
}

bot.onText(/\/stop/, (msg) => {
  const chatId = getChatId(msg.chat.id);
  if (chatId) {
    if (activeChats[chatId] && activeChats[chatId].includes(msg.chat.id)) {
      const partnerId = activeChats[chatId].filter(id => id !== msg.chat.id)[0];
      bot.sendMessage(partnerId, "Your partner left the chat");
    }
    deleteChatRoom(chatId);
    bot.sendMessage(msg.chat.id, "You've left the chat.");

  } else {
    console.log("User not in a chat room.");
  }
  // Inform user regardless of chat room existence
  
});

bot.on('message', (msg) => {
    // Optional: Logging code for debugging 
});
bot.on("polling_error", console.log);