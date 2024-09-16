const fs = require('fs').promises;
const path = require('path');

// Đường dẫn đến file JSON chứa dữ liệu người dùng, kho và con vật
const dataFilePath = path.join(__dirname, '../data/data.json');
const inventoryFilePath = path.join(__dirname, '../data/inv.json');
const animalsFilePath = path.join(__dirname, '../data/animals.json');

// Giá của lệnh hunt3
const HUNT3_COST = 50000;
const COOLDOWN_TIME = 5000; // 5 giây

// Hàm thực thi lệnh săn bắn 3 con
module.exports = {
    name: 'hunt3',
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

            // Kiểm tra thời gian sử dụng lệnh hunt3
            const now = Date.now();
            if (!user.hunt3Timeout || now > user.hunt3Timeout) {
                // Xóa timeout khi hết thời gian
                user.hunt3Timeout = null;
                user.lastHunt3Time = null;
                await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
                api.sendMessage('⏰ Thời gian sử dụng lệnh săn bắn 3 con đã hết. Bạn có thể mua thêm thời gian để tiếp tục.', message.threadID);
                return;
            }

            // Kiểm tra thời gian chờ giữa các lệnh
            if (user.lastHunt3Time && (now - user.lastHunt3Time < COOLDOWN_TIME)) {
                const remainingTime = Math.ceil((COOLDOWN_TIME - (now - user.lastHunt3Time)) / 1000);
                api.sendMessage(`⏳ Bạn phải chờ thêm ${remainingTime} giây trước khi thực hiện lệnh săn bắn 3 con tiếp theo.`, message.threadID);
                return;
            }

            // Cập nhật thời gian thực hiện lệnh
            user.lastHunt3Time = now;

            // Chọn ngẫu nhiên 3 con vật để săn
            const selectedAnimals = [];
            while (selectedAnimals.length < 3) {
                const randomAnimalIndex = Math.floor(Math.random() * animals.length);
                const selectedAnimal = animals[randomAnimalIndex];
                if (!selectedAnimals.includes(selectedAnimal)) {
                    selectedAnimals.push(selectedAnimal);
                }
            }

            // Cập nhật kho
            let userInventory = inventory.find(item => item.senderID === uid);
            if (!userInventory) {
                userInventory = { senderID: uid, items: {} };
                inventory.push(userInventory);
            }

            selectedAnimals.forEach(animal => {
                const animalName = animal.name;
                userInventory.items[animalName] = (userInventory.items[animalName] || 0) + 1;
            });

            // Lưu dữ liệu vào file
            await Promise.all([
                fs.writeFile(dataFilePath, JSON.stringify(data, null, 2)),
                fs.writeFile(inventoryFilePath, JSON.stringify(inventory, null, 2))
            ]);

            // Gửi thông báo kết quả săn bắn
            const animalNames = selectedAnimals.map(a => a.name).join(', ');
            api.sendMessage(`🎯 Bạn đã săn được các con: ${animalNames}!`, message.threadID);
        } catch (error) {
            console.error('Lỗi khi thực thi lệnh săn bắn:', error);
            api.sendMessage('🚨 Đã xảy ra lỗi khi thực hiện lệnh săn bắn. Vui lòng thử lại sau.', message.threadID);
        }
    }
};
