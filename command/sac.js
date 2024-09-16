const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng và kho
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const huntbotFilePath = path.join(__dirname, '../data/huntbot.json');

module.exports = {
    name: 'sac',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [inventoryData, huntbotData] = await Promise.all([
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(huntbotFilePath, 'utf8')
            ]);

            const inventory = JSON.parse(inventoryData);
            const huntbot = JSON.parse(huntbotData);

            // Tìm thông tin kho của người dùng
            const userInventory = inventory.find(item => item.senderID === uid);

            if (!userInventory || !Object.keys(userInventory.items).length) {
                api.sendMessage('🚫 Bạn không có vật phẩm nào trong kho để chuyển đổi.', message.threadID);
                return;
            }

            // Chuyển đổi tất cả các vật phẩm trong kho thành Essence
            let totalEssence = 0;
            for (const [item, quantity] of Object.entries(userInventory.items)) {
                totalEssence += quantity; // 1 vật phẩm = 1 Essence
            }

            // Cập nhật số lượng Essence cho người dùng
            if (!huntbot.users[uid]) {
                huntbot.users[uid] = { essence: 0 };
            }
            huntbot.users[uid].essence += totalEssence;

            // Xóa tất cả vật phẩm trong kho của người dùng
            userInventory.items = {};

            // Lưu dữ liệu vào file
            await Promise.all([
                fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2)),
                fs.writeFile(huntbotFilePath, JSON.stringify(huntbot, null, 2))
            ]);

            // Gửi thông báo kết quả chuyển đổi
            api.sendMessage(`✅ Đã chuyển đổi toàn bộ vật phẩm trong kho thành ${totalEssence} Essence.`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh !sac:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh chuyển đổi. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
