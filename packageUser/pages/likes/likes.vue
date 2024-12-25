<template>
  <view class="container">
    <view class="empty" v-if="!likes.length">
      <image
        class="empty-image"
        src="https://img.icons8.com/pastel-glyph/512/empty-box.png"
        mode="aspectFit"
      ></image>
      <text class="empty-text">暂无点赞内容</text>
    </view>

    <view class="list" v-else>
      <view
        class="item"
        v-for="(item, index) in likes"
        :key="index"
        @tap="goToDetail(item)"
      >
        <image class="cover" :src="item.cover" mode="aspectFill"></image>
        <view class="content">
          <text class="title">{{ item.title }}</text>
          <view class="info">
            <view class="author">
              <image
                class="avatar"
                :src="item.author.avatar"
                mode="aspectFill"
              ></image>
              <text class="nickname">{{ item.author.nickname }}</text>
            </view>
            <view class="stats">
              <view class="stat-item">
                <text class="iconfont icon-eye"></text>
                <text>{{ item.viewCount || 0 }}</text>
              </view>
              <view class="stat-item">
                <text class="iconfont icon-heart"></text>
                <text>{{ item.likeCount || 0 }}</text>
              </view>
              <view class="stat-item">
                <text class="iconfont icon-message"></text>
                <text>{{ item.commentCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <load-more :status="loadMoreStatus" v-if="likes.length"></load-more>
  </view>
</template>

<script>
import LoadMore from "@/components/load-more/load-more.vue";

export default {
  components: {
    LoadMore,
  },
  data() {
    return {
      likes: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
    };
  },

  onLoad() {
    this.getLikes();
  },

  onPullDownRefresh() {
    this.page = 1;
    this.likes = [];
    this.getLikes().then(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.loadMoreStatus === "noMore" || this.isLoading) return;
    this.page++;
    this.getLikes();
  },

  methods: {
    async getLikes() {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        this.loadMoreStatus = "loading";

        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const { result } = await uniCloud.callFunction({
          name: "posts",
          data: {
            action: "getLikedPosts",
            params: {
              userId: userInfo._id,
              page: this.page,
              pageSize: this.pageSize,
            },
          },
        });

        if (!result.data) {
          result.data = [];
        }

        if (this.page === 1) {
          this.likes = result.data;
        } else {
          this.likes = [...this.likes, ...result.data];
        }

        this.loadMoreStatus =
          result.data.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("获取点赞列表失败:", error);
        uni.showToast({
          title: error.message || "获取数据失败",
          icon: "none",
        });
        this.loadMoreStatus = "more";
        this.likes = [];
      } finally {
        this.isLoading = false;
      }
    },

    goToDetail(item) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${item._id}`,
      });
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

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;

  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #999;
  }
}

.list {
  .item {
    display: flex;
    background: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;

    .cover {
      width: 200rpx;
      height: 150rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .title {
        font-size: 32rpx;
        color: #333;
        line-height: 1.4;
        margin-bottom: 20rpx;
        // 最多显示两行
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }

      .info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .author {
          display: flex;
          align-items: center;

          .avatar {
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            margin-right: 10rpx;
          }

          .nickname {
            font-size: 24rpx;
            color: #666;
          }
        }

        .stats {
          display: flex;
          align-items: center;

          .stat-item {
            display: flex;
            align-items: center;
            margin-left: 20rpx;

            .iconfont {
              font-size: 28rpx;
              color: #999;
              margin-right: 4rpx;
            }

            text {
              font-size: 24rpx;
              color: #999;
            }
          }
        }
      }
    }

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
