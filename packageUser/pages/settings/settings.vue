<template>
  <view class="container">
    <view class="menu-list">
      <view class="menu-item" @tap="goToAccount">
        <text class="title">账号与安全</text>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="goToPrivacy">
        <text class="title">隐私设置</text>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="clearCache">
        <text>清除缓存</text>
        <text class="iconfont icon-right"></text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @tap="checkUpdate">
        <text class="title">检查更新</text>
        <text class="value">当前版本 {{ version }}</text>
      </view>
    </view>

    <button class="logout-btn" @tap="handleLogout" v-if="isLogin">
      退出登录
    </button>
  </view>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      isLogin: false,
      cacheSize: "0.00MB",
      version: "1.0.0",
    };
  },

  onShow() {
    this.checkLoginStatus();
    this.getCacheSize();
  },

  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync("userInfo");
      this.isLogin = !!userInfo;
    },

    goToAccount() {
      uni.showToast({
        title: "功能开发中",
        icon: "none",
      });
    },

    goToPrivacy() {
      uni.showToast({
        title: "功能开发中",
        icon: "none",
      });
    },

    async clearCache() {
      try {
        await uni.showModal({
          title: "提示",
          content: "确定要清除缓存吗？",
          confirmText: "清除",
        });

        uni.showLoading({
          title: "清理中...",
          mask: true,
        });

        // 清除本地数据缓存
        const storageInfo = uni.getStorageInfoSync();
        storageInfo.keys.forEach((key) => {
          if (key !== "userInfo" && key !== "token") {
            uni.removeStorageSync(key);
          }
        });

        uni.hideLoading();
        uni.showToast({
          title: "清除成功",
          icon: "success",
        });

        this.getCacheSize();
      } catch (error) {
        console.log("用户取消操作");
      }
    },

    getCacheSize() {
      try {
        const storageInfo = uni.getStorageInfoSync();
        const size = storageInfo.currentSize;
        this.cacheSize = (size / 1024).toFixed(2) + "MB";
      } catch (error) {
        console.error("获取缓存大小失败:", error);
        this.cacheSize = "0.00MB";
      }
    },

    checkUpdate() {
      // #ifdef MP-WEIXIN
      const updateManager = uni.getUpdateManager();

      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            uni.showModal({
              title: "更新提示",
              content: "新版本已准备好，是否重启应用？",
              success: function (res) {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              },
            });
          });

          updateManager.onUpdateFailed(function () {
            uni.showModal({
              title: "更新提示",
              content: "新版本下载失败，请检查网络后重试",
              showCancel: false,
            });
          });
        } else {
          uni.showToast({
            title: "当前已是最新版本",
            icon: "none",
          });
        }
      });
      // #endif

      // #ifndef MP-WEIXIN
      uni.showToast({
        title: "当前已是最新版本",
        icon: "none",
      });
      // #endif
    },

    async handleLogout() {
      try {
        await uni.showModal({
          title: "提示",
          content: "确定要退出登录吗？",
          confirmText: "退出",
        });

        // 清除登录信息
        uni.removeStorageSync("userInfo");
        uni.removeStorageSync("token");

        uni.showToast({
          title: "已退出登录",
          icon: "success",
        });

        setTimeout(() => {
          // 返回上一页
          uni.navigateBack();
        }, 1500);
      } catch (error) {
        console.log("用户取消操作");
      }
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f8f8f8;
  padding: 20rpx 0;
}

.menu-list {
  background: #fff;
  margin-bottom: 20rpx;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .title {
      flex: 1;
      font-size: 30rpx;
      color: #333;
    }

    .value {
      font-size: 28rpx;
      color: #999;
      margin-right: 10rpx;
    }
  }
}

.logout-btn {
  width: 690rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  margin: 40rpx auto;
  text-align: center;

  &:active {
    opacity: 0.9;
  }
}
</style>
