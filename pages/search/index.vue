<template>
  <view class="container">
    <view class="search-box">
      <text class="iconfont icon-search"></text>
      <input
        class="search-input"
        type="text"
        v-model="keyword"
        placeholder="搜索美食、食谱、达人"
        confirm-type="search"
        @confirm="handleSearch"
      />
      <text
        v-if="keyword"
        class="iconfont icon-close"
        @click="clearKeyword"
      ></text>
    </view>

    <view class="history" v-if="!keyword && searchHistory.length">
      <view class="header">
        <text class="title">
          <text class="iconfont icon-clock"></text>
          搜索历史
        </text>
        <text class="clear" @tap="clearHistory">
          <text class="iconfont icon-delete"></text>
          清除
        </text>
      </view>
      <view class="history-list">
        <view
          class="history-item"
          v-for="(item, index) in searchHistory"
          :key="index"
          @tap="useHistoryKeyword(item)"
        >
          <text class="iconfont icon-clock"></text>
          <view class="keyword">{{ item }}</view>
          <view class="delete-btn" @tap.stop="deleteHistory(index)">
            <text class="iconfont icon-close"></text>
          </view>
        </view>
      </view>
    </view>

    <view class="hot-section" v-if="!keyword">
      <view class="section-header">
        <text class="title">热门搜索</text>
      </view>
      <view class="hot-list">
        <view
          class="hot-item"
          v-for="(item, index) in hotSearches"
          :key="index"
          @tap="useHistoryKeyword(item)"
        >
          <text class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</text>
          <text class="keyword">{{ item }}</text>
        </view>
      </view>
    </view>

    <scroll-view
      v-if="keyword"
      scroll-y
      class="search-results"
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="result-list" v-if="searchResults.length">
        <view
          class="result-item"
          v-for="item in searchResults"
          :key="item._id"
          @tap="goToDetail(item._id)"
        >
          <image
            class="cover"
            :src="item.cover || defaultImage"
            mode="aspectFill"
          />
          <view class="info">
            <text class="title">{{ item.title }}</text>
            <text class="description">{{ item.description }}</text>
            <view class="meta">
              <view class="author">
                <image
                  class="avatar"
                  :src="item.author.avatar || defaultAvatar"
                  mode="aspectFill"
                />
                <text class="nickname">{{ item.author.nickname }}</text>
              </view>
              <text class="likes">{{ formatNumber(item.likeCount) }} 赞</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else-if="hasSearched" class="empty-result">
        <image
          class="empty-image"
          src="/static/images/empty-search.png"
          mode="aspectFit"
        />
        <text class="empty-text">暂无相关内容</text>
      </view>

      <load-more :status="loadMoreStatus"></load-more>
    </scroll-view>
  </view>
</template>

<script>
import LoadMore from "@/components/load-more/load-more.vue";

const MAX_HISTORY = 10;

export default {
  components: {
    LoadMore,
  },
  data() {
    return {
      keyword: "",
      searchHistory: [],
      hotSearches: [
        "红烧肉",
        "可乐鸡翅",
        "糖醋排骨",
        "水煮鱼",
        "麻婆豆腐",
        "回锅肉",
        "宫保鸡丁",
        "鱼香肉丝",
        "酸菜鱼",
        "辣子鸡",
      ],
      searchResults: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isRefreshing: false,
      isLoading: false,
      hasSearched: false,
      defaultImage: "/static/images/food-default.png",
      defaultAvatar: "/static/images/avatar-default.png",
    };
  },

  onLoad() {
    this.loadSearchHistory();
  },

  methods: {
    loadSearchHistory() {
      const history = uni.getStorageSync("searchHistory");
      if (history) {
        this.searchHistory = JSON.parse(history);
      }
    },

    saveSearchHistory() {
      uni.setStorageSync("searchHistory", JSON.stringify(this.searchHistory));
    },

    addToHistory(keyword) {
      if (!keyword) return;
      const index = this.searchHistory.indexOf(keyword);
      if (index > -1) {
        this.searchHistory.splice(index, 1);
      }
      this.searchHistory.unshift(keyword);
      if (this.searchHistory.length > MAX_HISTORY) {
        this.searchHistory.pop();
      }
      this.saveSearchHistory();
    },

    deleteHistory(index) {
      this.searchHistory.splice(index, 1);
      this.saveSearchHistory();
    },

    clearHistory() {
      uni.showModal({
        title: "提示",
        content: "确定要清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            this.saveSearchHistory();
          }
        },
      });
    },

    useHistoryKeyword(keyword) {
      this.keyword = keyword;
      this.handleSearch();
    },

    clearKeyword() {
      this.keyword = "";
      this.searchResults = [];
      this.hasSearched = false;
    },

    handleInput() {
      if (!this.keyword) {
        this.searchResults = [];
        this.hasSearched = false;
      }
    },

    async handleSearch() {
      if (!this.keyword.trim()) return;
      this.page = 1;
      this.addToHistory(this.keyword.trim());
      await this.searchPosts();
    },

    async searchPosts() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "posts",
          data: {
            action: "searchPosts",
            params: {
              keyword: this.keyword.trim(),
              page: this.page,
              pageSize: this.pageSize,
            },
          },
        });

        if (res.result.code === 0) {
          const posts = res.result.data;
          if (this.page === 1) {
            this.searchResults = posts;
          } else {
            this.searchResults = [...this.searchResults, ...posts];
          }
          this.loadMoreStatus =
            posts.length < this.pageSize ? "noMore" : "more";
          this.hasSearched = true;
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("搜索失败:", error);
        uni.showToast({
          title: "搜索失败",
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

    onRefresh() {
      this.page = 1;
      this.isRefreshing = true;
      this.searchPosts();
    },

    loadMore() {
      if (this.loadMoreStatus === "noMore" || this.isLoading) return;
      this.page++;
      this.searchPosts();
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${id}`,
      });
    },

    goBack() {
      uni.navigateBack();
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
}

.search-box {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;

  .search-input {
    flex: 1;
    height: 100%;
    font-size: 28rpx;
  }

  .icon-clear {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 36rpx;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 20rpx 20rpx;

  .title {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
  }

  .clear-all {
    font-size: 26rpx;
    color: #999;
    padding: 10rpx;
  }
}

.history-list {
  padding: 0 20rpx;

  .history-item {
    display: flex;
    align-items: center;
    height: 88rpx;
    border-bottom: 1rpx solid #f5f5f5;

    .icon-time {
      font-size: 32rpx;
      color: #999;
      margin-right: 12rpx;
    }

    .keyword {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .delete-btn {
      width: 88rpx;
      height: 88rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 36rpx;
    }
  }
}

.hot-list {
  padding: 0 20rpx;

  .hot-item {
    display: flex;
    align-items: center;
    height: 88rpx;
    border-bottom: 1rpx solid #f5f5f5;

    .rank {
      width: 40rpx;
      font-size: 28rpx;
      color: #999;
      text-align: center;

      &.top {
        color: #ff6b6b;
        font-weight: bold;
      }
    }

    .keyword {
      flex: 1;
      font-size: 28rpx;
      color: #333;
      margin-left: 20rpx;
    }
  }
}

.search-results {
  height: calc(100vh - 112rpx);
}

.result-list {
  padding: 20rpx;

  .result-item {
    background: #fff;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .cover {
      width: 100%;
      height: 360rpx;
    }

    .info {
      padding: 20rpx;

      .title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 12rpx;
        display: block;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        line-height: 1.5;
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
            margin-right: 12rpx;
          }

          .nickname {
            font-size: 26rpx;
            color: #666;
          }
        }

        .likes {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
}

.empty-result {
  padding: 120rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-image {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.history {
  .header {
    .title {
      .iconfont {
        font-size: 28rpx;
        margin-right: 8rpx;
      }
    }

    .clear {
      .iconfont {
        font-size: 28rpx;
        margin-right: 8rpx;
      }
    }
  }
}
</style>
