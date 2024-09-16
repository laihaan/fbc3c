const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng và kho
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm thực thi lệnh xem kho
module.exports = {
    name: 'inv',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ file kho và file dữ liệu người dùng
            const [inventoryData, dataFile] = await Promise.all([
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(dataFilePath, 'utf8')
            ]);

            const inventory = JSON.parse(inventoryData);
            const data = JSON.parse(dataFile);

            // Tìm thông tin kho của người dùng và tên người gửi
            const userInventory = inventory.find(item => item.senderID === uid);
            const userData = data.find(user => user.senderID === uid);
            const userName = userData ? userData.name || 'Người dùng' : 'Người dùng';

            // Tính tổng số con vật đã hunt trong kho
            let totalHuntedInInventory = 0;
            if (userInventory) {
                totalHuntedInInventory = Object.values(userInventory.items).reduce((sum, quantity) => sum + quantity, 0);
            }

            if (userInventory && Object.keys(userInventory.items).length > 0) {
                // Tạo thông báo với danh sách con vật
                let invMessage = `🗃️ Đây là kho của ${userName}:\n`;
                let count = 0;

                for (const [item, value] of Object.entries(userInventory.items)) {
                    if (count >= 200) break; // Giới hạn số con vật hiển thị
                    invMessage += `- ${item}: x${value}\n`;
                    count++;
                }

                if (count === 200 && Object.keys(userInventory.items).length > 200) {
                    invMessage += '⚠️ Danh sách kho đã được giới hạn ở 200 con vật. Không lưu thêm dữ liệu. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.';
                }

                // Thêm thông tin tổng số con vật đã hunt trong kho
                invMessage += `\n📊 Tổng số con vật đã hunt trong kho: ${totalHuntedInInventory}`;

                api.sendMessage(invMessage, message.threadID);
            } else {
                api.sendMessage('🚫 Bạn không có con vật nào trong kho.', message.threadID);
            }
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh xem kho:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh xem kho. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
