
let BASE_URL = 'http://';
let BASE_TOKEN = '';
const fetch = require('node-fetch')
const FormData = require('form-data');
const mime = require('mime-types')

const createContact = async (req) => {
  const phone = req.key.remoteJid.replace("@s.whatsapp.net", "")
  const response = await fetch(`${BASE_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: {
      'identifier': phone,
      'name': req.pushNamer,
      'phone_number': phone,
    }
  });
  const res = await response.json();

  return res.payload.contact;
}

const searchContact = async (contactId) => {
  const response = await fetch(`${BASE_URL}/contacts/search?q=${contactId}&sort=phone_number`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
  });
  const res = await response.json();

  return (res.meta.count > 0) ? res.payload[0] : null;
}

const getConversation = async (contactId) => {
  const response = await fetch(`${BASE_URL}/contacts/${contactId}/conversations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
  });
  const res = await response.json();

  return res.payload[0];
}

const createConversation = async (contactId, inboxId) => {
  const response = await fetch(`${BASE_URL}/conversations/${inboxId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: {
      'contact_id': contactId,
      'inbox_id': inboxId,
    }
  });
  const data = await response.json();
  return data;
}

const sendMessage = async (text, conversationId) => {
  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: JSON.stringify({
      'content': text,
      'message_type': 0,
      'private': false
    })
  });
  const data = await response.json();
  return data;
}

const sendFile = async (text, conversationId, data) => {

  const Content = data.message?.imageMessage ?? data.message?.videoMessage ?? data.message?.documentMessage ?? data.message?.AudioMessage;

  let formData = new FormData();
  
  formData.append('attachments[]', Buffer.from(data.msgContent, 'base64'), { 
    contentType: Content.mimetype,
    filename: data.message?.documentMessage ? Content.title : data.key.id + "." + mime.extension(Content.mimetype)
  });
  formData.append('message_type', 'incoming');
  formData.append('private', "false");
  formData.append('content', Content.caption);

  const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
  // const response = await fetch(`https://webhook.site/a24eff67-b955-4291-8861-cca4845378cb`, {
    method: "POST",
    headers: {
      "api-access-token": BASE_TOKEN,
    },
    body: formData
  });

  return await response;
}

module.exports = async function chatwootMsg(url, data, type) {
  const domain = (new URL(url));
  const url_data = url.match(/\/app\/accounts\/(\d+)\/inbox\/(\d+)/);
  const accountId = url_data[1];
  const inboxId = url_data[2];
  const config = {
    host: domain.origin,
    apiAccessToken: domain.searchParams.get('key')
  }

  BASE_URL = `${config.host}/api/v1/accounts/${accountId}`;
  BASE_TOKEN = domain.searchParams.get('key');

  const numberId = data.key.remoteJid.replace("@s.whatsapp.net", "").replace(" ","");

  const contact = await searchContact(numberId)
  const contactReg = (contact) ? contact.id : await createContact(data).id
  const conversation = await getConversation(contactReg)
  const conversationReg = (conversation) ? conversation.id : await createConversation(contactReg, inboxId).id;

  if (data.message?.imageMessage || data.message?.videoMessage || data.message?.documentMessage || data.message?.AudioMessage ) {
    sendFile(data.message.conversation, conversationReg, data)    
  } else {
    sendMessage(data.message.conversation, conversationReg)
  }

  return {
    'content': data.message.conversation,
    'message_type': 0,
    'private': false
  }
}