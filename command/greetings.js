module.exports = {
    name: 'hi',
    execute: (message, api, args) => {
        // Lấy ID của người gửi tin nhắn
        const senderID = message.senderID;

        // Tạo một thông điệp chào hỏi
        const greeting = `Chào bạn!`;

        // Gửi tin nhắn chào hỏi đến người gửi
        api.sendMessage(greeting, message.threadID);
    }
};
