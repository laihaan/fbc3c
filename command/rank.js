const fs = require('fs');
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng
const dataFilePath = path.join(__dirname, '../data/data.json');

// Danh sách các cấp độ và hình ảnh tương ứng
const rankImages = [
    { amount: 100000, rank: 'Iron 1', image: 'i1.webp' },
    { amount: 200000, rank: 'Iron 2', image: 'i2.webp' },
    { amount: 300000, rank: 'Iron 3', image: 'i3.webp' },
    { amount: 500000, rank: 'Bronze 1', image: 'br1.webp' },
    { amount: 600000, rank: 'Bronze 2', image: 'br2.webp' },
    { amount: 800000, rank: 'Bronze 3', image: 'br3.webp' },
    { amount: 1000000, rank: 'Silver 1', image: 's1.webp' },
    { amount: 1500000, rank: 'Silver 2', image: 's2.webp' },
    { amount: 2000000, rank: 'Silver 3', image: 's3.webp' },
    { amount: 5000000, rank: 'Gold 1', image: 'g1.webp' },
    { amount: 7000000, rank: 'Gold 2', image: 'g2.webp' },
    { amount: 9000000, rank: 'Gold 3', image: 'g3.webp' },
    { amount: 10000000, rank: 'Platinum 1', image: 'p1.webp' },
    { amount: 15000000, rank: 'Platinum 2', image: 'p2.webp' },
    { amount: 30000000, rank: 'Platinum 3', image: 'p3.webp' },
    { amount: 40000000, rank: 'Diamond 1', image: 'd1.webp' },
    { amount: 60000000, rank: 'Diamond 2', image: 'd2.webp' },
    { amount: 80000000, rank: 'Diamond 3', image: 'd3.webp' },
    { amount: 100000000, rank: 'Ascendant 1', image: 'a1.webp' },
    { amount: 150000000, rank: 'Ascendant 2', image: 'a2.webp' },
    { amount: 300000000, rank: 'Ascendant 3', image: 'a3.webp' },
    { amount: 500000000, rank: 'Immortal 1', image: 'im1.webp' },
    { amount: 700000000, rank: 'Immortal 2', image: 'im2.webp' },
    { amount: 1000000000, rank: 'Immortal 3', image: 'im3.webp' },
    { amount: 1500000000, rank: 'Radiant', image: 'radiant.webp' }
];

// Hàm lấy cấp độ dựa trên số tiền
const getRankImage = (money) => {
    for (let i = rankImages.length - 1; i >= 0; i--) {
        if (money >= rankImages[i].amount) {
            return rankImages[i];
        }
    }
    return null;
};

// Hàm thực thi lệnh xếp hạng
module.exports = {
    name: 'rank',
    execute: async (message, api) => {
        const uid = message.senderID;

        // Đọc dữ liệu từ file JSON
        const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        const user = data.find(user => user.senderID === uid);

        if (!user) {
            return api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
        }

        if (user.money < 100000) {
            return api.sendMessage('💰 Bạn chưa đủ 100,000 VND để vào bảng xếp hạng.', message.threadID);
        }

        const currentRank = getRankImage(user.money);
        const previousRank = getRankImage(user.money - 1); // Giả sử tiền giảm đi 1 để tìm cấp bậc trước đó

        if (currentRank.rank !== previousRank?.rank) {
            // Người dùng lên cấp mới
            api.sendMessage(`🎉 Chúc mừng ${user.name || 'Người dùng'}! Bạn đã lên hạng ${currentRank.rank} với số tiền: ${user.money.toLocaleString()} VND.`, message.threadID);
        }

        const imagePath = path.join(__dirname, '../ranks', currentRank.image);

        // Gửi hình ảnh xếp hạng với thông tin tên người dùng và số tiền
        api.sendMessage({
            body: `🏆 ${user.name || 'Người dùng'} đã đạt được xếp hạng ${currentRank.rank} với số tiền: ${user.money.toLocaleString()} VND.`,
            attachment: fs.createReadStream(imagePath)
        }, message.threadID);
    }
};
