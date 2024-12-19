<template>
  <view class="container">
    <view class="search-box">
      <view class="search-bar">
        <text class="iconfont icon-search"></text>
        <input
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="搜索美食、用户"
          confirm-type="search"
          @confirm="handleSearch"
          focus
        />
        <text class="clear-btn" @tap="clearKeyword" v-if="keyword">×</text>
      </view>
      <text class="cancel-btn" @tap="goBack">取消</text>
    </view>

    <view class="history" v-if="!keyword && searchHistory.length">
      <view class="header">
        <text class="title">搜索历史</text>
        <text class="clear" @tap="clearHistory">清空</text>
      </view>
      <view class="history-list">
        <view
          class="history-item"
          v-for="(item, index) in searchHistory"
          :key="index"
          @tap="useHistoryKeyword(item)"
        >
          <text class="iconfont icon-time"></text>
          <text class="keyword">{{ item }}</text>
        </view>
      </view>
    </view>

    <view class="result-list" v-if="keyword">
      <view class="empty" v-if="!searchResult.length">
        <text>暂无相关内容</text>
      </view>
      <view
        class="result-item"
        v-for="item in searchResult"
        :key="item._id"
        @tap="goToDetail(item)"
      >
        <image
          class="cover"
          :src="item.images[0]"
          mode="aspectFill"
          v-if="item.images && item.images.length"
        />
        <view class="info">
          <text class="title">{{ item.title }}</text>
          <text class="desc">{{ item.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const MAX_HISTORY = 10;

export default {
  data() {
    return {
      keyword: "",
      searchHistory: [],
      searchResult: [],
    };
  },

  onLoad() {
    this.loadSearchHistory();
  },

  methods: {
    loadSearchHistory() {
      const history = uni.getStorageSync("searchHistory") || [];
      this.searchHistory = history;
    },

    saveSearchHistory() {
      if (!this.keyword) return;

      let history = [...this.searchHistory];
      // 删除已存在的相同关键词
      history = history.filter((item) => item !== this.keyword);
      // 添加到开头
      history.unshift(this.keyword);
      // 限制数量
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }

      this.searchHistory = history;
      uni.setStorageSync("searchHistory", history);
    },

    clearHistory() {
      uni.showModal({
        title: "提示",
        content: "确定要清空搜索历史吗？",
        success: (res) => {
          if (res.confirm) {
            this.searchHistory = [];
            uni.removeStorageSync("searchHistory");
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
      this.searchResult = [];
    },

    async handleSearch() {
      if (!this.keyword.trim()) return;

      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "search",
            params: {
              keyword: this.keyword,
            },
          },
        });

        if (res.result.code === 0) {
          this.searchResult = res.result.data;
          this.saveSearchHistory();
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("搜索失败:", error);
        uni.showToast({
          title: "搜索失败",
          icon: "none",
        });
      }
    },

    goToDetail(item) {
      uni.navigateTo({
        url: `/packagePost/pages/detail?id=${item._id}`,
      });
    },

    goBack() {
      uni.navigateBack();
    },
  },
};
</script>

<style lang="scss">
@import "../../styles/mixins.scss";

.container {
  padding: 20rpx;
}

.search-box {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;

  .search-bar {
    flex: 1;
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    padding: 0 30rpx;
    margin-right: 20rpx;

    .icon-search {
      font-size: 32rpx;
      color: #999;
      margin-right: 10rpx;
    }

    .search-input {
      flex: 1;
      height: 100%;
      font-size: 28rpx;
    }

    .clear-btn {
      font-size: 40rpx;
      color: #999;
      padding: 0 10rpx;
    }
  }

  .cancel-btn {
    font-size: 28rpx;
    color: #666;
  }
}

.history {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .title {
      font-size: 28rpx;
      color: #333;
      font-weight: bold;
    }

    .clear {
      font-size: 24rpx;
      color: #999;
    }
  }

  .history-list {
    .history-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;

      .icon-time {
        font-size: 28rpx;
        color: #999;
        margin-right: 10rpx;
      }

      .keyword {
        font-size: 28rpx;
        color: #333;
      }
    }
  }
}

.result-list {
  .empty {
    text-align: center;
    padding: 60rpx 0;
    color: #999;
    font-size: 28rpx;
  }

  .result-item {
    display: flex;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #eee;

    .cover {
      width: 160rpx;
      height: 160rpx;
      border-radius: 12rpx;
      margin-right: 20rpx;
    }

    .info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .title {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .desc {
        font-size: 26rpx;
        color: #999;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
  }
}
</style>
