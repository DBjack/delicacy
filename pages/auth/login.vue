<template>
  <view class="container">
    <view class="header">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit" />
      <text class="title">美食天地</text>
      <text class="subtitle">发现美食，分享生活</text>
    </view>

    <view class="login-box">
      <button class="login-btn" @tap="handleLogin" :loading="isLoading">
        微信一键登录
      </button>
      <text class="tips">登录后即可发布内容和参与互动</text>
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
    async handleLogin() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        // 1. 获取用户信息
        const userProfile = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: "用于完善用户资料",
            success: resolve,
            fail: reject,
          });
        });

        // 2. 获取登录code
        const loginRes = await uni.login({
          provider: "weixin",
        });

        if (!loginRes.code) {
          throw new Error("获取登录凭证失败");
        }

        // 3. 调用云函数登录
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "login",
            params: {
              code: loginRes.code,
              userInfo: {
                nickName: userProfile.userInfo.nickName,
                avatarUrl: userProfile.userInfo.avatarUrl,
                gender: userProfile.userInfo.gender,
                country: userProfile.userInfo.country,
                province: userProfile.userInfo.province,
                city: userProfile.userInfo.city,
              },
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg || "登录失败");
        }

        // 4. 保存登录状态
        uni.setStorageSync("token", res.result.data._id);
        uni.setStorageSync("userInfo", res.result.data);

        // 5. 显示成功提示
        uni.showToast({
          title: "登录成功",
          icon: "success",
        });

        // 6. 延迟跳转
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
  },
};
</script>

<style lang="scss">
page {
  background: #fff;
}

.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx 40rpx;
  box-sizing: border-box;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;

  .logo {
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

.login-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .login-btn {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    background: #ff6b6b;
    color: #fff;
    font-size: 32rpx;
    border-radius: 44rpx;
    margin-bottom: 30rpx;

    &::after {
      border: none;
    }

    &[loading] {
      opacity: 0.8;
      background: #ff6b6b;
      color: #fff;
    }
  }

  .tips {
    font-size: 24rpx;
    color: #999;
  }
}
</style>
