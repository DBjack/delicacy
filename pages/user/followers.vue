<template>
  <view class="container">
    <view class="user-list">
      <view
        class="user-item"
        v-for="user in followers"
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
        <button
          class="follow-btn"
          :class="{ following: user.isFollowing }"
          @tap.stop="handleFollow(user)"
        >
          {{ user.isFollowing ? "已关注" : "关注" }}
        </button>
      </view>
    </view>

    <view class="empty" v-if="!followers.length">
      <text>暂无粉丝</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userId: "",
      followers: [],
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad(options) {
    if (options.id) {
      this.userId = options.id;
      this.loadFollowers();
    }
  },

  methods: {
    async loadFollowers() {
      try {
        const userInfo = await this.getUserInfo(this.userId);
        if (!userInfo.followers || !userInfo.followers.length) {
          this.followers = [];
          return;
        }

        // 获取所有粉丝的用户信息
        const followerPromises = userInfo.followers.map((id) =>
          this.getUserInfo(id)
        );
        const followers = await Promise.all(followerPromises);

        // 检查当前用户是否关注了这些粉丝
        const currentUser = uni.getStorageSync("userInfo");
        if (currentUser) {
          const currentUserInfo = await this.getUserInfo(currentUser._id);
          this.followers = followers.map((user) => ({
            ...user,
            isFollowing: currentUserInfo.following.includes(user._id),
          }));
        } else {
          this.followers = followers;
        }
      } catch (error) {
        console.error("加载粉丝列表失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    },

    async getUserInfo(userId) {
      const res = await uniCloud.callFunction({
        name: "user",
        data: {
          action: "getUserInfo",
          params: {
            userId,
          },
        },
      });

      if (res.result.code === 0) {
        return res.result.data;
      }
      throw new Error(res.result.msg);
    },

    async handleFollow(user) {
      try {
        const currentUser = uni.getStorageSync("userInfo");
        if (!currentUser) {
          uni.navigateTo({
            url: "/pages/auth/login",
          });
          return;
        }

        const action = user.isFollowing ? "unfollow" : "follow";
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action,
            params: {
              userId: currentUser._id,
              followId: user._id,
            },
          },
        });

        if (res.result.code === 0) {
          // 更新本地状态
          const index = this.followers.findIndex((f) => f._id === user._id);
          if (index !== -1) {
            this.followers[index].isFollowing = !user.isFollowing;
          }

          uni.showToast({
            title: user.isFollowing ? "取消关注成功" : "关注成功",
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
