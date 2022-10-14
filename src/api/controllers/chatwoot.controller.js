exports.Chat = async (req, res) => {
    var mime = require('mime-types')
    const type_button = (message) => {
        let data = {};
        let buttons = [];
        let type = '';
        let items = message.content_attributes.items;
        data.text = message.content;
        if (items.length <= 3) {
            type = 'button';
            items.forEach(item => {
                buttons.push({
                    'title': item['title'],
                    'buttonId': item['value'],
                    'type': 'button',
                });
            });
            data.buttons = buttons;
            data.headerType = 1;
        } else {
            type = 'list';
            items.forEach(item => {
                buttons.push({
                    'title': item['title'],
                    'rowId': item['value'],
                })
            })
            data.sections = [{
                rows: buttons
            }];
            data.buttonText = 'Select / Pilih';
            data.title = "";
            data.description = '';
            data.listType = 0;
        }
        return {
            type,
            data
        };
    }

    const body = req.body;
    const number = body.conversation.meta.sender.phone_number.replace("+", "");

    if (body.message_type != 'outgoing' || body.private || body.event !== 'message_created') return;

    const message = body.conversation.messages[0];

    if (message.attachments) {
        let attachment = message.attachments[0];
        let url = attachment.data_url;
        await WhatsAppInstances[req.query.key].sendUrlMediaFile(
            number,
            url,
            attachment.file_type, // Types are [image, video, audio, document]
            mime.lookup(url), // mimeType of mediaFile / Check Common mimetypes in `https://mzl.la/3si3and`
            message.content
        )
    } else if (message.content_type && message.content_type == 'input_select') {
        let button = type_button(message); // Tipe Button
        if (button.type == 'list') {
            await WhatsAppInstances[req.query.key].sendListMessage(
                number,
                button.data
            )
        } else {
            await WhatsAppInstances[req.query.key].sendButton(
                number,
                button.data
            )

        }
    } else {
        await WhatsAppInstances[req.query.key].sendTextMessage(
            number,
            message.content
        )
    }

    return res.status(201).json({
        error: false,
    })
}