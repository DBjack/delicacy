<template>
  <view class="container">
    <view class="user-list">
      <view
        class="user-item"
        v-for="user in following"
        :key="user._id"
        @tap="goToUser(user._id)"
      >
        <image
          class="avatar"
          :src="user.avatar || defaultAvatar"
          mode="aspectFill"
        />
        <view class="info">
          <text class="nickname">{{ user.nickname }}</text>
          <text class="bio">{{ user.bio || "这个人很懒，什么都没写~" }}</text>
        </view>
        <button class="follow-btn following" @tap.stop="handleUnfollow(user)">
          已关注
        </button>
      </view>
    </view>

    <view class="empty" v-if="!following.length">
      <text>暂无关注</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userId: "",
      following: [],
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad(options) {
    if (options.id) {
      this.userId = options.id;
      this.loadFollowing();
    }
  },

  methods: {
    async loadFollowing() {
      try {
        const userInfo = await this.getUserInfo(this.userId);
        console.log("用户信息:", userInfo);
        if (!userInfo.following || !userInfo.following.length) {
          console.log("没有关注的用户");
          this.following = [];
          return;
        }

        // 获取所有关注用户的信息
        const followingPromises = userInfo.following.map((id) =>
          this.getUserInfo(id)
        );
        this.following = await Promise.all(followingPromises);
        console.log("关注列表:", this.following);
      } catch (error) {
        console.error("加载关注列表失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    },

    async getUserInfo(userId) {
      console.log("获取用户信息:", userId);
      const res = await uniCloud.callFunction({
        name: "user",
        data: {
          action: "getUserInfo",
          params: {
            userId,
          },
        },
      });

      console.log("用户信息返回:", res);
      if (res.result.code === 0) {
        return res.result.data;
      }
      throw new Error(res.result.msg);
    },

    async handleUnfollow(user) {
      try {
        const currentUser = uni.getStorageSync("userInfo");
        if (!currentUser) {
          uni.navigateTo({
            url: "/pages/auth/login",
          });
          return;
        }

        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "unfollow",
            params: {
              userId: currentUser._id,
              followId: user._id,
            },
          },
        });

        if (res.result.code === 0) {
          // 从列表中移除
          this.following = this.following.filter((f) => f._id !== user._id);

          uni.showToast({
            title: "取消关注成功",
            icon: "success",
          });
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("操作失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    goToUser(userId) {
      uni.navigateTo({
        url: `/pages/user/user?id=${userId}`,
      });
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 30rpx;
}

.user-list {
  .user-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #eee;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }

    .info {
      flex: 1;

      .nickname {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 6rpx;
      }

      .bio {
        font-size: 24rpx;
        color: #999;
      }
    }

    .follow-btn {
      width: 120rpx;
      height: 52rpx;
      line-height: 52rpx;
      font-size: 24rpx;
      color: #fff;
      background: #ff6b6b;
      border-radius: 26rpx;
      padding: 0;

      &.following {
        background: #999;
      }

      &::after {
        border: none;
      }
    }
  }
}

.empty {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>
