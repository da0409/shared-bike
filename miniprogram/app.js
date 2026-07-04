/**
 * ============================================
 * 小程序全局入口文件
 * ============================================
 * 
 * App() 函数注册小程序生命周期
 * 类似于前端框架的根组件
 * 
 * globalData 是所有页面共享的全局数据
 * 任何页面都可以通过 getApp().globalData 访问
 * ============================================
 */

App({
  /**
   * onLaunch - 小程序初始化时触发
   * 全局只执行一次
   * 
   * 这里做了两件事：
   * 1. 初始化全局数据
   * 2. 初始化微信云开发（虽然当前没用云数据库）
   */
  onLaunch: function () {
    this.globalData = {
      /**
       * 云环境ID
       * 如果后续要使用云开发，需要在这里填入环境ID
       * 获取方式：微信开发者工具 -> 云开发 -> 设置 -> 环境ID
       */
      env: "",
      
      /**
       * currentTrip - 当前行程信息
       * 跨页面共享的关键数据
       * 
       * 结构：
       * {
       *   bikeId: '单车编号',        // 如'1001'
       *   startTime: 'ISO时间字符串', // 开锁时间
       *   location: {latitude, longitude}  // 开锁位置
       * }
       * 
       * 数据流向：
       * 开锁确认页（写入）-> 行程中页（读取/清空）
       * 首页（读取，用于显示"行程中"悬浮按钮）
       */
      currentTrip: null
    };
    
    // 微信云开发初始化（当前未使用）
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },
  
  /**
   * globalData
   * 注意这里又声明了一次 globalData
   * 这是微信小程序的写法要求
   * onLaunch 中的 this.globalData = {...} 会覆盖这个默认值
   */
  globalData: {
    currentTrip: null
  }
});