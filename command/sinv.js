const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng và kho
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const animalsFilePath = path.join(__dirname, '../data/animals.json');
const mineralsFilePath = path.join(__dirname, '../data/minerals.json');

module.exports = {
    name: 'sinv',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [inventoryData, animalsData, mineralsData, userData] = await Promise.all([
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(animalsFilePath, 'utf8'),
                fs.readFile(mineralsFilePath, 'utf8'),
                fs.readFile(dataFilePath, 'utf8')
            ]);

            const inventory = JSON.parse(inventoryData);
            const animals = JSON.parse(animalsData);
            const minerals = JSON.parse(mineralsData);
            const users = JSON.parse(userData);

            // Kiểm tra kiểu dữ liệu
            if (!Array.isArray(minerals)) {
                throw new Error('Dữ liệu khoáng sản không phải là mảng.');
            }

            // Tìm thông tin kho và người dùng
            let userInventory = inventory.find(item => item.senderID === uid);
            let user = users.find(user => user.senderID === uid);

            if (!userInventory) {
                userInventory = { senderID: uid, items: {} };
                inventory.push(userInventory);
            }

            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            if (Object.keys(userInventory.items).length > 0) {
                let totalValue = 0;
                let totalXp = 0;
                let sellMessage = '💰 Bạn đã bán tất cả các con vật và khoáng sản trong kho:\n';

                for (const [item, quantity] of Object.entries(userInventory.items)) {
                    const animal = animals.find(a => a.name === item);
                    const mineral = minerals.find(m => m.name === item);

                    if (animal) {
                        const itemValue = animal.value;
                        const sellValue = itemValue * quantity;
                        const itemXp = sellValue * 1.5; // XP nhận được là giá trị x 1.5

                        totalValue += sellValue;
                        totalXp += itemXp;

                        sellMessage += `- ${item}: x${quantity} (Tổng giá trị: ${sellValue.toFixed(2)} VND)\n`;
                    } else if (mineral) {
                        const itemValue = mineral.value;
                        const sellValue = itemValue * quantity;
                        const itemXp = sellValue * 1.5; // XP nhận được là giá trị x 1.5

                        totalValue += sellValue;
                        totalXp += itemXp;

                        sellMessage += `- ${item}: x${quantity} (Tổng giá trị: ${sellValue.toFixed(2)} VND)\n`;
                    }
                }

                // Tính tiền thưởng dựa trên cấp độ
                const moneyMultiplier = calculateMoneyMultiplier(user.level || 0);
                const totalMoney = Math.round(totalValue * moneyMultiplier);

                user.money = (user.money || 0) + totalMoney;
                user.xp = (user.xp || 0) + totalXp;

                userInventory.items = {}; // Xóa tất cả các con vật và khoáng sản trong kho

                // Lưu dữ liệu vào file
                await Promise.all([
                    fs.writeFile(dataFilePath, JSON.stringify(users, null, 2)),
                    fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2))
                ]);

                api.sendMessage(`${sellMessage}Tổng tiền: ${totalMoney.toFixed(2)} VND\nTổng XP: ${totalXp.toFixed(2)}`, message.threadID);
            } else {
                api.sendMessage('🚫 Bạn không có con vật hoặc khoáng sản nào trong kho để bán.', message.threadID);
            }
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh bán kho:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh bán kho. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

// Hàm tính tỷ lệ tiền thưởng dựa trên cấp độ
const calculateMoneyMultiplier = (level) => {
    return 1 + Math.floor(level / 5) * 0.01; // Mỗi 5 cấp độ tăng 1%
};
