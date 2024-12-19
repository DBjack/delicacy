<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image
          class="avatar"
          :src="userInfo.avatar || defaultAvatar"
          mode="aspectFill"
        />
        <view class="info">
          <text class="nickname">{{ userInfo.nickname || "未设置昵称" }}</text>
          <text class="bio">{{
            userInfo.bio || "这个人很懒，什么都没写~"
          }}</text>
        </view>
      </view>
      <view class="stats">
        <view class="stat-item" @tap="goToFollowers">
          <text class="count">{{ userInfo.followersCount || 0 }}</text>
          <text class="label">粉丝</text>
        </view>
        <view class="stat-item" @tap="goToFollowing">
          <text class="count">{{ userInfo.followingCount || 0 }}</text>
          <text class="label">关注</text>
        </view>
        <view class="stat-item">
          <text class="count">{{ userInfo.worksCount || 0 }}</text>
          <text class="label">作品</text>
        </view>
      </view>
      <button
        class="follow-btn"
        :class="{ following: isFollowing }"
        @tap="handleFollow"
        v-if="!isSelf"
      >
        {{ isFollowing ? "已关注" : "关注" }}
      </button>
    </view>

    <!-- 用户作品列表 -->
    <view class="post-list">
      <view
        class="post-item"
        v-for="post in posts"
        :key="post._id"
        @tap="goToDetail(post._id)"
      >
        <image
          class="cover"
          :src="post.images[0] || defaultImage"
          mode="aspectFill"
        />
        <text class="title">{{ post.title }}</text>
        <view class="stats">
          <text class="stat">{{ post.likeCount || 0 }} 赞</text>
          <text class="stat">{{ post.collectCount || 0 }} 收藏</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <uni-load-more :status="loadMoreStatus"></uni-load-more>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userId: "",
      userInfo: {},
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      isFollowing: false,
      isSelf: false,
      defaultAvatar: "/static/images/default-avatar.jpg",
      defaultImage: "/static/images/default-food.jpg",
    };
  },

  onLoad(options) {
    if (options.id) {
      this.userId = options.id;
      this.checkIsSelf();
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  methods: {
    checkIsSelf() {
      const currentUser = uni.getStorageSync("userInfo");
      this.isSelf = currentUser && currentUser._id === this.userId;
    },

    async loadData() {
      await Promise.all([
        this.loadUserInfo(),
        this.loadPosts(),
        this.checkFollowStatus(),
      ]);
    },

    async loadUserInfo() {
      try {
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "getUserInfo",
            params: {
              userId: this.userId,
            },
          },
        });

        if (res.result.code === 0) {
          this.userInfo = res.result.data;
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        uni.showToast({
          title: "获取用户信息失败",
          icon: "none",
        });
      }
    },

    async loadPosts() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "getUserPosts",
            params: {
              userId: this.userId,
              page: this.page,
              pageSize: this.pageSize,
            },
          },
        });

        if (res.result.code === 0) {
          const posts = res.result.data;
          if (this.page === 1) {
            this.posts = posts;
          } else {
            this.posts = [...this.posts, ...posts];
          }
          this.loadMoreStatus =
            posts.length < this.pageSize ? "noMore" : "more";
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("加载作品列表失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
        uni.stopPullDownRefresh();
      }
    },

    async checkFollowStatus() {
      if (this.isSelf) return;

      try {
        const currentUser = uni.getStorageSync("userInfo");
        if (!currentUser) return;

        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "checkFollowStatus",
            params: {
              followerId: currentUser._id,
              followingId: this.userId,
            },
          },
        });

        if (res.result.code === 0) {
          this.isFollowing = res.result.data;
        }
      } catch (error) {
        console.error("检查关注状态失败:", error);
      }
    },

    async handleFollow() {
      const currentUser = uni.getStorageSync("userInfo");
      if (!currentUser) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return;
      }

      try {
        const action = this.isFollowing ? "unfollow" : "follow";
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action,
            params: {
              followerId: currentUser._id,
              followingId: this.userId,
            },
          },
        });

        if (res.result.code === 0) {
          this.isFollowing = !this.isFollowing;
          // 更新粉丝数
          this.userInfo.followersCount += this.isFollowing ? 1 : -1;
          uni.showToast({
            title: this.isFollowing ? "关注成功" : "取消关注成功",
            icon: "success",
          });
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("关注操作失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    refreshData() {
      this.page = 1;
      this.loadData();
    },

    loadMore() {
      if (this.loadMoreStatus === "noMore") return;
      this.page++;
      this.loadPosts();
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail?id=${id}`,
      });
    },

    goToFollowers() {
      uni.navigateTo({
        url: `/pages/user/followers?id=${this.userId}`,
      });
    },

    goToFollowing() {
      uni.navigateTo({
        url: `/pages/user/following?id=${this.userId}`,
      });
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
}

.user-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }

    .info {
      flex: 1;

      .nickname {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        display: block;
      }

      .bio {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30rpx;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .count {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 6rpx;
      }

      .label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .follow-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: #ff6b6b;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;

    &.following {
      background: #999;
    }

    &::after {
      border: none;
    }
  }
}

.post-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;

  .post-item {
    width: calc(50% - 20rpx);
    margin: 10rpx;
    background: #fff;
    border-radius: 8rpx;
    overflow: hidden;

    .cover {
      width: 100%;
      height: 300rpx;
    }

    .title {
      font-size: 28rpx;
      padding: 16rpx;
      display: block;
    }

    .stats {
      padding: 0 16rpx 16rpx;
      display: flex;

      .stat {
        font-size: 24rpx;
        color: #999;
        margin-right: 20rpx;

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
}
</style>
