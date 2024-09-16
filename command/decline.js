const fs = require('fs').promises;
const path = require('path');

const gamesFilePath = path.join(__dirname, '../data/games.json');

module.exports = {
    name: 'decline',
    execute: async (message, api) => {
        const uid = message.senderID;

        // Đọc dữ liệu games.json
        const gamesData = JSON.parse(await fs.readFile(gamesFilePath, 'utf8'));

        // Tìm trò chơi cần xóa
        const gameIndex = gamesData.findIndex(game => game.receiverID === uid && game.status === 'pending');

        if (gameIndex === -1) {
            return api.sendMessage('🚫 Không có lời mời nào để từ chối.', message.threadID);
        }

        // Xóa trò chơi khỏi danh sách
        gamesData.splice(gameIndex, 1);
        await fs.writeFile(gamesFilePath, JSON.stringify(gamesData, null, 2));

        api.sendMessage('✅ Bạn đã từ chối lời mời chơi bài.', message.threadID);
    }
};
