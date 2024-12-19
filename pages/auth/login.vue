<template>
  <view class="container">
    <view class="logo">
      <image src="/static/images/logo.png" mode="aspectFit" />
      <text class="title">美食分享</text>
      <text class="subtitle">分享美食，分享生活</text>
    </view>

    <button
      class="login-btn"
      open-type="getUserProfile"
      @getuserinfo="handleLogin"
      :loading="isLoading"
    >
      微信一键登录
    </button>

    <view class="agreement">
      登录即代表您同意
      <text class="link" @tap="goToAgreement('user')">用户协议</text>
      和
      <text class="link" @tap="goToAgreement('privacy')">隐私政策</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLoading: false,
    };
  },

  methods: {
    async handleLogin(e) {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        // 获取用户信息
        const userProfile = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: "用于完善用户资料",
            success: resolve,
            fail: reject,
          });
        });

        // 获取登录code
        const loginResult = await new Promise((resolve, reject) => {
          uni.login({
            provider: "weixin",
            success: resolve,
            fail: reject,
          });
        });

        if (!loginResult.code) {
          throw new Error("获取登录凭证失败");
        }

        // 调用云函数登录
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "login",
            params: {
              code: loginResult.code,
              userInfo: userProfile.userInfo,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        // 保存登录状态
        uni.setStorageSync("token", res.result.data._id);
        uni.setStorageSync("userInfo", res.result.data);

        uni.showToast({
          title: "登录成功",
          icon: "success",
        });

        // 延迟返回，让用户看到登录成功提示
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            uni.switchTab({
              url: "/pages/index/index",
            });
          }
        }, 1500);
      } catch (error) {
        console.error("登录失败:", error);
        uni.showToast({
          title: error.message || "登录失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
      }
    },

    goToAgreement(type) {
      uni.navigateTo({
        url: `/pages/agreement/${type}`,
      });
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120rpx;
  padding: 40rpx;
  background: #fff;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;

  image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }

  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 16rpx;
  }

  .subtitle {
    font-size: 28rpx;
    color: #999;
  }
}

.login-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07c160;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  margin-bottom: 40rpx;

  &::after {
    border: none;
  }
}

.agreement {
  font-size: 24rpx;
  color: #999;

  .link {
    color: #07c160;
    display: inline;
  }
}
</style>
