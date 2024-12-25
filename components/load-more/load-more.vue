<template>
  <view class="load-more">
    <view v-if="status === 'loading'" class="loading">
      <view class="loading-icon"></view>
      <text class="loading-text">加载中...</text>
    </view>
    <view v-if="status === 'noMore'" class="no-more">
      <text class="no-more-line"></text>
      <text class="no-more-text">没有更多了</text>
      <text class="no-more-line"></text>
    </view>
  </view>
</template>

<script>
export default {
  name: "LoadMore",
  props: {
    status: {
      type: String,
      default: "more",
    },
  },
};
</script>

<style lang="scss">
.load-more {
  display: flex;
  flex-direction: row;
  height: 80rpx;
  align-items: center;
  justify-content: center;

  .loading {
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

  .no-more {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 0 30rpx;
    width: 100%;

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
