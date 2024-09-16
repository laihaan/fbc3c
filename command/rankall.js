const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm thực thi lệnh xếp hạng tất cả người dùng
module.exports = {
    name: 'rankall',
    execute: async (message, api) => {
        try {
            // Đọc dữ liệu từ file JSON
            const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

            // Kiểm tra dữ liệu hợp lệ
            if (!Array.isArray(data)) {
                throw new Error('Dữ liệu không hợp lệ');
            }

            // Sắp xếp người dùng theo số dư giảm dần
            data.sort((a, b) => (b.money || 0) - (a.money || 0));

            // Tạo danh sách người dùng và số dư
            let rankingMessage = '📝 Bảng xếp hạng người dùng:\n';
            data.forEach((user, index) => {
                const money = user.money ? user.money.toLocaleString() : '0';
                rankingMessage += `${index + 1}. ${user.name || 'Người dùng'} - ${money} VND\n`;
            });

            // Gửi thông báo bảng xếp hạng
            api.sendMessage(rankingMessage, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh rankall:', error.message);
            api.sendMessage('Có lỗi xảy ra khi thực thi lệnh xếp hạng.', message.threadID);
        }
    }
};
