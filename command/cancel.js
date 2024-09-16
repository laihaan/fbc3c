const fs = require('fs').promises;
const path = require('path');


const gamesFilePath = path.join(__dirname, '../data/games.json');

module.exports = {
    name: 'cancel',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {

            const gamesFile = await fs.readFile(gamesFilePath, 'utf8');
            const games = JSON.parse(gamesFile);


            const index = games.findIndex(game => game.senderID === uid && game.status === 'pending');
            if (index === -1) {
                api.sendMessage('🚫 Bạn không có lời mời chơi bài nào để hủy.', message.threadID);
                return;
            }


            games.splice(index, 1);


            await fs.writeFile(gamesFilePath, JSON.stringify(games, null, 2));

            api.sendMessage('✅ Bạn đã hủy lời mời chơi bài thành công.', message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh !cancel:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
