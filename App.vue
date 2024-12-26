<script>
export default {
  globalData: {
    isLogin: false,
    userInfo: null,
  },

  onLaunch: function () {
    console.log("App Launch");
    this.checkLoginStatus();
    
    // 使用新的API获取系统信息
    const systemInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    const appBaseInfo = wx.getAppBaseInfo();
    
    console.log('系统信息:', {
      window: systemInfo,
      device: deviceInfo,
      app: appBaseInfo
    });
  },

  onShow: function () {
    console.log("App Show");
  },

  onHide: function () {
    console.log("App Hide");
  },

  methods: {
    checkLoginStatus() {
      try {
        const token = uni.getStorageSync("token");
        const userInfo = uni.getStorageSync("userInfo");

        if (token && userInfo) {
          this.globalData.isLogin = true;
          this.globalData.userInfo = userInfo;
        } else {
          this.globalData.isLogin = false;
          this.globalData.userInfo = null;
        }
      } catch (error) {
        console.error("检查登录状态失败:", error);
        this.globalData.isLogin = false;
        this.globalData.userInfo = null;
      }
    },

    // 检查是否需要登录
    checkNeedLogin() {
      if (!this.globalData.isLogin) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return true;
      }
      return false;
    },
  },
};
</script>

<style>
/* 每个页面公共css */
page {
  background-color: #f8f8f8;
}
</style>
