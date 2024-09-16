// Hàm thực thi lệnh shop để hướng dẫn người dùng
module.exports = {
    name: 'shop',
    execute: async (message, api) => {
        const instructions = `
        📜 **Hướng dẫn sử dụng lệnh săn bắn:**

        1. **Lệnh săn bắn 3 con (hunt3):**
            - **Cách sử dụng:** \`!hunt3\`
            - **Mô tả:** Săn bắn 3 con vật ngẫu nhiên từ kho.
            - **Yêu cầu:** Bạn cần mua thời gian sử dụng lệnh này thông qua lệnh \`!hunt3buy\`.
            - **Cách mua thời gian:** \`!hunt3buy <số phút>\`
            - **Giá:** 5,000 mỗi phút.

        2. **Lệnh săn bắn 9 con (hunt9):**
            - **Cách sử dụng:** \`!hunt9\`
            - **Mô tả:** Săn bắn 9 con vật ngẫu nhiên từ kho.
            - **Yêu cầu:** Bạn cần mua thời gian sử dụng lệnh này thông qua lệnh \`!hunt9buy\`.
            - **Cách mua thời gian:** \`!hunt9buy <số phút>\`
            - **Giá:** 50,000 mỗi phút.

        🎯 Hãy chắc chắn rằng bạn đã mua đủ thời gian trước khi sử dụng các lệnh săn bắn. Nếu có bất kỳ câu hỏi nào, đừng ngần ngại yêu cầu trợ giúp!
        `;

        api.sendMessage(instructions, message.threadID);
    }
};
