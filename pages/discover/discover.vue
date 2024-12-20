<template>
  <view class="container">
    <!-- 搜索框 -->
    <view class="search-box">
      <view class="search-bar" @tap="goToSearch">
        <text class="iconfont icon-search"></text>
        <text class="placeholder">搜索美食、食谱、达人</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <swiper class="banner" circular autoplay interval="3000" duration="500">
      <swiper-item
        v-for="(item, index) in banners"
        :key="index"
        @tap="handleBannerClick(item)"
      >
        <image :src="item.image" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 功能导航 -->
    <view class="nav-grid">
      <view
        class="nav-item"
        v-for="(item, index) in navItems"
        :key="index"
        @tap="handleNavClick(item)"
      >
        <image :src="item.icon" mode="aspectFit" />
        <text>{{ item.name }}</text>
      </view>
    </view>

    <!-- 热门标签 -->
    <view class="section">
      <view class="section-header">
        <text class="title">热门标签</text>
        <text class="more" @tap="goToAllTags">查看全部</text>
      </view>
      <scroll-view class="tags-scroll" scroll-x>
        <view class="tags-list">
          <view
            class="tag-item"
            v-for="tag in hotTags"
            :key="tag.id"
            @tap="handleTagClick(tag)"
          >
            <image
              class="tag-bg"
              :src="tag.image || defaultTagImage"
              mode="aspectFill"
            />
            <view class="tag-content">
              <text class="tag-name">#{{ tag.name }}</text>
              <text class="tag-count">{{ tag.count }}篇</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 热门推荐 -->
    <view class="section">
      <view class="section-header">
        <text class="title">热门推荐</text>
        <text class="more" @tap="goToAllHot">更多精彩</text>
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
                <text class="stat">{{ formatNumber(post.likeCount) }} 赞</text>
                <text class="stat"
                  >{{ formatNumber(post.collectCount) }} 收藏</text
                >
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
      banners: [
        { image: "/static/images/banner/banner1.jpg", url: "" },
        { image: "/static/images/banner/banner2.jpg", url: "" },
        { image: "/static/images/banner/banner3.jpg", url: "" },
      ],
      navItems: [
        {
          name: "每日推荐",
          icon: "/static/images/nav/recommend.png",
          type: "recommend",
        },
        { name: "排行榜", icon: "/static/images/nav/rank.png", type: "rank" },
        { name: "食谱", icon: "/static/images/nav/recipe.png", type: "recipe" },
        { name: "达人", icon: "/static/images/nav/expert.png", type: "expert" },
      ],
      hotTags: [],
      hotPosts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      defaultImage: "/static/images/default-food.jpg",
      defaultAvatar: "/static/images/default-avatar.png",
      defaultTagImage: "/static/images/default-tag.jpg",
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

        if (res.result.code === 0) {
          this.hotTags = res.result.data;
        } else {
          throw new Error(res.result.msg);
        }
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

        if (res.result.code === 0) {
          const posts = res.result.data;
          if (this.page === 1) {
            this.hotPosts = posts;
          } else {
            this.hotPosts = [...this.hotPosts, ...posts];
          }
          this.loadMoreStatus =
            posts.length < this.pageSize ? "noMore" : "more";
        } else {
          throw new Error(res.result.msg);
        }
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

    handleBannerClick(banner) {
      if (banner.url) {
        uni.navigateTo({
          url: banner.url,
        });
      }
    },

    handleNavClick(item) {
      switch (item.type) {
        case "recommend":
          uni.navigateTo({ url: "/pages/recommend/index" });
          break;
        case "rank":
          uni.navigateTo({ url: "/pages/rank/index" });
          break;
        case "recipe":
          uni.navigateTo({ url: "/pages/recipe/index" });
          break;
        case "expert":
          uni.navigateTo({ url: "/pages/expert/index" });
          break;
      }
    },

    handleTagClick(tag) {
      uni.navigateTo({
        url: `/packagePost/pages/list/list?tag=${encodeURIComponent(tag.name)}`,
      });
    },

    goToSearch() {
      uni.navigateTo({
        url: "/pages/search/index",
      });
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${id}`,
      });
    },

    goToAllTags() {
      uni.navigateTo({
        url: "/pages/tags/index",
      });
    },

    goToAllHot() {
      uni.navigateTo({
        url: "/pages/hot/index",
      });
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
@mixin text-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.container {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 30rpx;
}

.search-box {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 20rpx;
  background: linear-gradient(to bottom, #fff, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .search-bar {
    height: 72rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.98);
      background: #f0f0f0;
    }

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

.banner {
  height: 320rpx;
  margin: 0 20rpx 30rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  transition: transform 0.3s ease;

  &:active {
    transform: translateY(2rpx);
  }

  image {
    width: 100%;
    height: 100%;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.nav-grid {
  display: flex;
  background: #fff;
  padding: 30rpx 20rpx;
  margin: 0 20rpx 30rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s ease;

    &:active {
      transform: scale(0.95);
    }

    image {
      width: 90rpx;
      height: 90rpx;
      margin-bottom: 16rpx;
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-2rpx);
      }
    }

    text {
      font-size: 26rpx;
      color: #333;
      font-weight: 500;
    }
  }
}

.section {
  background: #fff;
  margin: 0 20rpx 30rpx;
  padding: 30rpx 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
      position: relative;
      padding-left: 24rpx;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 32rpx;
        background: linear-gradient(to bottom, #ff6b6b, #ff8787);
        border-radius: 4rpx;
      }
    }

    .more {
      font-size: 26rpx;
      color: #666;
      padding: 6rpx 20rpx;
      background: #f8f8f8;
      border-radius: 24rpx;
      transition: all 0.3s ease;

      &:active {
        transform: scale(0.95);
        background: #f0f0f0;
      }
    }
  }
}

.tags-scroll {
  white-space: nowrap;
  margin: 0 -20rpx;
  padding: 10rpx 20rpx;

  .tags-list {
    display: inline-flex;
    padding: 10rpx 0;

    .tag-item {
      position: relative;
      width: 260rpx;
      height: 140rpx;
      margin-right: 24rpx;
      border-radius: 16rpx;
      overflow: hidden;
      transition: transform 0.3s ease;

      &:active {
        transform: scale(0.98);
      }

      &:last-child {
        margin-right: 0;
      }

      .tag-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        z-index: 1;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.1);
        }
      }

      .tag-content {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.2),
          rgba(0, 0, 0, 0.5)
        );
        backdrop-filter: blur(2px);

        .tag-name {
          font-size: 30rpx;
          color: #fff;
          font-weight: 600;
          margin-bottom: 8rpx;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
        }

        .tag-count {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.2);
          padding: 4rpx 16rpx;
          border-radius: 20rpx;
        }
      }
    }
  }
}

.post-list {
  .post-item {
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease;

    &:active {
      transform: translateY(2rpx);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .cover {
      width: 100%;
      height: 380rpx;
      transition: transform 0.3s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .info {
      padding: 24rpx;

      .title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 12rpx;
        @include text-ellipsis;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
        margin-bottom: 24rpx;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16rpx;
        border-top: 2rpx solid #f5f5f5;

        .author {
          display: flex;
          align-items: center;

          .avatar {
            width: 56rpx;
            height: 56rpx;
            border-radius: 50%;
            margin-right: 12rpx;
            border: 2rpx solid #fff;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
          }

          .nickname {
            font-size: 26rpx;
            color: #666;
            font-weight: 500;
          }
        }

        .stats {
          display: flex;
          align-items: center;

          .stat {
            font-size: 24rpx;
            color: #999;
            margin-left: 24rpx;
            display: flex;
            align-items: center;

            &:first-child {
              margin-left: 0;
            }

            &::before {
              content: "•";
              margin-right: 24rpx;
              color: #ddd;
            }

            &:first-child::before {
              display: none;
            }
          }
        }
      }
    }
  }
}
</style>
