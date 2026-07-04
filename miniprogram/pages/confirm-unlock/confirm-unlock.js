/**
 * ============================================
 * 开锁确认页
 * ============================================
 * 功能说明：
 * 1. 展示单车编号和状态
 * 2. 用户点击"确认开锁"模拟开锁过程
 * 3. 模拟2秒开锁等待（带旋转动画）
 * 4. 开锁成功后存储行程信息到全局变量
 * 5. 开锁失败后可重试
 * 6. 显示计费标准
 * 
 * 页面跳转来源：首页点击单车后的底部弹窗"扫码开锁"按钮
 * 页面跳转去向：行程中页面（成功时）/ 返回首页（取消时）
 * ============================================
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    bikeId: '',            // 单车编号（从首页URL参数传入）
    bikeLocation: null,    // 单车位置坐标（从首页URL参数传入）
    unlockStatus: 'idle'   // 开锁状态：idle（等待操作）| unlocking（开锁中）| success（成功）| fail（失败）
  },

  /**
   * onLoad - 页面加载
   * 接收从首页通过 URL 参数传来的数据
   * 
   * options 参数说明：
   * 首页跳转代码：wx.navigateTo({
   *   url: '...?bikeId=1001&latitude=31.23&longitude=121.47'
   * })
   * 所以这里的 options.bikeId = '1001'（字符串）
   */
  onLoad(options) {
    // 从 URL 参数中取出单车编号和位置
    const { bikeId, latitude, longitude } = options;
    
    // 设置页面数据
    this.setData({
      bikeId: bikeId || '未知',
      // 注意：URL参数都是字符串，需要用 parseFloat 转成数字
      bikeLocation: { 
        latitude: parseFloat(latitude || 0), 
        longitude: parseFloat(longitude || 0) 
      }
    });

    // 修改导航栏标题，显示当前操作的单车
    wx.setNavigationBarTitle({
      title: `开锁 - 单车${bikeId || ''}`
    });
  },

  /**
   * confirmUnlock - 点击"确认开锁"
   * 模拟真实开锁流程：
   * 1. 状态变为 unlocking（显示"开锁中..."和旋转动画）
   * 2. 延迟2秒模拟开锁过程
   * 3. 随机结果（95%成功，5%失败）
   * 4. 成功时保存行程信息到全局变量
   */
  confirmUnlock() {
    // 更新状态为"开锁中"
    this.setData({ unlockStatus: 'unlocking' });

    // setTimeout 模拟2秒的开锁等待时间
    // 真实场景中这里会调用后端API验证
    setTimeout(() => {
      // Math.random() 生成0~1的随机数，<0.95 的概率为95%
      const success = Math.random() < 0.95;
      
      if (success) {
        // ===== 开锁成功 =====
        this.setData({ unlockStatus: 'success' });
        
        /**
         * 将开锁信息存入全局变量
         * getApp() 获取小程序实例
         * app.globalData 是所有页面共享的数据存储空间
         * 
         * 存什么？
         * - bikeId: 当前骑的是哪辆车
         * - startTime: 行程开始时间（用于计时和计费）
         * - location: 开锁时的位置
         */
        const app = getApp();
        app.globalData.currentTrip = {
          bikeId: this.data.bikeId,
          startTime: new Date().toISOString(),  // ISO格式时间字符串
          location: this.data.bikeLocation
        };
        
        console.log('[开锁] 开锁成功，行程开始:', app.globalData.currentTrip);
      } else {
        // ===== 开锁失败（模拟5%的失败率）=====
        this.setData({ unlockStatus: 'fail' });
        console.log('[开锁] 开锁失败');
      }
    }, 2000);  // 2秒后执行
  },

  /**
   * retryUnlock - 重试开锁
   * 开锁失败后，点击"重试"回到初始状态
   */
  retryUnlock() {
    this.setData({ unlockStatus: 'idle' });
    console.log('[开锁] 重试开锁');
  },

  /**
   * goBack - 取消/返回
   * 点击"取消"返回首页
   * wx.navigateBack 返回上一页（首页）
   */
  goBack() {
    console.log('[开锁] 取消开锁，返回首页');
    wx.navigateBack();
  },

  /**
   * goTrip - 开始骑行
   * 开锁成功后，点击"开始骑行"跳转到行程中页面
   * 
   * wx.redirectTo 和 wx.navigateTo 的区别：
   * - navigateTo: 保留当前页面，跳转到新页面（可返回）
   * - redirectTo: 关闭当前页面，跳转到新页面（不能返回）
   * 
   * 这里用 redirectTo 是因为：
   * 开锁成功后不应该再回到"开锁确认页"，
   * 用户应该直接进入"行程中"页面
   */
  goTrip() {
    console.log('[开锁] 跳转到行程页面');
    wx.redirectTo({
      url: '/pages/trip/trip'
    });
  }
});