
let BASE_URL = 'http://';
let BASE_TOKEN = '';
const FormData = require('form-data');
const mime = require('mime-types')
const axios = require('axios')

const createContact = async (req) => {
  const phone = req.key.remoteJid.replace("@s.whatsapp.net", "")
  const response = await axios(`${BASE_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: JSON.stringify({
      'identifier': phone,
      'name': req.pushName,
      'phone_number': "+" + phone,
    })
  });
  const res = await response.json();

  return res.payload.contact;
}

const searchContact = async (contactId) => {
  const response = await axios(`${BASE_URL}/contacts/search?q=${contactId}&sort=phone_number`, {
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
  const response = await axios(`${BASE_URL}/contacts/${contactId}/conversations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
  });
  const res = await response.json();
  try {
    return res?.payload[0];
  } catch (error) {
    return false;
  }
  
}

const createConversation = async (contactId, inboxId) => {
  const response = await axios(`${BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: JSON.stringify({
      'contact_id': contactId,
      'inbox_id': inboxId,
      'status': 'pending'
    })
  });
  const data = await response.json();


  return data;
}

const sendMessage = async (text, conversationId, additional_attributes) => {
  const response = await axios(`${BASE_URL}/conversations/${conversationId}/messages`, {
  // const response = await axios('https://webhook.site/4cfb455c-1989-44bf-8822-9b143a897935', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-access-token": BASE_TOKEN,
    },
    body: JSON.stringify({
      'content': text,
      'message_type': 0,
      'private': false,
      'additional_attributes' : additional_attributes
    })
  });
  // const data = await response.json();
  // return data;
}

const sendFile = async (text, conversationId, data) => {

  try {
    const Content = data.message?.imageMessage ?? data.message?.videoMessage ?? data.message?.documentMessage ?? data.message?.AudioMessage;

    let formData = new FormData();
    
    formData.append('attachments[]', Buffer.from(data.msgContent, 'base64'), { 
      contentType: Content.mimetype,
      filename: data.message?.documentMessage ? Content.title : data.key.id + "." + mime.extension(Content.mimetype)
    });
    formData.append('message_type', 'incoming');
    formData.append('private', "false");
    formData.append('content', Content.caption);
  
    const response = await axios(`${BASE_URL}/conversations/${conversationId}/messages`, {
    // const response = await axios(`https://webhook.site/a24eff67-b955-4291-8861-cca4845378cb`, {
      method: "POST",
      headers: {
        "api-access-token": BASE_TOKEN,
      },
      body: formData
    });
  
    return await response;
  } catch (error) {
    console.error(error);
    console.log('Tidak bisa kirim file');
  }

}

module.exports = async function chatwootMsg(url, data, myCache) {
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


  if (data?.update || data?.message?.update  || data.key.fromMe) return { error: null } ;

  const numberId = data.key.remoteJid.replace("@s.whatsapp.net", "").replace(" ","");


  let contactReg, conversationReg;
  if (!myCache.has(`contact_${numberId}`)) {
    const contact = await searchContact(numberId)
    contactReg = (contact) ? contact.id : (await createContact(data)).id
    myCache.set(`contact_${numberId}`, contactReg)
  } else contactReg = myCache.get(`contact_${numberId}`)

  if (!myCache.has(`conversation_${numberId}`)) {
    const conversation = await getConversation(contactReg)
    conversationReg = (conversation) ? conversation.id : (await createConversation(contactReg, inboxId)).id;
    myCache.set(`conversation_${numberId}`, conversationReg)
  } else conversationReg = myCache.get(`conversation_${numberId}`)

  if (data.message?.imageMessage || data.message?.videoMessage || data.message?.documentMessage || data.message?.AudioMessage ) {
    sendFile(data.message.conversation, conversationReg, data)    
  } else {
    let content_attributes = { 'masuk' :'mangga'};
    let message = data.message?.conversation || data.message?.buttonsResponseMessage?.selectedButtonId || data.message?.listResponseMessage?.singleSelectReply.selectedRowId || (data.message?.orderMessage ? 'Order Message' : 'undefined');
    // jika ada orderan masuk
    if (message == 'Order Message') {
      let order = data.message?.orderMessage
      message = `New Order: ${order.orderId} - ${order.token}`;
    }
    sendMessage(message, conversationReg, content_attributes)
  }

  return {
    'content': data.message.conversation,
    'message_type': 0,
    'private': false
  }
}