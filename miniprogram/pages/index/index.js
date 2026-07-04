/**
 * ============================================
 * 首页 - 地图找车页面
 * ============================================
 * 功能说明：
 * 1. 显示地图，在地图上标注附近的共享单车（绿色标记）
 * 2. 点击单车标记弹出底部操作面板（显示单车信息 + 扫码开锁按钮）
 * 3. 底部导航栏："找车"（首页）和"我的"（个人中心）
 * 4. 右上角定位按钮：获取用户当前位置
 * 5. 如果有进行中的行程，显示悬浮的"行程中"按钮
 * 
 * 数据来源：模拟数据（随机生成10辆单车），不是从后端获取
 * ============================================
 */

/**
 * 生成模拟单车数据
 * 作用：在指定中心点周围随机生成10辆共享单车的位置
 * 参数：
 *   lat - 中心纬度
 *   lng - 中心经度
 * 返回值：符合微信小程序地图 marker 格式的数组
 * 
 * 关于微信小程序地图 marker 的说明：
 * - id: 标记的唯一编号，点击事件通过它来识别是哪个标记被点击
 * - iconPath: 标记图标路径（支持本地图片和网络图片）
 * - latitude/longitude: 标记的位置坐标
 * - callout: 标记上显示的气泡文字（点击标记会显示）
 * - width/height: 图标尺寸（单位是px，不是rpx）
 */
function generateMockBikes(lat, lng) {
  const bikes = [];
  for (let i = 1; i <= 10; i++) {
    // 在中心点周围约500米范围内随机分布
    // 纬度1度 ≈ 111km，所以0.01度 ≈ 1.1km
    // 经度1度 ≈ 111km*cos(纬度)，上海cos(31°)≈0.86，所以0.015度 ≈ 1.3km
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    
    bikes.push({
      id: i,                        // 标记的ID，从1到10
      iconPath: '/images/bike-marker.png',  // 绿色单车图标（需要在images目录下有这个文件）
      width: 36,                    // 图标宽度（px）
      height: 36,                   // 图标高度（px）
      latitude: lat + latOffset,    // 单车纬度 = 中心纬度 + 随机偏移
      longitude: lng + lngOffset,   // 单车经度 = 中心经度 + 随机偏移
      bikeId: String(1000 + i),     // 单车编号（1001~1010），方便用户识别
      isInUse: false,               // 是否被使用，模拟全是空闲车
      
      // callout - 标记上的气泡说明
      // 注意：display: 'ALWAYS' 表示一直显示，不点击也显示
      callout: {
        content: `🚲 单车 ${String(1000 + i)}`,  // 气泡文字内容
        fontSize: 13,                             // 字体大小
        borderRadius: 8,                          // 气泡圆角
        bgColor: '#ffffff',                       // 背景色
        padding: 8,                               // 内边距
        color: '#333333',                         // 文字颜色
        display: 'ALWAYS',                        // 总是显示
        textAlign: 'center'                       // 文字居中
      }
    });
  }
  return bikes;
}

/**
 * Page() 是微信小程序注册页面的函数
 * 每个页面都有自己的 data（数据）、生命周期函数（onLoad等）、事件处理函数
 */
Page({
  /**
   * 页面的初始数据
   * 相当于 React 的 state 或 Vue 的 data
   * 在 WXML 中通过 {{变量名}} 来使用
   */
  data: {
    centerLat: 31.2304,      // 地图中心纬度（默认定位在上海）
    centerLng: 121.4737,     // 地图中心经度（默认定位在上海）
    scale: 15,               // 地图缩放级别（3~20，越大越精细）
    markers: [],             // 地图标记数组（存放所有单车的位置）
    showBottomSheet: false,  // 是否显示底部弹窗（点击单车后弹出）
    selectedBike: null,      // 当前选中的单车对象（存了单车的所有信息）
    isOnTrip: false,         // 是否有进行中的行程
    currentTripBikeId: ''    // 当前行程的单车编号
  },

  /**
   * 生命周期函数 - onLoad
   * 页面加载时触发（只执行一次）
   * 类似于 React 的 componentDidMount
   * 适合做初始化操作：生成模拟数据、读取缓存等
   */
  onLoad() {
    console.log('[首页] onLoad 页面加载');
    
    // 生成10辆模拟单车，存放在 markers 中
    const markers = generateMockBikes(this.data.centerLat, this.data.centerLng);
    console.log('[首页] 生成了', markers.length, '辆模拟单车');
    this.setData({ markers });

    // 检查是否已经有进行中的行程（比如从开锁页跳转过来的）
    this.checkActiveTrip();
  },

  /**
   * 生命周期函数 - onShow
   * 页面每次显示时触发（每次回到这个页面都会执行）
   * 注意：onLoad 只执行一次，但 onShow 每次返回都会执行
   * 所以把"检查行程状态"放在这里，确保每次回到首页都能更新
   */
  onShow() {
    console.log('[首页] onShow 页面显示');
    this.checkActiveTrip();
  },

  /**
   * checkActiveTrip - 检查是否有进行中的行程
   * 通过读取全局变量 app.globalData.currentTrip 来判断
   * 如果有行程，显示悬浮的"行程中"按钮
   * 
   * 为什么用全局变量？
   * 因为跨页面共享数据需要全局变量或缓存，
   * 小程序中 app.globalData 是最简单的跨页面通信方式
   */
  checkActiveTrip() {
    // getApp() 获取小程序全局 App 实例，可以访问 globalData
    const app = getApp();
    
    // 判断 globalData 中是否有 currentTrip 且包含 startTime
    if (app.globalData.currentTrip && app.globalData.currentTrip.startTime) {
      // 有行程 -> 显示"行程中"悬浮按钮
      this.setData({
        isOnTrip: true,
        currentTripBikeId: app.globalData.currentTrip.bikeId
      });
    } else {
      // 没有行程 -> 隐藏悬浮按钮
      this.setData({ isOnTrip: false, currentTripBikeId: '' });
    }
  },

  /**
   * onMarkerTap - 点击地图标记（单车图标）
   * 
   * 微信小程序的事件对象 e 包含：
   *   e.type - 事件类型（'markertap'）
   *   e.detail - 事件详细数据
   *   e.detail.markerId - 被点击的标记的 id
   *   
   * 注意：e.markerId 是错的！必须用 e.detail.markerId
   * 这是微信小程序的规范，不同组件事件的数据格式不同
   */
  onMarkerTap(e) {
    console.log('[首页] 点击单车标记');
    
    // 从事件对象中取出被点击标记的ID
    const markerId = e.detail && e.detail.markerId;
    console.log('[首页] 点击的标记ID:', markerId);
    
    // 在 markers 数组中查找 id 匹配的单车
    const marker = this.data.markers.find(m => m.id === markerId);
    
    if (marker) {
      console.log('[首页] 找到了单车:', marker.bikeId);
      
      // 保存选中的单车信息，并显示底部弹窗
      // setData 是更新页面数据的唯一方式，类似 React 的 setState
      this.setData({
        selectedBike: marker,        // 保存选中的单车
        showBottomSheet: true        // 显示底部弹窗
      });
    } else {
      console.log('[首页] 没找到对应的单车, ID:', markerId);
    }
  },

  /**
   * onMapTap - 点击地图空白区域
   * 作用：关闭底部弹窗
   * 
   * 注意：点击单车标记也会触 map 的 tap 事件，
   * 如果不用 if 判断，弹窗会被立刻关闭，
   * 这就是之前"点击单车没反应"的 bug 原因！
   */
  onMapTap() {
    console.log('[首页] 点击地图空白处');
    
    // 只有在弹窗已显示时才关闭
    if (this.data.showBottomSheet) {
      this.setData({ showBottomSheet: false });
    }
  },

  /**
   * goToUnlock - 跳转到开锁确认页
   * wx.navigateTo 跳转页面（保留当前页面，可返回）
   * 通过 URL 参数传递单车编号和位置
   */
  goToUnlock() {
    console.log('[首页] 点击"扫码开锁"');
    const bike = this.data.selectedBike;
    if (!bike) return;  // 防止没有选中单车时出错

    // URL 参数传递方式：?key=value&key2=value2
    // 接收方在 onLoad(options) 中获取
    wx.navigateTo({
      url: `/pages/confirm-unlock/confirm-unlock?bikeId=${bike.bikeId}&latitude=${bike.latitude}&longitude=${bike.longitude}`
    });

    // 关闭底部弹窗
    this.setData({ showBottomSheet: false });
  },

  /**
   * goToProfile - 跳转到个人中心页
   */
  goToProfile() {
    console.log('[首页] 跳转到个人中心');
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  /**
   * goToCurrentTrip - 跳转到行程中页面
   * 通过"行程中"悬浮按钮触发
   */
  goToCurrentTrip() {
    console.log('[首页] 跳转到当前行程');
    wx.navigateTo({
      url: '/pages/trip/trip'
    });
  },

  /**
   * onMyLocationTap - 定位到我的位置
   * wx.getLocation 需要用户授权定位权限
   * 
   * 注意：
   * type: 'gcj02' 是中国标准的坐标系统（火星坐标）
   * 微信地图默认使用 gcj02 坐标
   * 
   * 成功后会重新生成附近的单车（以当前位置为中心）
   */
  onMyLocationTap() {
    console.log('[首页] 点击定位按钮');
    
    wx.getLocation({
      type: 'gcj02',   // 坐标类型：gcj02（火星坐标）
      success: (res) => {
        // 定位成功：更新地图中心到当前位置
        this.setData({
          centerLat: res.latitude,
          centerLng: res.longitude
        });
        
        // 以新位置为中心重新生成单车
        const markers = generateMockBikes(res.latitude, res.longitude);
        this.setData({ markers });
        
        console.log('[首页] 定位成功:', res.latitude, res.longitude);
      },
      fail: () => {
        // 定位失败（可能是用户拒绝授权或定位服务关闭）
        wx.showToast({
          title: '获取位置失败，请检查定位权限',
          icon: 'none'   // 不显示成功/失败的图标，只显示文字
        });
      }
    });
  }
});