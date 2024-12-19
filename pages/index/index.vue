<template>
  <view class="container">
    <!-- 顶部分类 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: currentTab === 'recommend' }"
        @tap="switchTab('recommend')"
      >
        推荐
      </view>
      <view
        class="tab-item"
        :class="{ active: currentTab === 'following' }"
        @tap="switchTab('following')"
      >
        关注
      </view>
    </view>

    <!-- 帖子列表 -->
    <view class="post-list">
      <view
        class="post-item"
        v-for="post in posts"
        :key="post._id"
        @tap="goToDetail(post._id)"
      >
        <view class="author">
          <image
            class="avatar"
            :src="post.author.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <text class="nickname">{{ post.author.nickname }}</text>
          <text class="time">{{ formatTime(post.create_date) }}</text>
        </view>
        <view class="content">
          <text class="title">{{ post.title }}</text>
          <text class="description">{{ post.description }}</text>
          <view class="images" v-if="post.images.length > 0">
            <image
              v-for="(image, index) in post.images.slice(0, 3)"
              :key="index"
              :src="image"
              mode="aspectFill"
              @tap.stop="previewImage(post.images, index)"
            />
          </view>
        </view>
        <view class="actions">
          <view class="action-item" @tap.stop="handleLike(post)">
            <text class="iconfont icon-like"></text>
            <text class="count">{{ post.likeCount || 0 }}</text>
          </view>
          <view class="action-item" @tap.stop="handleCollect(post)">
            <text class="iconfont icon-star"></text>
            <text class="count">{{ post.collectCount || 0 }}</text>
          </view>
          <view class="action-item" @tap.stop="goToDetail(post._id)">
            <text class="iconfont icon-comment"></text>
            <text class="count">{{ post.commentCount || 0 }}</text>
          </view>
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
      currentTab: "recommend", // recommend 或 following
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  methods: {
    switchTab(tab) {
      if (this.currentTab === tab) return;
      this.currentTab = tab;
      this.page = 1;
      this.posts = [];
      this.loadData();
    },

    formatTime(date) {
      if (!date) return "";
      date = new Date(date);
      const now = new Date();
      const diff = now - date;
      const minute = 1000 * 60;
      const hour = minute * 60;
      const day = hour * 24;

      if (diff < minute) {
        return "刚刚";
      } else if (diff < hour) {
        return Math.floor(diff / minute) + "分钟前";
      } else if (diff < day) {
        return Math.floor(diff / hour) + "小时前";
      } else if (diff < day * 30) {
        return Math.floor(diff / day) + "天前";
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },

    handleLike(post) {
      // TODO: 实现点赞功能
      uni.showToast({
        title: "点赞功能开发中",
        icon: "none",
      });
    },

    handleCollect(post) {
      // TODO: 实现收藏功能
      uni.showToast({
        title: "收藏功能开发中",
        icon: "none",
      });
    },

    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: index,
      });
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail?id=${id}`,
      });
    },

    async loadData() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const userInfo = uni.getStorageSync("userInfo");
        const res = await uniCloud.callFunction({
          name: "home",
          data: {
            action:
              this.currentTab === "recommend"
                ? "getRecommendPosts"
                : "getFollowingPosts",
            params: {
              userId: userInfo?._id,
              page: this.page,
              pageSize: this.pageSize,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        const posts = res.result.data;

        if (this.page === 1) {
          this.posts = posts;
        } else {
          this.posts = [...this.posts, ...posts];
        }

        this.loadMoreStatus = posts.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("加载帖子失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
        uni.stopPullDownRefresh();
      }
    },

    refreshData() {
      this.page = 1;
      this.loadData();
    },

    loadMore() {
      if (this.loadMoreStatus === "noMore") return;
      this.page++;
      this.loadData();
    },

    // ... 其他方法保持不变
  },
};
</script>

<style lang="scss">
.container {
  padding-top: 88rpx;
}

.tabs {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 88rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .tab-item {
    padding: 0 40rpx;
    height: 88rpx;
    line-height: 88rpx;
    font-size: 32rpx;
    color: #666;
    position: relative;

    &.active {
      color: #333;
      font-weight: bold;

      &::after {
        content: "";
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        width: 48rpx;
        height: 6rpx;
        background: #ff6b6b;
        border-radius: 3rpx;
      }
    }
  }
}

.post-list {
  padding: 20rpx;

  .post-item {
    background: #fff;
    border-radius: 12rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;

    .author {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;

      .avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        margin-right: 16rpx;
      }

      .nickname {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
        flex: 1;
      }

      .time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .content {
      .title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 12rpx;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 20rpx;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .images {
        display: flex;
        gap: 10rpx;

        image {
          flex: 1;
          height: 200rpx;
          border-radius: 8rpx;
        }
      }
    }

    .actions {
      display: flex;
      margin-top: 20rpx;
      border-top: 1rpx solid #f5f5f5;
      padding-top: 20rpx;

      .action-item {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;

        .iconfont {
          font-size: 36rpx;
          margin-right: 8rpx;
        }

        .count {
          font-size: 24rpx;
        }
      }
    }
  }
}
</style>
