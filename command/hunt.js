const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng, kho và con vật
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const animalsFilePath = path.join(__dirname, '../data/animals.json');

// Hàm thực thi lệnh săn bắn
module.exports = {
    name: 'hunt',
    execute: async (message, api) => {
        const uid = message.senderID;

        try {
            // Đọc dữ liệu từ các file JSON
            const [dataFile, inventoryFile, animalsFile] = await Promise.all([
                fs.readFile(dataFilePath, 'utf8'),
                fs.readFile(inventoryFilePath, 'utf8'),
                fs.readFile(animalsFilePath, 'utf8')
            ]);

            // Xử lý lỗi JSON
            let data, inventory, animals;
            try {
                data = JSON.parse(dataFile);
                inventory = JSON.parse(inventoryFile);
                animals = JSON.parse(animalsFile);
            } catch (parseError) {
                console.error('Lỗi phân tích JSON:', parseError);
                api.sendMessage('🚨 Đã xảy ra lỗi khi phân tích dữ liệu. Vui lòng kiểm tra dữ liệu và thử lại sau.', message.threadID);
                return;
            }

            // Tìm thông tin người dùng
            let user = data.find(user => user.senderID === uid);

            if (!user) {
                api.sendMessage('🚫 Không tìm thấy dữ liệu của bạn. Hãy sử dụng lệnh !register để thêm vào hệ thống.', message.threadID);
                return;
            }

            // Kiểm tra thời gian chờ và cooldown
            const cooldownTime = 15000; // Thời gian chờ giữa các lần săn bắn (15 giây)
            const now = Date.now();

            if (user.lastHunt && now - user.lastHunt < cooldownTime) {
                api.sendMessage('⏳ Bạn cần chờ thêm 15 giây trước khi săn bắn lần nữa.', message.threadID);
                return;
            }

            // Cập nhật thời gian săn bắn
            user.lastHunt = now;

            // Chọn ngẫu nhiên một con vật để săn
            const randomAnimalIndex = Math.floor(Math.random() * animals.length);
            const selectedAnimal = animals[randomAnimalIndex];
            const animalName = selectedAnimal.name;

            // Cập nhật kho
            let userInventory = inventory.find(item => item.senderID === uid);
            if (!userInventory) {
                userInventory = { senderID: uid, items: {} };
                inventory.push(userInventory);
            }

            userInventory.items[animalName] = (userInventory.items[animalName] || 0) + 1;

            // Lưu dữ liệu vào file
            await Promise.all([
                fs.writeFile(dataFilePath, JSON.stringify(data, null, 2)),
                fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2))
            ]);

            // Gửi thông báo kết quả săn bắn
            api.sendMessage(`🎯 Bạn đã săn được con ${animalName}!`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh săn bắn:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh săn bắn. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
