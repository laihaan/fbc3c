// Credit: Created by LHA

const login = require('facebook-chat-api');
const fs = require('fs');
const path = require('path');

let appState;
try {
    appState = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
} catch (err) {
    console.error('Lỗi khi đọc tệp cookies.json:', err);
    return;
}


login({ appState }, (err, api) => {
    if (err) {
        console.error('Lỗi khi đăng nhập:', err);
        return;
    }


    console.log('Credit: Created by LHA');


    try {
        fs.writeFileSync('fbstate.json', JSON.stringify(api.getAppState()));
    } catch (err) {
        console.error('Lỗi khi lưu fbstate:', err);
    }


    const commandDir = path.join(__dirname, 'command');
    let commandFiles;
    try {
        commandFiles = fs.readdirSync(commandDir).filter(file => file.endsWith('.js'));
    } catch (err) {
        console.error('Lỗi khi đọc thư mục command:', err);
        return;
    }


    const commandHandlers = {};


    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandDir, file);
            const handler = require(filePath);


            if (typeof handler.name === 'string' && typeof handler.execute === 'function') {
                commandHandlers[handler.name] = handler.execute;
            } else {
                console.error(`Module ${file} không hợp lệ. Phải có thuộc tính 'name' và phương thức 'execute'.`);
            }
        } catch (err) {
            console.error(`Lỗi khi tải module ${file}:`, err);
        }
    }


    api.listenMqtt((err, message) => {
        if (err) {
            console.error('Lỗi khi lắng nghe tin nhắn:', err);
            return;
        }


        if (message.type === 'message' && message.body) {
            const content = message.body.trim();
            const prefix = '!'; 

            if (content.startsWith(prefix)) {
                const args = content.slice(prefix.length).split(/ +/);
                const commandName = args.shift().toLowerCase();

                if (commandHandlers[commandName]) {
                    try {
                        commandHandlers[commandName](message, api, args);
                    } catch (err) {
                        console.error(`Lỗi khi thực thi lệnh ${commandName}:`, err);
                    }
                } else {
                    api.sendMessage('Lệnh không hợp lệ.', message.threadID);
                }
            }
        }


        console.log(message);
    });
});
