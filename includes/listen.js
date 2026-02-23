module.exports = function ({ api, models }) {
    const fs = require("fs-extra");
    const path = require("path");
    const moment = require("moment-timezone");

    // Import controllers
    const Users = require("./controllers/users")({ models, api });
    const Threads = require("./controllers/threads")({ models, api });
    const Currencies = require("./controllers/currencies")({ models });

    // Import logger
    const logger = require("../utils/log.js");

    /* ==================== 🔥 ARIF BABU BOT - LISTENER 🔥 ==================== */

    console.log("\n" + "=".repeat(60));
    console.log("🎧 ARIF BABU BOT - LISTENER SYSTEM 🎧");
    console.log("=".repeat(60) + "\n");

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Create a styled box message
     * @param {string} title - Box title
     * @param {string} body - Box content
     * @returns {string} Formatted box
     */
    const createStyledBox = (title, body) => {
        const line = "─".repeat(title.length + 4);
        return `
╭${line}╮
│   ${title}   │
├${line}┤
${body.split('\n').map(line => `│ ${line.padEnd(line.length)} │`).join('\n')}
╰${line}╯
        `;
    };

    /**
     * Format numbers with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    /**
     * Get current time in Asia/Kolkata
     * @returns {string} Formatted time
     */
    const getCurrentTime = () => {
        return moment.tz("Asia/Kolkata").format("HH:mm:ss DD/MM/YYYY");
    };

    // ==================== CHECKTT (INTERACTION TRACKING) ====================

    const checkttPath = path.join(__dirname, '../models/commands/checktuongtac/');
    let lastDayCheck = moment.tz("Asia/Kolkata").day();
    let isSendingTop = false;

    // Ensure checktt directory exists
    if (!fs.existsSync(checkttPath)) {
        fs.mkdirSync(checkttPath, { recursive: true });
        logger("📁 Created checktuongtac directory", "[ CHECKTT ]");
    }

    /**
     * Update interaction count for user in thread
     * @param {string} threadID - Thread ID
     * @param {string} userID - User ID
     */
    const updateInteraction = async (threadID, userID) => {
        try {
            const filePath = path.join(checkttPath, `${threadID}.json`);
            let data = { day: [], week: [], time: lastDayCheck };

            // Read existing data
            if (fs.existsSync(filePath)) {
                data = fs.readJsonSync(filePath);
            }

            const today = moment.tz("Asia/Kolkata").day();

            // Find or create day entry
            let dayEntry = data.day.find(item => item.id === userID);
            if (!dayEntry) {
                dayEntry = { id: userID, count: 0 };
                data.day.push(dayEntry);
            }
            dayEntry.count++;

            // Find or create week entry
            let weekEntry = data.week.find(item => item.id === userID);
            if (!weekEntry) {
                weekEntry = { id: userID, count: 0 };
                data.week.push(weekEntry);
            }
            weekEntry.count++;

            // Save data
            fs.writeJsonSync(filePath, data, { spaces: 4 });

        } catch (error) {
            console.error("❌ Error updating interaction:", error);
        }
    };

    /**
     * Get top chatters for a thread
     * @param {string} threadID - Thread ID
     * @param {string} type - 'day' or 'week'
     * @param {number} limit - Number of top users
     * @returns {Array} Top users
     */
    const getTopChatters = async (threadID, type = 'day', limit = 10) => {
        try {
            const filePath = path.join(checkttPath, `${threadID}.json`);
            if (!fs.existsSync(filePath)) return [];

            const data = fs.readJsonSync(filePath);
            const items = data[type] || [];

            // Get user names
            const topUsers = await Promise.all(
                items
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit)
                    .map(async (item, index) => {
                        const name = await Users.getNameUser(item.id) || "Unknown User";
                        return {
                            rank: index + 1,
                            id: item.id,
                            name: name,
                            count: item.count
                        };
                    })
            );

            return topUsers;

        } catch (error) {
            console.error("❌ Error getting top chatters:", error);
            return [];
        }
    };

    /**
     * Reset daily/weekly counters
     */
    const resetCounters = async () => {
        if (isSendingTop) return;
        isSendingTop = true;

        try {
            const currentDay = moment.tz("Asia/Kolkata").day();
            const adminIDs = [...(global.config.NDH || []), ...(global.config.ADMINBOT || [])];

            // Get all checktt files
            const checkttFiles = fs.readdirSync(checkttPath)
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));

            for (const threadID of checkttFiles) {
                const filePath = path.join(checkttPath, `${threadID}.json`);
                const data = fs.readJsonSync(filePath);

                // Daily reset
                if (lastDayCheck !== currentDay) {
                    // Send daily top
                    const dailyTop = await getTopChatters(threadID, 'day', 10);

                    if (dailyTop.length > 0) {
                        const body = dailyTop.map(user => 
                            `${user.rank}. ${user.name} → ${formatNumber(user.count)} msgs`
                        ).join('\n');

                        const message = createStyledBox("🔥 DAILY TOP CHAT", body);

                        // Send to thread
                        api.sendMessage(message, threadID, (err) => {
                            if (err) console.error("❌ Failed to send daily top:", err);
                        });
                    }

                    // Reset daily counters
                    data.day = [];
                }

                // Weekly reset (Monday = 1)
                if (currentDay === 1 && lastDayCheck !== 1) {
                    // Send weekly top
                    const weeklyTop = await getTopChatters(threadID, 'week', 10);

                    if (weeklyTop.length > 0) {
                        const body = weeklyTop.map(user => 
                            `${user.rank}. ${user.name} → ${formatNumber(user.count)} msgs`
                        ).join('\n');

                        const message = createStyledBox("👑 WEEKLY TOP CHAT", body);

                        // Send to thread
                        api.sendMessage(message, threadID, (err) => {
                            if (err) console.error("❌ Failed to send weekly top:", err);
                        });
                    }

                    // Reset weekly counters
                    data.week = [];
                }

                // Update time and save
                data.time = currentDay;
                fs.writeJsonSync(filePath, data, { spaces: 4 });
            }

            lastDayCheck = currentDay;

        } catch (error) {
            console.error("❌ Error resetting counters:", error);
        } finally {
            isSendingTop = false;
        }
    };

    // Check for day change every 10 seconds
    setInterval(async () => {
        const currentDay = moment.tz("Asia/Kolkata").day();
        if (lastDayCheck !== currentDay) {
            await resetCounters();
        }
    }, 10000);

    // ==================== DATABASE LOADING ====================

    (async () => {
        try {
            logger("📦 Loading database into memory...", "[ SYSTEM ]");

            // Load threads
            const threads = await Threads.getAll();
            for (const thread of threads) {
                const id = String(thread.threadID);
                global.data.allThreadID.push(id);
                global.data.threadData.set(id, thread.data || {});
                global.data.threadInfo.set(id, thread.threadInfo || {});
            }

            // Load users
            const users = await Users.getAll(['userID', 'name', 'data']);
            for (const user of users) {
                const id = String(user.userID);
                global.data.allUserID.push(id);
                if (user.name) global.data.userName.set(id, user.name);
            }

            // Load currencies
            const currencies = await Currencies.getAll(['userID']);
            for (const currency of currencies) {
                global.data.allCurrenciesID.push(String(currency.userID));
            }

            logger(`✅ Loaded: ${threads.length} threads, ${users.length} users, ${currencies.length} currencies`, "[ SYSTEM ]");

        } catch (error) {
            logger(`❌ Failed to load database: ${error.message}`, "[ ERROR ]");
        }
    })();

    // Display bot info
    logger(`🚀 Bot Prefix: ${global.config.PREFIX || '#'}`, "[ BOT ]");
    logger(`🤖 Bot Name: ${global.config.BOTNAME || 'ARIF BABU'}`, "[ BOT ]");
    logger(`⏰ Time: ${getCurrentTime()}`, "[ BOT ]");

    // ==================== HANDLERS IMPORT ====================

    const handleCommand = require("./handle/handleCommand")({ 
        api, models, Users, Threads, Currencies 
    });

    const handleCommandEvent = require("./handle/handleCommandEvent")({ 
        api, models, Users, Threads, Currencies 
    });

    const handleReply = require("./handle/handleReply")({ 
        api, models, Users, Threads, Currencies 
    });

    const handleReaction = require("./handle/handleReaction")({ 
        api, models, Users, Threads, Currencies 
    });

    const handleEvent = require("./handle/handleEvent")({ 
        api, models, Users, Threads, Currencies 
    });

    const handleCreateDatabase = require("./handle/handleCreateDatabase")({ 
        api, Threads, Users, Currencies, models 
    });

    // ==================== MAIN EVENT HANDLER ====================

    return async (event) => {
        try {
            // Log event in developer mode
            if (global.config.DeveloperMode) {
                console.log("📨 Event:", JSON.stringify(event, null, 2));
            }

            switch (event.type) {

                // ========== MESSAGE EVENTS ==========
                case "message":
                case "message_reply":
                case "message_unsend":

                    // Create database entry if needed
                    await handleCreateDatabase({ event });

                    // Update interaction count
                    if (event.senderID && event.threadID) {
                        await updateInteraction(event.threadID, event.senderID);
                    }

                    // Handle commands
                    await handleCommand({ event });

                    // Handle replies
                    await handleReply({ event });

                    // Handle command events
                    await handleCommandEvent({ event });

                    break;

                // ========== GROUP EVENTS ==========
                case "event":
                    await handleEvent({ event });
                    break;

                // ========== REACTION EVENTS ==========
                case "message_reaction": {

                    // 🔥 ADMIN REACTION UNSEND FEATURE 🔥
                    try {
                        const botID = api.getCurrentUserID();
                        const adminIDs = [
                            ...(global.config.ADMINBOT || []),
                            ...(global.config.NDH || [])
                        ].map(id => String(id));

                        // Allowed reactions for unsend
                        const allowedReactions = ["😉", "❤️", "😡", "🙄", "🔥", "✅", "❌"];

                        // Check conditions
                        const isAdmin = adminIDs.includes(String(event.userID));
                        const isAllowedReaction = allowedReactions.includes(event.reaction);
                        const isBotMessage = event.senderID === botID;

                        if (isAdmin && isAllowedReaction && isBotMessage && event.messageID) {

                            // Optional: Add cooldown to prevent spam
                            const cooldownKey = `unsend_${event.userID}`;
                            const now = Date.now();
                            const cooldown = 5000; // 5 seconds

                            if (!global.unsendCooldown) global.unsendCooldown = new Map();

                            const lastUnsend = global.unsendCooldown.get(cooldownKey) || 0;

                            if (now - lastUnsend > cooldown) {

                                // Unsend the message
                                api.unsendMessage(event.messageID, (err) => {
                                    if (err) {
                                        console.error("❌ Failed to unsend:", err);
                                    } else {
                                        global.unsendCooldown.set(cooldownKey, now);
                                        logger(`🗑️ Admin ${event.userID} unsent a message`, "[ REACTION ]");
                                    }
                                });
                            }
                        }

                    } catch (reactionError) {
                        console.error("❌ Reaction handler error:", reactionError);
                    }

                    // Handle reaction events for commands
                    await handleReaction({ event });

                    break;
                }

                // ========== OTHER EVENTS ==========
                case "typ":
                case "presence":
                case "read_receipt":
                    // Ignore these events
                    break;

                default:
                    // Log unknown events in dev mode
                    if (global.config.DeveloperMode) {
                        console.log("❓ Unknown event type:", event.type);
                    }
            }

        } catch (error) {
            console.error("❌ Main event handler error:", error);

            // Send error to admin in dev mode
            if (global.config.DeveloperMode && global.config.ADMINBOT?.length > 0) {
                const errorMsg = `❌ Bot Error:\n${error.message}\n\n${error.stack?.slice(0, 500)}`;
                api.sendMessage(errorMsg, global.config.ADMINBOT[0]);
            }
        }
    };
};