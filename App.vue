<script>
export default {
  onLaunch: function () {
    console.log("App Launch");

    // 初始化云空间
    if (uni.getSystemInfoSync().platform !== "devtools") {
      uniCloud.init({
        provider: "aliyun",
        spaceId: "mp-3a16626b-b090-4f47-89ae-7c1ca7530d1e",
        clientSecret: "s8DmEaWFnpPY+4X3a2wlyA==",
      });
    }
  },

  methods: {
    async checkLogin() {
      try {
        const token = uni.getStorageSync("token");
        const userInfo = uni.getStorageSync("userInfo");
        return !!(token && userInfo);
      } catch (error) {
        console.error("检查登录状态失败:", error);
        return false;
      }
    },

    async login() {
      try {
        // 获取微信登录code
        const loginResult = await new Promise((resolve, reject) => {
          uni.login({
            provider: "weixin",
            success: (res) => resolve(res),
            fail: (err) => reject(err),
          });
        });

        if (!loginResult.code) {
          throw new Error("获取微信登录凭证失败");
        }

        // 调用云函数登录
        const loginRes = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "login",
            params: {
              code: loginResult.code,
            },
          },
        });

        if (loginRes.result.code !== 0) {
          throw new Error(loginRes.result.msg || "登录失败");
        }

        // 保存登录状态
        const { data } = loginRes.result;
        if (!data) {
          throw new Error("未获取到���户数据");
        }
        uni.setStorageSync("token", data._id);
        uni.setStorageSync("userInfo", data);

        return true;
      } catch (error) {
        console.error("登录失败:", error);
        uni.showToast({
          title: "登录失败，请重试",
          icon: "none",
          duration: 2000,
        });
        return false;
      }
    },
  },

  onShow: function () {
    console.log("App Show");
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style lang="scss">
@import "./static/fonts/iconfont.css";
@import "./styles/mixins.scss";

/* 全局样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica,
    Segoe UI, Arial, Roboto, "PingFang SC", "miui", "Hiragino Sans GB",
    "Microsoft Yahei", sans-serif;
}

/* 去除按钮认边框 */
button::after {
  border: none;
}

/* 统一图片默认样式 */
image {
  will-change: transform;
}

/* 统一列表样式 */
.list-item {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

/* 统一卡片样式 */
.card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

/* 文本单行省略 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 文本多行省略 */
.text-ellipsis-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 主题色文本 */
.text-primary {
  color: #ff6b6b;
}

/* 次要文本 */
.text-secondary {
  color: #666;
}

/* 描述文本 */
.text-desc {
  color: #999;
  font-size: 24rpx;
}

/* 分割线 */
.divider {
  height: 1rpx;
  background: #eee;
  margin: 20rpx 0;
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

/* flex布局工具 */
.flex {
  display: flex;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.justify-between {
  justify-content: space-between;
}

.justify-center {
  justify-content: center;
}

.align-center {
  align-items: center;
}
</style>
