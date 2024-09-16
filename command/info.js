const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm thực thi lệnh thông tin người dùng
module.exports = {
    name: 'info',
    execute: async (message, api) => {
        const uid = message.senderID;

        // Đọc dữ liệu từ file JSON
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

        // Tìm người dùng trong dữ liệu
        const user = data.find(user => user.senderID === uid);

        if (user) {
            // Tạo thông báo
            const response = `📋 **Thông tin của bạn**:\n\n` +
                             `🆔 **UID**: ${uid}\n` +
                             `👤 **Tên người dùng**: ${user.name || "Chưa có tên"}\n` +
                             `💰 **Số dư**: ${user.money || 0} VND\n` +
                             `⭐ **XP**: ${user.xp || 0}\n` +
                             `🎖️ **Cấp độ**: ${getLevelAndXP(user.xp).level}\n` +
                             `🐟 **Số kg cá câu được**: ${user.fish || 0} kg`;

            api.sendMessage(response, message.threadID);
        } else {
            api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }
    }
};

// Hàm tính cấp độ dựa trên XP
const getLevelAndXP = (xp) => {
    let level = 1;
    while (xp >= calculateLevelUpXP(level)) {
        xp -= calculateLevelUpXP(level);
        level++;
    }
    return { level, xp };
};

// Tính XP cần thiết để lên cấp
const calculateLevelUpXP = (currentLevel) => {
    if (currentLevel < 10) return 100;
    if (currentLevel < 50) return 500;
    if (currentLevel < 100) return 1000;
    return 3000;
};
