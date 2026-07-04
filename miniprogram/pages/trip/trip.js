/**
 * ============================================
 * 行程中页面
 * ============================================
 * 功能说明：
 * 1. 显示骑行中的计时器（每秒更新）
 * 2. 根据时长计算当前费用（0.1元/分钟）
 * 3. 模拟显示预估骑行距离
 * 4. 点击"结束行程"结束骑行
 * 5. 结束后生成骑行记录并保存到本地缓存
 * 
 * 页面跳转来源：开锁确认页（开锁成功后）
 * 页面跳转去向：首页（结束行程后）
 * ============================================
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    bikeId: '',             // 单车编号（从全局变量读取）
    startTime: null,        // 开锁时间（从全局变量读取）
    seconds: 0,             // 已骑行秒数
    formattedTime: '00:00', // 格式化后的时间文字（mm:ss）
    fee: '0.00',            // 当前费用（元）
    distance: '0.0'         // 预估骑行距离（km）
  },

  /**
   * timerInterval - 计时器ID
   * 用于在页面卸载时清除计时器
   * 如果不清除，页面关闭后计时器还在运行，会报错
   */
  timerInterval: null,

  /**
   * onLoad - 页面加载
   * 从全局变量 app.globalData.currentTrip 读取行程信息
   * 计算已过去的时间，启动计时器
   */
  onLoad() {
    // 获取全局应用实例
    const app = getApp();
    const trip = app.globalData.currentTrip;

    // 安全检查：如果没有行程数据，提示并返回
    if (!trip || !trip.startTime) {
      wx.showToast({ title: '没有进行中的行程', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 设置单车编号
    this.setData({
      bikeId: trip.bikeId,
      startTime: trip.startTime
    });

    wx.setNavigationBarTitle({ title: '行程中' });

    /**
     * 计算已经骑行了多少秒
     * 注意：如果用户开锁后停留了一段时间才进入此页面，
     * 需要把这段时间也算进去，而不是从0开始计时
     * 
     * Date.now() - 当前时间戳（毫秒）
     * new Date(trip.startTime).getTime() - 开锁时间戳（毫秒）
     * 差值除以1000得到秒数
     */
    const startMs = new Date(trip.startTime).getTime();
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    this.setData({ seconds: elapsed });
    
    // 更新显示
    this.updateDisplay();

    /**
     * setInterval - 每秒更新一次计时器
     * 1000ms = 1秒
     */
    this.timerInterval = setInterval(() => {
      // seconds + 1，然后更新显示
      this.setData({ seconds: this.data.seconds + 1 });
      this.updateDisplay();
    }, 1000);
  },

  /**
   * updateDisplay - 更新界面显示
   * 
   * 每次计时器触发时调用，更新：
   * - 时间文字（mm:ss格式）
   * - 当前费用（向上取整到分钟 × 0.1元）
   * - 预估距离（假设每分钟骑行0.3km）
   */
  updateDisplay() {
    const s = this.data.seconds;
    
    // 格式化为 mm:ss
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const formattedTime = 
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

    /**
     * 费用计算规则（PRD要求）：
     * 0.1 元/分钟，不足1分钟按1分钟算
     * Math.ceil 向上取整：即使只骑了1秒也按1分钟收费
     */
    const feeMinutes = Math.ceil(s / 60);
    const fee = (feeMinutes * 0.1).toFixed(2);   // toFixed(2)保留2位小数

    /**
     * 模拟距离计算
     * 假设平均骑行速度约 0.3km/分钟 = 18km/h
     * 这只是一个模拟数值，真实场景需要GPS定位计算
     */
    const distance = ((s / 60) * 0.3).toFixed(1);

    // 批量更新数据
    this.setData({ formattedTime, fee, distance });
  },

  /**
   * endTrip - 点击"结束行程"
   * 弹出确认对话框，用户确认后调用 finishTrip
   * 
   * wx.showModal 是微信小程序的模态对话框
   * 返回一个对象，res.confirm 表示用户是否点击了"确定"
   */
  endTrip() {
    wx.showModal({
      title: '结束行程',
      content: '确定要结束本次骑行吗？',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了"确定"
          this.finishTrip();
        }
        // 如果用户点击"取消"，什么都不做
      }
    });
  },

  /**
   * finishTrip - 执行结束行程的逻辑
   * 
   * 步骤：
   * 1. 清除计时器
   * 2. 计算最终费用和距离
   * 3. 生成骑行记录
   * 4. 保存到本地缓存（wx.setStorageSync）
   * 5. 清除全局行程数据
   * 6. 显示提示，跳回首页
   */
  finishTrip() {
    // 1. 清除计时器，防止内存泄漏
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // 2. 获取行程数据并计算最终结果
    const app = getApp();
    const trip = app.globalData.currentTrip;
    const endTime = new Date().toISOString();
    const startMs = new Date(trip.startTime).getTime();
    const durationMinutes = Math.ceil((Date.now() - startMs) / 60000);
    const fee = (durationMinutes * 0.1).toFixed(2);
    const distance = ((this.data.seconds / 60) * 0.3).toFixed(1);

    /**
     * 3. 生成骑行记录对象
     * 
     * 字段说明：
     * - id: 唯一标识（用时间戳，够用）
     * - bikeId: 骑的是哪辆车
     * - startTime/endTime: 起始和结束时间
     * - duration: 骑行总秒数
     * - distance: 骑行距离（km）
     * - fee: 费用（元）
     * - date: 骑行日期（用于按日期展示）
     */
    const record = {
      id: Date.now().toString(),
      bikeId: trip.bikeId,
      startTime: trip.startTime,
      endTime: endTime,
      duration: this.data.seconds,
      distance: parseFloat(distance),
      fee: parseFloat(fee),
      date: new Date().toLocaleDateString('zh-CN')  // 例如："2026/7/4"
    };

    /**
     * 4. 保存到本地缓存
     * 
     * wx.setStorageSync('键名', 值) - 同步存储
     * 类似 localStorage.setItem
     * 
     * 读取方式：wx.getStorageSync('键名')
     * 
     * 这里用数组存储多条骑行记录：
     * 1. 先读取已有的记录（如果没有就建空数组）
     * 2. 把新记录添加到数组最前面（unshift）
     * 3. 保存回缓存
     */
    const records = wx.getStorageSync('rideRecords') || [];
    records.unshift(record);          // 新记录放最前面
    wx.setStorageSync('rideRecords', records);

    // 5. 清除当前行程（行程结束了）
    app.globalData.currentTrip = null;

    console.log('[行程] 行程结束，记录:', record);

    // 6. 提示用户并跳转
    wx.showToast({
      title: `骑行结束，费用${fee}元`,
      icon: 'none',                  // 不显示图标
      duration: 2000                 // 持续2秒
    });

    /**
     * 延迟2秒后返回首页
     * delta: 2 表示返回上两级页面
     * 当前页面栈：首页 -> 开锁确认 -> 行程中
     * navigateBack({delta: 2}) 直接回到首页
     */
    setTimeout(() => {
      wx.navigateBack({
        delta: 2
      });
    }, 2000);
  },

  /**
   * onUnload - 页面卸载时的生命周期函数
   * 
   * 非常重要：必须清除 setInterval！
   * 如果用户通过其他方式离开此页面（比如物理返回键），
   * 计时器不会被自动清除，会一直运行并报错。
   */
  onUnload() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
});