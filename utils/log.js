// ===== utils/log.js (COMPLETE FILE WITH LOADER) =====

const chalk = require('chalk');
const moment = require('moment-timezone');

// Main logger function
module.exports = function (type, message) {
    try {
        const timestamp = moment().tz('Asia/Kolkata').format('HH:MM:ss DD/MM/YYYY');

        const styles = {
            info: { color: chalk.blue, symbol: 'ℹ️' },
            success: { color: chalk.green, symbol: '✅' },
            warn: { color: chalk.yellow, symbol: '⚠️' },
            error: { color: chalk.red, symbol: '❌' },
            debug: { color: chalk.magenta, symbol: '🔍' },
            cmd: { color: chalk.cyan, symbol: '⚡' },
            event: { color: chalk.hex('#8A2BE2'), symbol: '📢' },
            database: { color: chalk.hex('#808080'), symbol: '🗄️' }
        };

        const style = styles[type] || styles.info;
        console.log(style.color(`[${timestamp}] ${style.symbol} ${message}`));
    } catch (error) {
        console.log(message);
    }
};

// 🔥 IMPORTANT: LOADER FUNCTION - YEH ADD KARO 🔥
module.exports.loader = (message, type = 'info') => {
    const timestamp = moment().tz('Asia/Kolkata').format('HH:MM:ss DD/MM/YYYY');
    const loaderFrames = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];
    const randomFrame = loaderFrames[Math.floor(Math.random() * loaderFrames.length)];

    const colors = {
        info: chalk.blue,
        success: chalk.green,
        warn: chalk.yellow,
        error: chalk.red,
        database: chalk.cyan,
        event: chalk.magenta
    };

    const color = colors[type] || chalk.blue;
    console.log(color(`[${timestamp}] ${randomFrame} ${message}`));
};

// Individual logger functions
module.exports.info = (message) => module.exports('info', message);
module.exports.success = (message) => module.exports('success', message);
module.exports.warn = (message) => module.exports('warn', message);
module.exports.error = (message) => module.exports('error', message);
module.exports.debug = (message) => module.exports('debug', message);
module.exports.cmd = (message) => module.exports('cmd', message);
module.exports.event = (message) => module.exports('event', message);
module.exports.db = (message) => module.exports('database', message);

// ARIF BABU special functions
module.exports.arif = (message) => {
    console.log(chalk.hex('#FFD700').bold(`✅ ARIF BABU: ${message}`));
};

module.exports.bhidu = (message) => {
    console.log(chalk.hex('#FFA500').bold(`💔 ARIF BABU: ${message}`));
};

module.exports.dungi = (message) => {
    console.log(chalk.hex('#FF69B4').bold(`🤗 ARIF BABU: ${message}`));
};