const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Giá trị thưởng hàng ngày
const DAILY_REWARD_BASE = 5000;
const COOLDOWN_TIME = 24 * 60 * 60 * 1000; // 24 giờ

// Hàm thực thi lệnh nhận phần thưởng hàng ngày
module.exports = {
    name: 'daily',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ file JSON
            const dataFile = await fs.readFile(dataFilePath, 'utf8');
            const data = JSON.parse(dataFile);

            // Tìm thông tin người dùng
            let user = data.find(user => user.senderID === uid);

            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            // Kiểm tra thời gian nhận phần thưởng hàng ngày
            const now = Date.now();
            if (user.lastDailyClaim && (now - user.lastDailyClaim < COOLDOWN_TIME)) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - user.lastDailyClaim)) / (60 * 60 * 1000));
                api.sendMessage(`⏳ Bạn đã nhận phần thưởng hàng ngày. Hãy quay lại sau ${remainingTime} giờ để nhận phần thưởng tiếp theo.`, message.threadID);
                return;
            }

            // Cập nhật thời gian nhận phần thưởng
            user.lastDailyClaim = now;

            // Tính phần thưởng dựa trên cấp độ
            const level = user.level || 0;
            const moneyMultiplier = 1 + Math.floor(level / 5) * 0.01;
            const dailyReward = DAILY_REWARD_BASE * moneyMultiplier;

            user.money = (user.money || 0) + dailyReward;

            // Lưu dữ liệu vào file
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

            // Gửi thông báo cho người dùng
            api.sendMessage(`🎉 Bạn đã nhận phần thưởng hàng ngày là ${dailyReward.toFixed(2)} VND!`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh nhận phần thưởng hàng ngày:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh nhận phần thưởng hàng ngày. Vui lòng thử lại sau.', message.threadID);
        }
    }
};

// Hàm tính tỷ lệ tiền thưởng dựa trên cấp độ
const calculateMoneyMultiplier = (level) => {
    return 1 + Math.floor(level / 5) * 0.01; // Mỗi 5 cấp độ tăng 1%
};
