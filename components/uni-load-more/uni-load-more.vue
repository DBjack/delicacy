<template>
  <view class="uni-load-more">
    <!-- loading 状态 -->
    <view v-if="status === 'loading'" class="uni-load-more__loading">
      <view class="loading-icon"></view>
      <text class="loading-text">{{ loadingText }}</text>
    </view>

    <!-- 没有更多数据 -->
    <view v-if="status === 'noMore'" class="uni-load-more__no-more">
      <text class="no-more-line"></text>
      <text class="no-more-text">{{ noMoreText }}</text>
      <text class="no-more-line"></text>
    </view>
  </view>
</template>

<script>
export default {
  name: "UniLoadMore",
  props: {
    status: {
      // 加载状态
      // more: 加载前
      // loading: 加载中
      // noMore: 没有更多数据
      type: String,
      default: "more",
    },
    loadingText: {
      type: String,
      default: "加载中...",
    },
    noMoreText: {
      type: String,
      default: "没有更多了",
    },
  },
};
</script>

<style lang="scss">
.uni-load-more {
  display: flex;
  flex-direction: row;
  height: 80rpx;
  align-items: center;
  justify-content: center;

  &__loading {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    .loading-icon {
      width: 28rpx;
      height: 28rpx;
      margin-right: 12rpx;
      border: 2rpx solid #999;
      border-radius: 50%;
      border-color: #999 #999 #999 transparent;
      animation: loading 1s linear infinite;
    }

    .loading-text {
      font-size: 28rpx;
      color: #999;
    }
  }

  &__no-more {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 30rpx;

    .no-more-line {
      flex: 1;
      height: 1rpx;
      background: #e5e5e5;
    }

    .no-more-text {
      padding: 0 20rpx;
      font-size: 24rpx;
      color: #999;
    }
  }
}

@keyframes loading {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
