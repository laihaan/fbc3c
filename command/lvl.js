const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Hàm tính cấp độ dựa trên XP
const calculateLevel = (xp) => {
    let level = 0;
    let xpRequired = 100; // XP cần thiết cho cấp 1
    let multiplier = 2; // Nhân đôi XP cần thiết cho mỗi cấp

    while (xp >= xpRequired) {
        xp -= xpRequired;
        level++;
        xpRequired *= multiplier;
    }

    return { level, xpRequired: xpRequired - xp };
};

// Hàm tính tỷ lệ tiền thưởng dựa trên cấp độ
const calculateMoneyMultiplier = (level) => {
    return 1 + Math.floor(level / 5) * 0.01; // Mỗi 5 cấp độ tăng 1%
};

// Hàm lấy tên người dùng từ UID
const getNameFromUid = async (uid) => {
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));
    const user = data.find(user => user.senderID === uid);
    return user ? user.name || 'Người dùng' : 'Người dùng';
};

// Hàm lưu dữ liệu người dùng
const saveData = async (data) => {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
};

// Xuất đối tượng module với thuộc tính name và phương thức execute
module.exports = {
    name: 'lvl',
    execute: async (message, api) => {
        const { body, mentions, senderID, messageReply, threadID } = message;

        let uid;
        let name = 'bạn';
        if (messageReply && messageReply.senderID) {
            uid = messageReply.senderID; // Nếu có trả lời tin nhắn, lấy UID của người trả lời
        } else if (body.indexOf('@') !== -1) {
            uid = Object.keys(mentions)[0]; // Nếu có tag, lấy UID của người được tag
            name = await getNameFromUid(uid); // Lấy tên của người được tag
        } else {
            uid = senderID; // Nếu không có tag hoặc trả lời, lấy UID của người gửi tin nhắn
        }

        // Đọc dữ liệu từ file data.json
        const data = JSON.parse(await fs.readFile(dataFilePath, 'utf8'));

        // Tìm người dùng trong dữ liệu
        const user = data.find(user => user.senderID === uid);

        if (user) {
            const { level, xpRequired } = calculateLevel(user.xp);

            // Cập nhật cấp độ của người dùng nếu có thay đổi
            const oldLevel = user.level || 0;
            user.level = level;
            user.xpRequired = xpRequired;
            await saveData(data);

            const response = `🎉 **LVL CỦA ${name} là: ${level}\nCần thêm ${xpRequired} XP để lên cấp tiếp theo.**`;
            api.sendMessage(response, threadID);

            if (oldLevel < level) {
                const levelUpMessage = `🎉 Chúc mừng ${name}! Bạn đã lên cấp ${level}! 🎉`;
                api.sendMessage(levelUpMessage, threadID);
            }
        } else {
            api.sendMessage('🚫 Không tìm thấy dữ liệu của người dùng.', threadID);
        }
    }
};
