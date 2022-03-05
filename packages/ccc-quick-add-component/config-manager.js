const Fs = require('fs');
const Path = require('path');

/** package.json 的路径 */
const packageJsonPath = Path.join(__dirname, 'package.json');

/** package.json 中的 key */
const itemKey = 'i18n:MAIN_MENU.package.title/i18n:ccc-quick-add-component.name/i18n:ccc-quick-add-component.search';

/** 配置管理器 */
const ConfigManager = {

    /**
     * 保存配置
     * @param {{ hotkey: string }} config 配置
     */
    save(config) {
        // 快捷键
        const jsonData = JSON.parse(Fs.readFileSync(packageJsonPath)),
            item = jsonData['main-menu'][itemKey];
        if (item['accelerator'] !== config.hotkey) {
            item['accelerator'] = config.hotkey;
            Fs.writeFileSync(packageJsonPath, JSON.stringify(jsonData, null, 2));
        }
    },

    /**
     * 读取配置
     * @returns {{ hotkey: string }}
     */
    read() {
        const jsonData = JSON.parse(Fs.readFileSync(packageJsonPath)),
            config = Object.create(null);
        config.hotkey = jsonData['main-menu'][itemKey]['accelerator'];
        // 返回配置
        return config;
    }

}

module.exports = ConfigManager;
