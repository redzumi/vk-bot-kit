import rp           from 'request-promise';
import fs           from 'fs';

const VK_API_URL = 'https://api.vk.com/';
const _events    = [];

class VKBot {
  constructor(token) {
    if(!token)
      throw new Error('Access token is required');

    this.token = token;
    this.poll = new LongPoll(this, 250);
  }

  on = (pattern, exec) => {
    //maybe should use startWith?
    _events.push({ pattern, exec });
  };

  //idk for what it here
  reply(peer, data) {
    if(typeof data === 'string')
      data = { user_id: peer, message: data };
    else
      data = Object.assign(data, { user_id: peer });
    return this.api('messages.send', data);
  }

  uploadPhoto = async (path) => {
    const data = await this.api('photos.getMessagesUploadServer');
    const upload = await rp({
      uri: data.response.upload_url,
      method: 'POST',
      formData: {
        photo: fs.createReadStream(path)
      },
      json: true
    });
    const photos = await this.api('photos.saveMessagesPhoto', upload);
    if(!photos.response || photos.response.length == 0) throw new Error('Cant upload photo: ' + photos);
    return photos.response[0];
  };

  onUpdates(updates) {
    updates.forEach((update) => {
      //4 is new message code
      if(update[0] === 4)
        return this.onMessage({
          flags:  update[2],
          peer:   update[3],
          time:   update[4],
          text:   update[6]
        })
    })
  };

  onMessage(message) {
    const targetEvent = _events.find(({ pattern }) => new RegExp(pattern).test(message.text));
    if(targetEvent) targetEvent.exec(message, new RegExp(targetEvent.pattern).exec(message.text));
  }

  api = async (method, params) => {
    if(!params) params = {};
    params.access_token = this.token;
    params.version = 5.62;

    return rp({
      uri: `${VK_API_URL}/method/${method}`,
      method: 'POST',
      formData: params,
      json: true
    });
  };
}

class LongPoll {
  constructor(client, timeout) {
    this.client = client;
    this.timeout = timeout || 1000;

    this.startPolling();
  }

  startPolling = async () => {
    await this.getPollSession();
    this.getUpdates();
  };

  getPollSession = async () => {
    const data = await this.client.api('messages.getLongPollServer');

    this.server   = `https://${data.response.server}`;
    this.key      = data.response.key;
    this.ts       = data.response.ts;
  };

  getUpdates = async (ts) => {
    const data = await rp({
      uri: this.server,
      qs: {
        act: 'a_check',
        key: this.key,
        ts: ts || this.ts,
        wait: 25,
        mode: 2,
        version: 1
      },
      json: true
    });

    //TODO errors handling

    this.client.onUpdates(data.updates);

    await this.sleep(this.timeout);
    this.getUpdates(data.ts);
  };

  sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));
}

export default VKBot;
