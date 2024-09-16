const fs = require('fs').promises;
const path = require('path');

const helpFilePath = path.join(__dirname, '../data/help.json');

module.exports = {
    name: 'help',
    execute: async (message, api) => {
        const helpData = JSON.parse(await fs.readFile(helpFilePath, 'utf8'));
        const command = message.body.split(' ')[1];
        
        if (command) {
            // Hiển thị thông tin cho lệnh cụ thể
            const commandHelp = helpData.find(cmd => cmd.name === command);
            if (commandHelp) {
                api.sendMessage(commandHelp.description, message.threadID);
            } else {
                api.sendMessage('🚫 Lệnh không hợp lệ. Vui lòng kiểm tra lại và thử lại.', message.threadID);
            }
        } else {
            // Hiển thị danh sách các lệnh
            let helpMessage = '🛠️ **Danh sách lệnh**:\n';
            helpData.forEach(cmd => {
                helpMessage += `**${cmd.name}**: ${cmd.description}\n`;
            });
            api.sendMessage(helpMessage, message.threadID);
        }
    }
};
