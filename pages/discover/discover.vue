<template>
  <view class="container">
    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-bar" @tap="goToSearch">
        <text class="iconfont icon-search"></text>
        <text class="placeholder">搜索美食</text>
      </view>
    </view>

    <!-- 热门标签 -->
    <view class="section">
      <view class="section-header">
        <text class="title">热门标签</text>
      </view>
      <view class="tags-list">
        <view
          class="tag-item"
          v-for="tag in hotTags"
          :key="tag.id"
          @tap="handleTagClick(tag)"
        >
          <text class="tag-name">#{{ tag.name }}</text>
          <text class="tag-count">{{ tag.count }}篇</text>
        </view>
      </view>
    </view>

    <!-- 热门推荐 -->
    <view class="section">
      <view class="section-header">
        <text class="title">热门推荐</text>
      </view>
      <view class="post-list">
        <view
          class="post-item"
          v-for="post in hotPosts"
          :key="post._id"
          @tap="goToDetail(post._id)"
        >
          <image
            class="cover"
            :src="post.images[0] || defaultImage"
            mode="aspectFill"
          />
          <view class="info">
            <text class="title">{{ post.title }}</text>
            <text class="description">{{ post.description }}</text>
            <view class="meta">
              <view class="author">
                <image
                  class="avatar"
                  :src="post.author.avatar || defaultAvatar"
                  mode="aspectFill"
                />
                <text class="nickname">{{
                  post.author.nickname || "美食家"
                }}</text>
              </view>
              <view class="stats">
                <text class="stat">{{ post.likeCount || 0 }} 赞</text>
                <text class="stat">{{ post.collectCount || 0 }} 收藏</text>
              </view>
            </view>
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
      hotTags: [],
      hotPosts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      defaultImage: "/static/images/default-food.jpg",
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
    async loadData() {
      await Promise.all([this.loadHotTags(), this.loadHotPosts()]);
    },

    async loadHotTags() {
      try {
        const res = await uniCloud.callFunction({
          name: "discover",
          data: {
            action: "getHotTags",
            params: {},
          },
        });

        console.log("获取热门标签结果:", res);

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        this.hotTags = res.result.data;
      } catch (error) {
        console.error("获取热门标签失败:", error);
        uni.showToast({
          title: "获取热门标签失败",
          icon: "none",
        });
      }
    },

    async loadHotPosts() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "discover",
          data: {
            action: "getHotPosts",
            params: {
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
          this.hotPosts = posts;
        } else {
          this.hotPosts = [...this.hotPosts, ...posts];
        }

        this.loadMoreStatus = posts.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("获取热门帖子失败:", error);
        uni.showToast({
          title: "获取热门帖子失败",
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
      this.loadHotPosts();
    },

    handleTagClick(tag) {
      uni.navigateTo({
        url: `/packagePost/pages/list?tag=${encodeURIComponent(tag.name)}`,
      });
    },

    goToSearch() {
      uni.navigateTo({
        url: "/pages/search/index",
      });
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/pages/post/detail?id=${id}`,
      });
    },
  },
};
</script>

<style lang="scss">
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.container {
  padding: 20rpx;
}

.search-box {
  padding: 20rpx 0;

  .search-bar {
    height: 72rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;

    .iconfont {
      font-size: 32rpx;
      color: #999;
      margin-right: 10rpx;
    }

    .placeholder {
      font-size: 28rpx;
      color: #999;
    }
  }
}

.section {
  margin-bottom: 30rpx;

  .section-header {
    margin-bottom: 20rpx;

    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;

  .tag-item {
    margin: 10rpx;
    padding: 16rpx 24rpx;
    background: #f8f8f8;
    border-radius: 30rpx;
    display: flex;
    align-items: center;

    .tag-name {
      font-size: 26rpx;
      color: #333;
      margin-right: 10rpx;
    }

    .tag-count {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.post-list {
  .post-item {
    background: #fff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow: hidden;

    .cover {
      width: 100%;
      height: 360rpx;
    }

    .info {
      padding: 20rpx;

      .title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 10rpx;
        @include text-ellipsis;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 20rpx;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .author {
          display: flex;
          align-items: center;

          .avatar {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
            margin-right: 10rpx;
          }

          .nickname {
            font-size: 26rpx;
            color: #666;
          }
        }

        .stats {
          display: flex;
          align-items: center;

          .stat {
            font-size: 24rpx;
            color: #999;
            margin-left: 20rpx;

            &:first-child {
              margin-left: 0;
            }
          }
        }
      }
    }
  }
}
</style>
