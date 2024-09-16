const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến các file JSON
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const huntbotFilePath = path.join(__dirname, '../data/huntbot.json');

// Hàm thực thi lệnh hinfo
module.exports = {
    name: 'hinfo',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [dataFile, inventoryFile, huntbotFile] = await Promise.all([
                fs.readFile(dataFilePath, 'utf8'),
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(huntbotFilePath, 'utf8')
            ]);

            let data, inventory, huntbot;
            try {
                data = JSON.parse(dataFile);
                inventory = JSON.parse(inventoryFile);
                huntbot = JSON.parse(huntbotFile);
            } catch (parseError) {
                console.error('Lỗi phân tích JSON:', parseError);
                api.sendMessage('🚨 Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng kiểm tra dữ liệu và thử lại sau.', message.threadID);
                return;
            }

            // Tìm thông tin người dùng trong huntbot.json
            let userHuntbot = huntbot.find(user => user.uid === uid);

            if (!userHuntbot) {
                api.sendMessage('🚫 Không tìm thấy thông tin của bạn trong hệ thống. Vui lòng thử lại sau.', message.threadID);
                return;
            }

            // Tính thời gian còn lại của phiên săn bắn (nếu có)
            const now = Date.now();
            const lastHunt = userHuntbot.lastHunt || 0;
            const durationMinutes = userHuntbot.duration.value;
            const timeElapsed = now - lastHunt;
            const remainingMinutes = Math.max(0, Math.ceil(durationMinutes - (timeElapsed / 60000)));

            // Gửi thông báo thông tin
            let messageText = `🔍 *Thông tin săn bắn của bạn:*\n\n`;
            messageText += `- *Hiệu suất*: ${userHuntbot.efficiency.value} con/phút\n`;
            messageText += `- *Essence thu được*: ${userHuntbot.gain.value} Essence/phút\n`;
            messageText += `- *Thời gian hiện tại*: ${userHuntbot.duration.value} phút\n`;
            messageText += `- *Thời gian còn lại*: ${remainingMinutes} phút\n\n`;
            messageText += `*Hướng dẫn sử dụng lệnh !hb:*\n`;
            messageText += `- Gõ !hb [số phút] để bắt đầu săn bắn trong số phút bạn chọn. Tối đa là 30 phút.\n\n`;
            messageText += `*Cách nâng cấp:*\n`;
            messageText += `- Sử dụng lệnh !ugain [số essence] để nâng cấp Essence thu được.\n`;
            messageText += `- Sử dụng lệnh !ueff [số essence] để nâng cấp hiệu suất săn bắn.\n`;
            messageText += `- Sử dụng lệnh !uduration [số essence] để nâng cấp thời gian săn bắn.\n`;

            api.sendMessage(messageText, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh hinfo:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh hinfo. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
