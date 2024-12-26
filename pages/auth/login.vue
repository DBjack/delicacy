<template>
  <view class="login">
    <view class="header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">美食分享</text>
      <text class="subtitle">分享美食，分享生活</text>
    </view>

    <!-- 登录按钮 -->
    <button
      class="login-btn"
      @tap="handleLogin"
    >
      微信一键登录
    </button>

    <view class="tips">
      <text class="tip-text">登录即表示同意</text>
      <text class="link" @tap="openUserAgreement">《用户协议》</text>
      <text class="tip-text">和</text>
      <text class="link" @tap="openPrivacyPolicy">《隐私政策》</text>
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
    // 处理登录
    async handleLogin() {
      if (this.loading) return;
      
      try {
        this.loading = true;
        console.log("开始登录流程...");

        // 1. 获取用户信息
        const [profileErr, profileRes] = await uni.getUserProfile({
          desc: '用于完善会员资料', // 声明获取用户个人信息后的用途
          lang: 'zh_CN'
        });

        if (profileErr) {
          console.error("获取用户信息失败:", profileErr);
          throw new Error('获取用户信息失败');
        }

        if (!profileRes.userInfo) {
          throw new Error('获取用户信息失败');
        }

        const userInfo = profileRes.userInfo;
        console.log("用户信息:", userInfo);

        // 2. 获取登录凭证
        const [loginErr, loginRes] = await uni.login({
          provider: 'weixin'
        });

        if (loginErr || !loginRes || !loginRes.code) {
          console.error("登录凭证错误:", loginErr, loginRes);
          throw new Error("获取登录凭证失败");
        }

        console.log("登录凭证:", loginRes);

        // 3. 调用云函数登录
        console.log("开始调用登录云函数...");
        try {
          const callRes = await uniCloud.callFunction({
            name: "user",
            data: {
              action: "login",
              params: {
                code: loginRes.code,
                userInfo: userInfo
              },
            },
          });

          console.log("登录云函数返回结果:", callRes);
          const result = callRes.result;

          if (result.code === 0 && result.data) {
            // 4. 保存用户信息
            const app = getApp();
            app.globalData.isLogin = true;
            app.globalData.userInfo = result.data;
            
            uni.setStorageSync("token", result.data.token);
            uni.setStorageSync("userInfo", result.data);

            // 5. 提示成功
            uni.showToast({
              title: "登录成功",
              icon: "success",
            });

            // 6. 返回上一页
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            throw new Error(result.msg || "登录失败");
          }
        } catch (cloudErr) {
          console.error("云函数调用失败:", cloudErr);
          throw new Error("登录失败，请稍后重试");
        }
      } catch (error) {
        console.error("登录失败:", error);
        uni.showToast({
          title: error.message || "登录失败，请重试",
          icon: "none",
          duration: 2000
        });
      } finally {
        this.loading = false;
      }
    },

    // 打开用户协议
    openUserAgreement() {
      uni.showToast({
        title: '用户协议',
        icon: 'none'
      });
    },

    // 打开隐私政策
    openPrivacyPolicy() {
      uni.showToast({
        title: '隐私政策',
        icon: 'none'
      });
    }
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
