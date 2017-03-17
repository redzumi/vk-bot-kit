# vk-bot-kit
Just another bot kit implementation for VK.com

## Usage
```javascript
import VKBot from 'vk-bot-kit';
const bot = new VKBot(your_access_token);

//ping pong
bot.on(/ping/g, (message, matches) => {
  bot.reply(message.peer, 'pong');
});
```