<template>
  <view class="container">
    <view class="post-list">
      <view
        v-for="item in posts"
        :key="item._id"
        class="post-item"
        @tap="goToDetail(item._id)"
      >
        <view class="author">
          <image
            class="avatar"
            :src="
              item.author && item.author.avatar
                ? item.author.avatar
                : '/static/images/default-avatar.png'
            "
            mode="aspectFill"
          />
          <text class="nickname">{{
            item.author && item.author.nickname
              ? item.author.nickname
              : "美食家"
          }}</text>
          <text class="time">{{ formatTime(item.create_date) }}</text>
        </view>
        <view class="content">
          <text class="title">{{ item.title }}</text>
          <text class="description">{{ item.description }}</text>
          <view class="images" v-if="item.images && item.images.length">
            <image
              v-for="(image, index) in item.images"
              :key="index"
              :src="image"
              mode="aspectFill"
              class="image"
              @tap.stop="previewImage(item.images, index)"
            />
          </view>
        </view>
        <view class="footer">
          <view class="stats">
            <view class="stat">
              <text class="count">{{ formatNumber(item.likeCount) }}</text>
              <text class="label">赞</text>
            </view>
            <view class="stat">
              <text class="count">{{ formatNumber(item.commentCount) }}</text>
              <text class="label">评论</text>
            </view>
            <view class="stat">
              <text class="count">{{ formatNumber(item.collectCount) }}</text>
              <text class="label">收藏</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <uni-load-more :status="loadMoreStatus"></uni-load-more>
  </view>
</template>

<script>
export default {
  data() {
    return {
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      tag: "",
    };
  },

  onLoad(options) {
    if (options.tag) {
      this.tag = decodeURIComponent(options.tag);
      uni.setNavigationBarTitle({
        title: `#${this.tag}`,
      });
    }
    this.loadPosts();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  onReachBottom() {
    this.loadMore();
  },

  methods: {
    async loadPosts() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "posts",
          data: {
            action: "getPostsByTag",
            params: {
              tag: this.tag,
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
        console.error("获取帖子列表失败:", error);
        uni.showToast({
          title: "获取帖子列表失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
        uni.stopPullDownRefresh();
      }
    },

    refreshData() {
      this.page = 1;
      this.loadPosts();
    },

    loadMore() {
      if (this.loadMoreStatus === "noMore") return;
      this.page++;
      this.loadPosts();
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${id}`,
      });
    },

    previewImage(images, current) {
      uni.previewImage({
        urls: images,
        current: images[current],
      });
    },

    formatTime(timestamp) {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      // 小于1分钟
      if (diff < 60000) {
        return "刚刚";
      }
      // 小于1小时
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + "分钟前";
      }
      // 小于24小时
      if (diff < 86400000) {
        return Math.floor(diff / 3600000) + "小时前";
      }
      // 小于30天
      if (diff < 2592000000) {
        return Math.floor(diff / 86400000) + "天前";
      }
      // 显示具体日期
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    },

    formatNumber(num) {
      if (!num) return 0;
      if (num < 1000) return num;
      if (num < 10000) return (num / 1000).toFixed(1) + "k";
      return (num / 10000).toFixed(1) + "w";
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f8f8f8;
  padding: 20rpx;
}

.post-list {
  .post-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

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
        color: #333;
        font-weight: bold;
        margin-bottom: 12rpx;
        display: block;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        margin-bottom: 16rpx;
        display: block;
      }

      .images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8rpx;
        margin-bottom: 20rpx;

        .image {
          width: 100%;
          height: 220rpx;
          border-radius: 8rpx;
        }
      }
    }

    .footer {
      border-top: 2rpx solid #f5f5f5;
      padding-top: 20rpx;

      .stats {
        display: flex;
        justify-content: space-around;

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;

          .count {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;
            margin-bottom: 4rpx;
          }

          .label {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
}
</style>
