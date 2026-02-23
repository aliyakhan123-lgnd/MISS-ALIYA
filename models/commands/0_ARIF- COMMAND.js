module.exports.config = {
    name: "cmd",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "MISS-ALIYA",
    description: "Manage / Control all bot modules",
    commandCategory: "System",
    usages: "[load/unload/loadAll/unloadAll/info/count] [module name]",
    cooldowns: 2,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

/* ================= STYLE BOX ================= */

const box = (title, body) =>
`╭─── ${title} ───╮

${body}

╰─────────────────╯`;

/* ================= LOAD COMMAND ================= */

const loadCommand = function ({ moduleList, threadID, messageID }) {
    const { execSync } = global.nodemodule["child_process"];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log");

    let errorList = [];

    delete require.cache[require.resolve(configPath)];
    let configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2), "utf8");

    for (const nameModule of moduleList) {
        try {
            const dirModule = __dirname + "/" + nameModule + ".js";
            delete require.cache[require.resolve(dirModule)];

            const command = require(dirModule);
            global.client.commands.delete(nameModule);

            if (!command.config || !command.run || !command.config.commandCategory)
                throw new Error("Invalid module structure");

            global.client.eventRegistered =
                global.client.eventRegistered.filter(e => e !== command.config.name);

            if (command.config.dependencies) {
                const listPackage = JSON.parse(readFileSync("./package.json")).dependencies;
                const builtins = require("module").builtinModules;

                for (const pkg in command.config.dependencies) {
                    try {
                        if (listPackage[pkg] || builtins.includes(pkg))
                            global.nodemodule[pkg] = require(pkg);
                        else
                            global.nodemodule[pkg] = require(
                                join(global.client.mainPath, "nodemodules", "node_modules", pkg)
                            );
                    } catch {
                        logger.loader(`[ CMD ] Installing missing package: ${pkg}`, "warn");
                        execSync(`npm install ${pkg}`, {
                            cwd: join(global.client.mainPath, "nodemodules"),
                            stdio: "inherit",
                            shell: true
                        });
                        global.nodemodule[pkg] = require(pkg);
                    }
                }
            }

            if (command.handleEvent)
                global.client.eventRegistered.push(command.config.name);

            global.client.commands.set(command.config.name, command);
            logger.loader(`[ CMD ] Loaded module: ${command.config.name}`);

        } catch (e) {
            errorList.push(`${nameModule} ❌`);
            console.error(e);
        }
    }

    api.sendMessage(
        box(
            "⚙️ CMD LOAD RESULT",
            `✅ Loaded : ${moduleList.length - errorList.length}\n` +
            `❌ Failed : ${errorList.length}\n\n` +
            `📦 Modules:\n${moduleList.join(", ")}`
        ),
        threadID,
        messageID
    );

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
    unlinkSync(configPath + ".temp");
};

/* ================= UNLOAD COMMAND ================= */

const unloadModule = function ({ moduleList, threadID, messageID }) {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log").loader;

    delete require.cache[require.resolve(configPath)];
    let configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4));

    for (const nameModule of moduleList) {
        global.client.commands.delete(nameModule);
        global.client.eventRegistered =
            global.client.eventRegistered.filter(e => e !== nameModule);

        configValue.commandDisabled.push(`${nameModule}.js`);
        global.config.commandDisabled.push(`${nameModule}.js`);

        logger(`[ CMD ] Unloaded: ${nameModule}`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4));
    unlinkSync(configPath + ".temp");

    return api.sendMessage(
        box("🧹 CMD UNLOAD", `❎ Unloaded ${moduleList.length} module(s)`),
        threadID,
        messageID
    );
};

/* ================= RUN ================= */

module.exports.run = function ({ event, args, api }) {

    if (event.senderID !== "61550534939001")
        return api.sendMessage(
            box("⛔ ACCESS DENIED", "Only BOT OWNER can use this command"),
            event.threadID,
            event.messageID
        );

    const { readdirSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;
    let moduleList = args.slice(1);

    switch (args[0]) {

        case "count":
            return api.sendMessage(
                box("📊 CMD COUNT", `Total Commands: ${global.client.commands.size}`),
                threadID,
                messageID
            );

        case "load":
            if (!moduleList.length)
                return api.sendMessage(
                    box("⚠️ ERROR", "Module name cannot be empty"),
                    threadID,
                    messageID
                );
            return loadCommand({ moduleList, threadID, messageID });

        case "unload":
            if (!moduleList.length)
                return api.sendMessage(
                    box("⚠️ ERROR", "Module name cannot be empty"),
                    threadID,
                    messageID
                );
            return unloadModule({ moduleList, threadID, messageID });

        case "loadAll":
            moduleList = readdirSync(__dirname)
                .filter(f => f.endsWith(".js") && !f.includes("example"))
                .map(f => f.replace(".js", ""));
            return loadCommand({ moduleList, threadID, messageID });

        case "unloadAll":
            moduleList = readdirSync(__dirname)
                .filter(f => f.endsWith(".js") && !f.includes("command"))
                .map(f => f.replace(".js", ""));
            return unloadModule({ moduleList, threadID, messageID });

        case "info":
            const cmd = global.client.commands.get(moduleList.join(""));
            if (!cmd)
                return api.sendMessage(
                    box("❌ NOT FOUND", "Module does not exist"),
                    threadID,
                    messageID
                );

            const c = cmd.config;
            return api.sendMessage(
                box(
                    `ℹ️ MODULE INFO`,
                    `📛 Name : ${c.name}\n` +
                    `🧑 Author : ${c.credits}\n` +
                    `📦 Version : ${c.version}\n` +
                    `🔐 Permission : ${c.hasPermssion}\n` +
                    `⏱ Cooldown : ${c.cooldowns}s\n` +
                    `📚 Packages : ${Object.keys(c.dependencies || {}).join(", ") || "None"}`
                ),
                threadID,
                messageID
            );

        default:
            return global.utils.throwError(this.config.name, threadID, messageID);
    }
};