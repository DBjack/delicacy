<template>
  <view class="container">
    <!-- 分类菜单 -->
    <scroll-view scroll-x class="category-scroll">
      <view class="category-list">
        <view
          class="category-item"
          v-for="(item, index) in categories"
          :key="index"
          :class="{ active: currentCategory === item.id }"
          @tap="changeCategory(item.id)"
        >
          <text class="category-name">{{ item.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 美食列表 -->
    <scroll-view
      scroll-y
      class="content-scroll"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="food-grid">
        <view
          class="food-item"
          v-for="item in foodList"
          :key="item._id"
          @tap="goToDetail(item._id)"
        >
          <image
            class="food-image"
            :src="item.cover || defaultImage"
            mode="aspectFill"
          />
          <view class="food-info">
            <text class="food-name">{{ item.title }}</text>
            <view class="food-meta">
              <view class="author">
                <image
                  class="avatar"
                  :src="item.author.avatar || defaultAvatar"
                  mode="aspectFill"
                />
                <text class="nickname">{{ item.author.nickname }}</text>
              </view>
              <view class="stats">
                <text class="likes">{{ formatNumber(item.likeCount) }} 赞</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <uni-load-more :status="loadMoreStatus"></uni-load-more>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      categories: [
        { id: "all", name: "全部" },
        { id: "hot", name: "热门" },
        { id: "new", name: "最新" },
        { id: "chinese", name: "中餐" },
        { id: "western", name: "西餐" },
        { id: "japanese", name: "日料" },
        { id: "korean", name: "韩餐" },
        { id: "dessert", name: "甜点" },
        { id: "drink", name: "饮品" },
      ],
      currentCategory: "all",
      foodList: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isRefreshing: false,
      isLoading: false,
      defaultImage: "/static/images/default-food.jpg",
      defaultAvatar: "/static/images/default-avatar.png",
    };
  },

  onLoad() {
    this.loadFoodList();
  },

  methods: {
    async loadFoodList() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "posts",
          data: {
            action: "getPosts",
            params: {
              category: this.currentCategory,
              page: this.page,
              pageSize: this.pageSize,
            },
          },
        });

        if (res.result.code === 0) {
          const posts = res.result.data;
          if (this.page === 1) {
            this.foodList = posts;
          } else {
            this.foodList = [...this.foodList, ...posts];
          }
          this.loadMoreStatus =
            posts.length < this.pageSize ? "noMore" : "more";
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("获取美食列表失败:", error);
        uni.showToast({
          title: "获取美食列表失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
        if (this.isRefreshing) {
          this.isRefreshing = false;
          uni.stopPullDownRefresh();
        }
      }
    },

    changeCategory(categoryId) {
      if (this.currentCategory === categoryId) return;
      this.currentCategory = categoryId;
      this.page = 1;
      this.loadFoodList();
    },

    onRefresh() {
      this.page = 1;
      this.isRefreshing = true;
      this.loadFoodList();
    },

    loadMore() {
      if (this.loadMoreStatus === "noMore" || this.isLoading) return;
      this.page++;
      this.loadFoodList();
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${id}`,
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
}

.category-scroll {
  background: #fff;
  padding: 20rpx 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);

  .category-list {
    display: flex;
    padding: 0 20rpx;
    white-space: nowrap;

    .category-item {
      padding: 12rpx 32rpx;
      margin-right: 20rpx;
      background: #f5f5f5;
      border-radius: 32rpx;
      transition: all 0.3s ease;

      &.active {
        background: #ff6b6b;
        .category-name {
          color: #fff;
        }
      }

      &:active {
        transform: scale(0.95);
      }

      .category-name {
        font-size: 28rpx;
        color: #666;
        font-weight: 500;
      }
    }
  }
}

.content-scroll {
  height: calc(100vh - 112rpx);
  padding: 20rpx;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;

  .food-item {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease;

    &:active {
      transform: translateY(2rpx);
    }

    .food-image {
      width: 100%;
      height: 320rpx;
    }

    .food-info {
      padding: 16rpx;

      .food-name {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 12rpx;
        @include text-ellipsis;
      }

      .food-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .author {
          display: flex;
          align-items: center;
          flex: 1;

          .avatar {
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            margin-right: 8rpx;
          }

          .nickname {
            font-size: 24rpx;
            color: #666;
            @include text-ellipsis;
            max-width: 120rpx;
          }
        }

        .stats {
          .likes {
            font-size: 24rpx;
            color: #999;
          }
        }
      }
    }
  }
}
</style>
