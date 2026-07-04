/**
 * ============================================
 * 骑行记录页
 * ============================================
 * 功能说明：
 * 1. 从本地缓存读取所有骑行记录
 * 2. 显示统计信息（总次数、总里程、总费用）
 * 3. 按时间倒序显示每条骑行记录的详情
 * 4. 没有记录时显示空状态提示
 * 
 * 页面跳转来源：个人中心页
 * ============================================
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    records: [],           // 骑行记录数组
    totalCount: 0,         // 总骑行次数
    totalDistance: '0.0',  // 总里程（km）
    totalFee: '0.00'       // 总费用（元）
  },

  /**
   * onShow - 每次页面显示时加载数据
   * 
   * 为什么用 onShow？
   * 用户可能在别处结束了行程（生成了新记录），
   * 返回骑行记录页时需要看到最新的数据
   */
  onShow() {
    this.loadRecords();
  },

  /**
   * loadRecords - 从本地缓存加载骑行记录
   * 
   * 数据存储格式：
   * wx.getStorageSync('rideRecords') 返回一个数组
   * 数组中的每个元素是一条骑行记录对象
   * 
   * 记录对象结构：
   * {
   *   id: '时间戳字符串',        // 唯一标识
   *   bikeId: '单车编号',       // 如'1001'
   *   startTime: 'ISO时间',     // 开始时间
   *   endTime: 'ISO时间',       // 结束时间
   *   duration: 秒数,           // 骑行总秒数
   *   distance: 公里数,         // 骑行距离
   *   fee: 费用,                // 骑行费用
   *   date: '日期字符串'        // 如'2026/7/4'
   * }
   */
  loadRecords() {
    // 从本地缓存读取骑行记录数组
    // || [] 表示：如果缓存中没有数据，使用空数组
    const records = wx.getStorageSync('rideRecords') || [];

    /**
     * 格式化记录数据
     * 
     * Array.map() 遍历数组，对每个元素进行处理
     * 这里给每条记录添加了 durationText 字段，
     * 把秒数转换成"X分Y秒"的格式方便显示
     */
    const formattedRecords = records.map(r => ({
      ...r,                               // 保留原来的所有字段
      durationText: this.formatDuration(r.duration)  // 添加格式化后的时长文字
    }));

    /**
     * 计算统计数据
     * 
     * reduce 是数组的累加方法：
     * - 参数1: 累加函数 (sum, r) => sum + (r.xxx || 0)
     * - 参数2: 初始值 0
     * - 把每条记录的 xxx 值加起来
     */
    const totalCount = formattedRecords.length;
    const totalDistance = formattedRecords.reduce((sum, r) => sum + (r.distance || 0), 0).toFixed(1);
    const totalFee = formattedRecords.reduce((sum, r) => sum + (r.fee || 0), 0).toFixed(2);

    // 更新页面数据
    this.setData({
      records: formattedRecords,
      totalCount,
      totalDistance,
      totalFee
    });
  },

  /**
   * formatDuration - 把秒数格式化为"X分Y秒"
   * 
   * 例如：
   * - 30秒 -> "30秒"
   * - 65秒 -> "1分5秒"
   * - 120秒 -> "2分0秒"
   * - null/undefined -> "0分钟"
   * 
   * @param {number} seconds - 总秒数
   * @returns {string} 格式化后的字符串
   */
  formatDuration(seconds) {
    if (!seconds) return '0分钟';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}秒`;       // 不足1分钟只显示秒
    return `${mins}分${secs}秒`;               // 超过1分钟显示 X分Y秒
  }
});