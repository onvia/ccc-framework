const { ipcRenderer } = require('electron');

/** 包名 */
const PACKAGE_NAME = 'ccc-quick-add-component';

new Vue({
  el: "#app",

  data: {
    /** 输入框占位符文本 */
    placeholder: '',
    /** 确认按钮文本 */
    button: '',
    /** 输入的关键字 */
    keyword: '',
    /** 关键词匹配返回的结果 */
    results: [],
    /** 当前选中的结果 */
    selected: null,
    /** 当前选中的结果下标 */
    selectedIndex: -1,
    /** 分段加载定时器 */
    loadHandler: null,
  },

  methods: {

    /**
     * 输入框更新回调
     * @param {*} event 
     */
    onInputChange(event) {
      // 取消当前选中
      this.selected = null;
      this.selectedIndex = -1;
      // 关键字为空或无效时不进行搜索
      const keyword = this.keyword;
      if (keyword === '' || keyword.includes('...')) {
        this.results.length = 0;
        return;
      }
      // 发消息给主进程进行关键词匹配
      ipcRenderer.send(`${PACKAGE_NAME}:match-keyword`, keyword);
    },

    /**
     * 上箭头按键回调
     * @param {*} event 
     */
    onUpBtnClick(event) {
      // 阻止默认事件（光标移动）
      event.preventDefault();
      // 循环选择
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      } else {
        this.selectedIndex = this.results.length - 1;
      }
      // 更新选择
      this.updateSelected();
    },

    /**
     * 下箭头按键回调
     * @param {*} event 
     */
    onDownBtnClick(event) {
      // 阻止默认事件（光标移动）
      event.preventDefault();
      // 循环选择
      if (this.selectedIndex >= this.results.length - 1) {
        this.selectedIndex = 0;
      } else {
        this.selectedIndex++;
      }
      // 更新选择
      this.updateSelected();
    },

    /**
     * 更新当前的选择
     */
    updateSelected() {
      this.selected = this.results[this.selectedIndex];
      this.keyword = this.selected.name;
      // 只有当目标元素不在可视区域内才滚动
      const id = `item-${this.selectedIndex}`;
      document.getElementById(id).scrollIntoViewIfNeeded(false);
    },

    /**
     * 结果点击回调
     * @param {string} value 
     * @param {number} index 
     */
    onResultClick(value, index) {
      this.selectedIndex = parseInt(index);
      this.selected = value;
      this.keyword = value.name;
      // 添加组件
      this.onEnterBtnClick(null);
      // 聚焦到输入框（此时焦点在列表上）
      // 换成在 onEnterBtnClick 里统一处理了
      // this.focusOnInputField();
    },

    /**
     * 确认按钮点击回调
     * @param {*} event 
     */
    onEnterBtnClick(event) {
      const selected = this.selected;
      if (!selected) {
        if (this.keyword === '') return;
        // 输入框文本动画
        const input = this.$refs.input;
        input.classList.add('search-input-error');
        setTimeout(() => input.classList.remove('search-input-error'), 500);
        return;
      }
      this.keyword = selected.name;
      // 发消息给主进程
      ipcRenderer.send(`${PACKAGE_NAME}:add-component`, selected.name);
      // 聚焦到输入框（此时焦点在按钮或列表上）
      this.focusOnInputField();
    },

    /**
     * 聚焦到输入框
     */
    focusOnInputField() {
      this.$refs.input.focus();
    },

    /**
     * （主进程）获取语言回调
     * @param {*} event 
     * @param {string} lang 语言
     */
    onGetLangReply(event, lang) {
      const texts = lang.includes('zh') ? zh : en;
      this.placeholder = texts.placeholder;
      this.button = texts.button;
    },

    /**
     * （主进程）匹配关键词回调
     * @param {*} event 
     * @param {string[]} results 结果
     */
    onMatchKeywordReply(event, results) {
      // 确保清除已有数据
      this.results.length = 0;
      // 当只有一个结果时直接选中
      if (results.length === 1) {
        this.results = results;
        this.selectedIndex = 0;
        this.selected = results[0];
        return;
      }
      // 结果数量多时分段加载
      if (results.length >= 300) {
        // 每次加载的数量
        const threshold = 150;
        // 分段加载函数
        const load = () => {
          const length = results.length,
            count = length >= threshold ? threshold : length,
            part = results.splice(0, count);
          // 加载一部分
          this.results.push(...part);
          // 是否还有数据
          if (results.length > 0) {
            // 下一波继续
            this.loadHandler = setTimeout(load);
          } else {
            // Done
            this.loadHandler = null;
          }
        }
        // 开始加载
        load();
        return;
      }
      // 数量不多，更新结果列表
      this.results = results;
    },

    /**
     * （主进程）添加组件回调
     * @param {*} event 
     */
    onAddComponentReply(event) {
      // 隐藏搜索栏
      ipcRenderer.send(`${PACKAGE_NAME}:close`);
    },

  },

  /**
   * 生命周期：挂载后
   */
  mounted() {
    // 监听事件
    ipcRenderer.on(`${PACKAGE_NAME}:get-lang-reply`, this.onGetLangReply.bind(this));
    ipcRenderer.on(`${PACKAGE_NAME}:match-keyword-reply`, this.onMatchKeywordReply.bind(this));
    ipcRenderer.on(`${PACKAGE_NAME}:add-component-reply`, this.onAddComponentReply.bind(this));
    // 发送事件：获取语言
    ipcRenderer.send(`${PACKAGE_NAME}:get-lang`);
    // （下一帧）聚焦到输入框
    this.$nextTick(() => this.focusOnInputField());
  },

  /**
   * 生命周期：销毁前
   */
  beforeDestroy() {
    // 取消事件监听
    ipcRenderer.removeAllListeners(`${PACKAGE_NAME}:get-lang-reply`);
    ipcRenderer.removeAllListeners(`${PACKAGE_NAME}:match-keyword-reply`);
    ipcRenderer.removeAllListeners(`${PACKAGE_NAME}:add-component-reply`);
  },

});

/** 多语言：中文 */
const zh = {
  placeholder: '请输入组件名称...',
  button: '确认'
}

/** 多语言：英语 */
const en = {
  placeholder: 'Component name...',
  button: 'Add'
}
