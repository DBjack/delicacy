<template>
  <view class="container">
    <!-- 用户信息区域 -->
    <view class="user-header">
      <view class="bg-wrap">
        <image
          class="bg-image"
          :src="userInfo.bgImage || defaultBg"
          mode="aspectFill"
        />
        <view class="bg-mask"></view>
      </view>
      <view class="user-info">
        <view class="avatar-wrap" @tap="editProfile">
          <image
            class="avatar"
            :src="userInfo.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="edit-badge">
            <text class="iconfont icon-edit"></text>
          </view>
        </view>
        <view class="info-content" v-if="isLogin">
          <text class="nickname">{{ userInfo.nickname || "美食达人" }}</text>
          <text class="signature">{{
            userInfo.signature || "这个人很懒，什么都没写~"
          }}</text>
        </view>
        <view class="login-btn" v-else @tap="goToLogin">
          <text>登录/注册</text>
        </view>
      </view>
      <view class="user-stats">
        <view class="stat-item" @tap="goToMyPosts">
          <text class="count">{{ userStats.postCount || 0 }}</text>
          <text class="label">发布</text>
        </view>
        <view class="stat-item" @tap="goToFollowing">
          <text class="count">{{ userStats.followingCount || 0 }}</text>
          <text class="label">关注</text>
        </view>
        <view class="stat-item" @tap="goToFollowers">
          <text class="count">{{ userStats.followerCount || 0 }}</text>
          <text class="label">粉丝</text>
        </view>
        <view class="stat-item" @tap="goToLikes">
          <text class="count">{{ userStats.likeCount || 0 }}</text>
          <text class="label">获赞</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @tap="goToMyPosts">
          <view class="icon-wrap">
            <text class="iconfont icon-post"></text>
          </view>
          <text class="title">我的发布</text>
          <text class="iconfont icon-arrow"></text>
        </view>
        <view class="menu-item" @tap="goToCollections">
          <view class="icon-wrap">
            <text class="iconfont icon-star"></text>
          </view>
          <text class="title">我的收藏</text>
          <text class="iconfont icon-arrow"></text>
        </view>
        <view class="menu-item" @tap="goToDrafts">
          <view class="icon-wrap">
            <text class="iconfont icon-draft"></text>
          </view>
          <text class="title">草稿箱</text>
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="goToSettings">
          <view class="icon-wrap">
            <text class="iconfont icon-settings"></text>
          </view>
          <text class="title">设置</text>
          <text class="iconfont icon-arrow"></text>
        </view>
        <view class="menu-item" @tap="contactUs">
          <view class="icon-wrap">
            <text class="iconfont icon-service"></text>
          </view>
          <text class="title">联系我们</text>
          <text class="iconfont icon-arrow"></text>
        </view>
        <view class="menu-item" @tap="showAbout">
          <view class="icon-wrap">
            <text class="iconfont icon-about"></text>
          </view>
          <text class="title">关于我们</text>
          <text class="iconfont icon-arrow"></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isLogin: false,
      userInfo: {},
      userStats: {},
      defaultAvatar: "/static/images/avatar-default.png",
      defaultBg: "/static/images/user-bg.jpg",
    };
  },

  onShow() {
    this.checkLogin();
    if (this.isLogin) {
      this.loadUserInfo();
      this.loadUserStats();
    }
  },

  methods: {
    checkLogin() {
      const token = uni.getStorageSync("token");
      this.isLogin = !!token;
    },

    async loadUserInfo() {
      try {
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "getInfo",
          },
        });
        if (res.result.code === 0) {
          this.userInfo = res.result.data;
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      }
    },

    async loadUserStats() {
      try {
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "getStats",
          },
        });
        if (res.result.code === 0) {
          this.userStats = res.result.data;
        }
      } catch (error) {
        console.error("获取用户统计失败:", error);
      }
    },

    editProfile() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/edit-profile",
      });
    },

    goToLogin() {
      uni.navigateTo({
        url: "/pages/auth/login",
      });
    },

    goToMyPosts() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/posts",
      });
    },

    goToFollowing() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/following",
      });
    },

    goToFollowers() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/followers",
      });
    },

    goToLikes() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/likes",
      });
    },

    goToCollections() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/collections",
      });
    },

    goToDrafts() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/pages/user/drafts",
      });
    },

    goToSettings() {
      uni.navigateTo({
        url: "/pages/user/settings",
      });
    },

    contactUs() {
      uni.showModal({
        title: "联系我们",
        content: "如有问题请发送邮件至：support@example.com",
        showCancel: false,
      });
    },

    showAbout() {
      uni.navigateTo({
        url: "/pages/about/index",
      });
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f8f8f8;
}

.user-header {
  position: relative;
  padding-bottom: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;

  .bg-wrap {
    position: relative;
    height: 360rpx;
    overflow: hidden;

    .bg-image {
      width: 100%;
      height: 100%;
    }

    .bg-mask {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 160rpx;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.3)
      );
    }
  }

  .user-info {
    position: relative;
    margin-top: -80rpx;
    padding: 0 30rpx;
    z-index: 1;

    .avatar-wrap {
      position: relative;
      width: 160rpx;
      height: 160rpx;
      margin-bottom: 20rpx;

      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 6rpx solid #fff;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
      }

      .edit-badge {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 48rpx;
        height: 48rpx;
        background: #ff6b6b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4rpx solid #fff;

        .icon-edit {
          color: #fff;
          font-size: 24rpx;
        }
      }
    }

    .info-content {
      .nickname {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
      }

      .signature {
        font-size: 28rpx;
        color: #666;
      }
    }

    .login-btn {
      display: inline-block;
      font-size: 32rpx;
      color: #333;
      font-weight: 500;
      padding: 20rpx 0;
    }
  }

  .user-stats {
    display: flex;
    padding: 30rpx;
    padding-bottom: 0;

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;

      .count {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 8rpx;
      }

      .label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.menu-section {
  .menu-group {
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

      .icon-wrap {
        width: 48rpx;
        height: 48rpx;
        background: #ff6b6b;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;

        .iconfont {
          color: #fff;
          font-size: 28rpx;
        }
      }

      .title {
        flex: 1;
        font-size: 30rpx;
        color: #333;
      }

      .icon-arrow {
        font-size: 28rpx;
        color: #999;
      }
    }
  }
}
</style>
