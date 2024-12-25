<template>
  <view class="login">
    <view class="header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">美食分享</text>
      <text class="subtitle">分享美食，分享生活</text>
    </view>

    <button
      class="login-btn"
      open-type="getUserInfo"
      @getuserinfo="handleLogin"
    >
      微信一键登录
    </button>

    <view class="tips">
      <text class="tip-text">登录即表示同意</text>
      <text class="link">《用户协议》</text>
      <text class="tip-text">和</text>
      <text class="link">《隐私政策》</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
    };
  },

  methods: {
    async handleLogin(e) {
      if (this.loading) return;

      try {
        this.loading = true;

        // 获取用户信息
        const userInfo = e.detail.userInfo;
        if (!userInfo) {
          throw new Error("用户拒绝授权");
        }

        // 获取登录code
        const { code } = await uni.login();
        if (!code) {
          throw new Error("获取登录凭证失败");
        }

        console.log("开始调用登录云函数...");
        const { result } = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "login",
            params: {
              code,
              userInfo,
            },
          },
        });

        console.log("登录结果:", result);

        if (result.code === 0 && result.data) {
          // 保存用户信息
          getApp().globalData.userInfo = result.data;
          uni.setStorageSync("userInfo", result.data);

          uni.showToast({
            title: "登录成功",
            icon: "success",
          });

          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(result.msg || "登录失败");
        }
      } catch (error) {
        console.error("登录失败:", error);
        uni.showToast({
          title: error.message || "登录失败",
          icon: "none",
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style lang="scss">
.login {
  min-height: 100vh;
  padding: 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;

  .header {
    margin-top: 100rpx;
    margin-bottom: 100rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .logo {
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 40rpx;
    }

    .title {
      font-size: 48rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
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

    &:active {
      opacity: 0.9;
    }
  }

  .tips {
    font-size: 24rpx;
    color: #999;
    text-align: center;

    .tip-text {
      margin: 0 4rpx;
    }

    .link {
      color: #07c160;
      display: inline;
    }
  }
}
</style>
