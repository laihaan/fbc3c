const login = require('facebook-chat-api');
const fs = require('fs');

// Đọc fbstate từ tệp JSON đã lưu
let appState = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));

module.exports = {
    name: 'deleteAfter',  // Tên module
    execute: async function ({ api, event }) {
      const { sendMessage: send, unsendMessage: un } = api;
      const { threadID: tid, messageID: mid } = event;
  
      // Nội dung tin nhắn
      const msg = "Đây là tin nhắn sẽ bị xóa sau 30 giây.";
  
      // Gửi tin nhắn
      send(msg, tid, (error, messageInfo) => {
        if (error) {
          console.error("Lỗi gửi tin nhắn:", error);
          return;
        }
        
        // Xóa tin nhắn sau 30 giây
        setTimeout(() => {
          un(messageInfo.messageID, (err) => {
            if (err) {
              console.error("Lỗi xóa tin nhắn:", err);
            }
          });
        }, 30000); // Thay đổi thời gian theo yêu cầu
      });
    }
  };
  