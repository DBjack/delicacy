<template>
  <view class="container">
    <view class="empty" v-if="!posts.length">
      <image
        class="empty-image"
        src="/static/empty-box.png"
        mode="aspectFit"
      ></image>
      <text class="empty-text">暂无发布内容</text>
    </view>

    <view class="list" v-else>
      <view
        class="item"
        v-for="(item, index) in posts"
        :key="index"
        @tap="goToDetail(item)"
      >
        <image class="cover" :src="item.cover" mode="aspectFill"></image>
        <view class="content">
          <text class="title">{{ item.title }}</text>
          <view class="info">
            <view class="stats">
              <view class="stat-item">
                <text class="iconfont icon-eye"></text>
                <text>{{ item.views }}</text>
              </view>
              <view class="stat-item">
                <text class="iconfont icon-heart"></text>
                <text>{{ item.likes }}</text>
              </view>
              <view class="stat-item">
                <text class="iconfont icon-message"></text>
                <text>{{ item.comments }}</text>
              </view>
            </view>
            <text class="time">{{ item.createTime }}</text>
          </view>
        </view>
      </view>
    </view>

    <load-more :status="loadMoreStatus" v-if="posts.length"></load-more>
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
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
    };
  },

  onLoad() {
    this.getPosts();
  },

  onPullDownRefresh() {
    this.page = 1;
    this.posts = [];
    this.getPosts().then(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.loadMoreStatus === "noMore" || this.isLoading) return;
    this.page++;
    this.getPosts();
  },

  methods: {
    async getPosts() {
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
            action: "getUserPosts",
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
          this.posts = result.data;
        } else {
          this.posts = [...this.posts, ...result.data];
        }

        this.loadMoreStatus =
          result.data.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("获取帖子列表失败:", error);
        uni.showToast({
          title: error.message || "获取数据失败",
          icon: "none",
        });
        this.loadMoreStatus = "more";
        this.posts = [];
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
        align-items: center;
        justify-content: space-between;

        .stats {
          display: flex;
          align-items: center;

          .stat-item {
            display: flex;
            align-items: center;
            font-size: 24rpx;
            color: #999;
            margin-right: 20rpx;

            .iconfont {
              font-size: 28rpx;
              margin-right: 4rpx;
            }
          }
        }

        .time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
