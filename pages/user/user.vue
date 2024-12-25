<template>
  <view class="container">
    <view class="user-header">
      <view class="bg-wrap">
        <image
          class="bg-image"
          src="https://img.icons8.com/color/512/food-background.png"
          mode="aspectFill"
        />
        <view class="bg-mask"></view>
      </view>

      <view class="user-info">
        <view
          class="avatar-wrap"
          @tap="isLogin ? goToEditProfile() : goToLogin()"
        >
          <image
            class="avatar"
            :src="
              userInfo.avatar || 'https://img.icons8.com/color/512/user.png'
            "
            mode="aspectFill"
          />
          <view class="edit-badge" v-if="isLogin">
            <text class="iconfont icon-edit"></text>
          </view>
        </view>

        <view class="info-content" v-if="isLogin">
          <text class="nickname">{{ userInfo.nickname || "美食家" }}</text>
          <text class="signature">{{
            userInfo.bio || "这个人很懒，什么都没写~"
          }}</text>
        </view>
        <text v-else class="login-btn" @tap="goToLogin">点击登录</text>
      </view>

      <view class="user-stats">
        <view class="stat-item" @tap="goToFollowing">
          <text class="count">{{ userInfo.followingCount || 0 }}</text>
          <text class="label">关注</text>
        </view>
        <view class="stat-item" @tap="goToFollowers">
          <text class="count">{{ userInfo.followerCount || 0 }}</text>
          <text class="label">粉丝</text>
        </view>
        <view class="stat-item" @tap="goToLikes">
          <text class="count">{{ userInfo.likeCount || 0 }}</text>
          <text class="label">获赞</text>
        </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @tap="goToPosts">
        <view class="left">
          <text class="iconfont icon-list"></text>
          <text>我的帖子</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="goToCollections">
        <view class="left">
          <text class="iconfont icon-star"></text>
          <text>我的收藏</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="goToDrafts">
        <view class="left">
          <text class="iconfont icon-file"></text>
          <text>草稿箱</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @tap="goToSettings">
        <view class="left">
          <text class="iconfont icon-setting"></text>
          <text>设置</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="contactUs">
        <view class="left">
          <text class="iconfont icon-message"></text>
          <text>联系我们</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>

      <view class="menu-item" @tap="goToAbout">
        <view class="left">
          <text class="iconfont icon-info"></text>
          <text>关于我们</text>
        </view>
        <text class="iconfont icon-right"></text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      userInfo: {},
      isLogin: false,
    };
  },

  onShow() {
    this.checkLoginStatus();
  },

  methods: {
    checkLoginStatus() {
      const userInfo = uni.getStorageSync("userInfo");
      this.isLogin = !!userInfo;
      if (userInfo) {
        this.userInfo = userInfo;
      }
    },

    goToLogin() {
      uni.navigateTo({
        url: "/pages/auth/login",
      });
    },

    goToEditProfile() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/edit-profile/edit-profile",
      });
    },

    goToFollowing() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/following/following",
      });
    },

    goToFollowers() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/followers/followers",
      });
    },

    goToPosts() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/posts/posts",
      });
    },

    goToLikes() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/likes/likes",
      });
    },

    goToCollections() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/collections/collections",
      });
    },

    goToDrafts() {
      if (!this.isLogin) {
        this.goToLogin();
        return;
      }
      uni.navigateTo({
        url: "/packageUser/pages/drafts/drafts",
      });
    },

    goToSettings() {
      uni.navigateTo({
        url: "/packageUser/pages/settings/settings",
      });
    },

    contactUs() {
      uni.showModal({
        title: "联系我们",
        content: "如有问题请发送邮件至：support@example.com",
        showCancel: false,
      });
    },

    goToAbout() {
      uni.navigateTo({
        url: "/packageUser/pages/about/about",
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
      text-align: center;

      .count {
        font-size: 32rpx;
        color: #333;
        font-weight: 600;
        margin-bottom: 4rpx;
        display: block;
      }

      .label {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
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

    .iconfont {
      font-size: 40rpx;
      color: #666;
      margin-right: 20rpx;

      &.icon-arrow-right {
        margin-right: 0;
        margin-left: auto;
        font-size: 32rpx;
        color: #999;
      }
    }

    .title {
      font-size: 30rpx;
      color: #333;
    }
  }
}

.edit-btn {
  .iconfont {
    font-size: 24rpx;
    color: #fff;
  }
}

.menu-item {
  .left {
    .iconfont {
      font-size: 32rpx;
      color: #666;
      margin-right: 20rpx;
    }
  }

  .iconfont.icon-right {
    font-size: 24rpx;
    color: #999;
  }
}
</style>
