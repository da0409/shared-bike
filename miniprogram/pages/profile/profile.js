/**
 * ============================================
 * 个人中心页
 * ============================================
 * 功能说明：
 * 1. 显示用户头像、昵称
 * 2. 通过 wx.getUserProfile 获取微信用户信息
 * 3. 查看骑行记录入口
 * 4. 退出登录（清除本地用户信息缓存）
 * 
 * 页面跳转来源：首页底部导航栏"我的"
 * 页面跳转去向：骑行记录页
 * ============================================
 */

Page({
  /**
   * 页面初始数据
   */
  data: {
    avatarUrl: '',     // 用户微信头像URL
    nickName: '',      // 用户微信昵称
    phone: '',         // 手机号（模拟数据）
    isLoggedIn: false  // 是否已登录（是否已获取用户信息）
  },

  /**
   * onShow - 每次页面显示时触发
   * 每次回到个人中心都检查是否有用户信息缓存
   * 
   * 为什么用 onShow 而不是 onLoad？
   * 因为用户可能在其他页面获取了用户信息，
   * 返回时需要刷新显示，onLoad 只执行一次不够
   */
  onShow() {
    // 从本地缓存读取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      // 如果有缓存，直接显示
      this.setData({
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        isLoggedIn: true
      });
    }
  },

  /**
   * getUserInfo - 获取微信用户信息
   * 
   * wx.getUserProfile 是微信小程序提供的API
   * 会弹出授权窗口，让用户确认是否允许获取信息
   * 
   * 注意：2021年后微信调整了策略，
   * wx.getUserProfile 只能获取到昵称和头像，
   * 手机号需要另外调用 wx.login + 云函数才能获取
   * 
   * desc 参数是必须的，说明获取信息的目的
   */
  getUserInfo() {
    wx.getUserProfile({
      desc: '用于展示用户信息',      // 授权说明（必须）
      success: (res) => {
        // 授权成功，获取用户信息
        const { avatarUrl, nickName } = res.userInfo;

        /**
         * 模拟手机号
         * 
         * 真实场景中获取手机号需要：
         * 1. 调用 wx.login 获取 code
         * 2. 调用云函数，用 code 换取手机号
         * 3. 这需要开通云开发
         * 
         * 所以这里用模拟数据替代
         */
        const phone = '138****' + String(Math.floor(1000 + Math.random() * 9000));

        // 保存到本地缓存
        const userInfo = { avatarUrl, nickName, phone };
        wx.setStorageSync('userInfo', userInfo);

        // 更新页面显示
        this.setData({
          avatarUrl,
          nickName,
          phone,
          isLoggedIn: true
        });

        // 提示成功
        wx.showToast({
          title: '获取用户信息成功',
          icon: 'success'
        });
      },
      fail: () => {
        // 用户拒绝授权
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * goToRecords - 跳转到骑行记录页
   */
  goToRecords() {
    wx.navigateTo({
      url: '/pages/ride-records/ride-records'
    });
  },

  /**
   * logout - 退出登录
   * 
   * 步骤：
   * 1. 弹出确认对话框
   * 2. 用户确认后清除本地缓存的用户信息
   * 3. 重置页面数据
   */
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地缓存的用户信息
          wx.removeStorageSync('userInfo');
          
          // 重置页面数据（回到未登录状态）
          this.setData({
            avatarUrl: '',
            nickName: '',
            phone: '',
            isLoggedIn: false
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});