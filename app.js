require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.on('message', (msg) => {
    var Hi = "hi";
    if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
        bot.sendMessage(msg.from.id, "Hello  " + msg.from.first_name);
        
    }
    var bye = "bye";
    if (msg.text.toString().toLowerCase().includes(bye)) {
        bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
    }
    var robot = "I'm robot";
    if (msg.text.indexOf(robot) === 0) {
        bot.sendMessage(msg.chat.id, "Yes I'm robot but not in that way!");
    }
    });


bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "Welcome");
    });

bot.onText(/\/sendpic/, (msg) => {
    bot.sendPhoto(msg.chat.id,"https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png",{caption : "Here we go ! \nThis is just a caption "} );
    });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome", {
        "reply_markup": {
            "keyboard": [["Sample text", "Second sample"],   ["Keyboard"], ["I'm robot"]]
        }
    });
    });

bot.on('message', (msg) => {
        var location = "location";
        if (msg.text.indexOf(location) === 0) {
            bot.sendLocation(msg.chat.id,44.97108, -104.27719);
            bot.sendMessage(msg.chat.id, "Here is the point");
    
        }
    });
    