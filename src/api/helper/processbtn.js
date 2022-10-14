module.exports = function processButton(buttons) {
    const preparedButtons = []

    buttons.map((button, index) => {
        if (button.type == 'replyButton') {
            preparedButtons.push({
                index: index + 1,
                quickReplyButton: {
                    displayText: button.title ?? '',
                    id: button.payload ?? '',
                },
            })
        }

        if (button.type == 'callButton') {
            preparedButtons.push({
                index: index + 1,
                callButton: {
                    displayText: button.title ?? '',
                    phoneNumber: button.payload ?? '',
                },
            })
        }
        if (button.type == 'urlButton') {
            preparedButtons.push({
                index: index + 1,
                urlButton: {
                    displayText: button.title ?? '',
                    url: button.payload ?? '',
                },
            })
        }
        if (button.type == 'button') {
            preparedButtons.push({
                'buttonId': button.buttonId,
                'buttonText': {
                    'displayText': button.title ?? '',
                },
                type: 1
            })
        }
    })
    return preparedButtons
}
