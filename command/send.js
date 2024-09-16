const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm chuyển đổi định dạng số tiền với ký hiệu
const parseAmount = (amount) => {
    const match = amount.match(/^(\d+)([kmb])$/i);
    if (match) {
        const value = parseFloat(match[1]);
        switch (match[2].toLowerCase()) {
            case 'k': return value * 1000;
            case 'm': return value * 1000000;
            case 'b': return value * 1000000000;
        }
    }
    return parseFloat(amount);
};

// Hàm thực thi lệnh gửi tiền
module.exports = {
    name: 'send',
    execute: async (message, api) => {
        const senderID = message.senderID;
        const mentionedUsers = Object.keys(message.mentions); // Lấy danh sách UID của những người được tag
        const args = message.body.split(' ').slice(1); // Lấy các tham số từ lệnh

        if (mentionedUsers.length === 0 || args.length < 2) {
            return api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng sử dụng: !send @tênngườinhận sốtiền.', message.threadID);
        }

        const recipientID = mentionedUsers[0]; // Lấy UID của người đầu tiên được tag
        const amount = parseAmount(args[args.length - 1]);

        if (isNaN(amount) || amount <= 0) {
            return api.sendMessage('🚫 Số tiền không hợp lệ.', message.threadID);
        }

        // Đọc dữ liệu từ file JSON
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const sender = data.find(user => user.senderID === senderID);
        const recipient = data.find(user => user.senderID === recipientID);

        if (!sender) {
            return api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }

        if (!recipient) {
            return api.sendMessage('🚫 Không tìm thấy dữ liệu của người nhận. Hãy yêu cầu họ sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }

        if (sender.money < amount) {
            return api.sendMessage('🚫 Số dư của bạn không đủ để gửi.', message.threadID);
        }

        // Thực hiện giao dịch
        sender.money = Math.round(sender.money - amount);
        recipient.money = Math.round(recipient.money + amount);

        // Lưu dữ liệu vào file
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

        // Lấy tên người dùng từ thông tin đã lưu
        const senderName = sender.name || 'Người gửi';
        const recipientName = recipient.name || 'Người nhận';

        // Gửi thông báo kết quả
        api.sendMessage(`💸 ${senderName} đã gửi ${amount.toLocaleString()} VND cho ${recipientName}.`, message.threadID);
    }
};
