<template>
  <view class="container">
    <view class="header">
      <text class="title">{{ tag ? `#${tag}` : "帖子列表" }}</text>
    </view>

    <view class="post-list">
      <view
        class="post-item"
        v-for="post in posts"
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
              <text class="nickname">{{ post.author.nickname }}</text>
            </view>
            <view class="stats">
              <text class="stat">{{ post.likeCount || 0 }} 赞</text>
              <text class="stat">{{ post.collectCount || 0 }} 收藏</text>
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
      tag: "",
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      defaultImage: "/static/images/default-food.jpg",
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad(options) {
    if (options.tag) {
      this.tag = decodeURIComponent(options.tag);
    }
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
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "getPostsByTag",
            params: {
              tag: this.tag,
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
          this.posts = posts;
        } else {
          this.posts = [...this.posts, ...posts];
        }

        this.loadMoreStatus = posts.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("加载帖子失败:", error);
        uni.showToast({
          title: "加载失败",
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
      this.loadData();
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
.container {
  padding: 20rpx;
}

.header {
  margin-bottom: 30rpx;

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
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
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
