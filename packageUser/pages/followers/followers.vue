<template>
  <view class="container">
    <view class="empty" v-if="!followers.length">
      <image
        class="empty-image"
        src="https://img.icons8.com/pastel-glyph/512/empty-box.png"
        mode="aspectFit"
      ></image>
      <text class="empty-text">暂无粉丝</text>
    </view>

    <view class="list" v-else>
      <view class="item" v-for="(item, index) in followers" :key="index">
        <view class="user-info" @tap="goToUserProfile(item)">
          <image class="avatar" :src="item.avatar" mode="aspectFill"></image>
          <view class="info">
            <text class="nickname">{{ item.nickname }}</text>
            <text class="bio">{{ item.bio || "这个人很懒，什么都没写~" }}</text>
          </view>
        </view>
        <button
          class="follow-btn"
          :class="{ following: item.isFollowing }"
          @tap="handleFollow(item, index)"
        >
          {{ item.isFollowing ? "已关注" : "关注" }}
        </button>
      </view>
    </view>

    <load-more :status="loadMoreStatus" v-if="followers.length"></load-more>
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
      followers: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
    };
  },

  onLoad() {
    this.getFollowers();
  },

  onPullDownRefresh() {
    this.page = 1;
    this.followers = [];
    this.getFollowers().then(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.loadMoreStatus === "noMore" || this.isLoading) return;
    this.page++;
    this.getFollowers();
  },

  methods: {
    async getFollowers() {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        this.loadMoreStatus = "loading";

        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const { result } = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "getFollowers",
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
          this.followers = result.data;
        } else {
          this.followers = [...this.followers, ...result.data];
        }

        this.loadMoreStatus =
          result.data.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("获��粉丝列表失败:", error);
        uni.showToast({
          title: error.message || "获取数据失败",
          icon: "none",
        });
        this.loadMoreStatus = "more";
        this.followers = [];
      } finally {
        this.isLoading = false;
      }
    },

    goToUserProfile(user) {
      uni.navigateTo({
        url: `/pages/user/user?id=${user._id}`,
      });
    },

    async handleFollow(user, index) {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const action = user.isFollowing ? "unfollow" : "follow";
        await uniCloud.callFunction({
          name: "user",
          data: {
            action,
            params: {
              followerId: userInfo._id,
              followingId: user._id,
            },
          },
        });

        // 更新本地状态
        this.$set(this.followers[index], "isFollowing", !user.isFollowing);

        uni.showToast({
          title: user.isFollowing ? "已取消关注" : "关注成功",
          icon: "success",
        });
      } catch (error) {
        console.error("操作失败:", error);
        uni.showToast({
          title: error.message || "操作失败",
          icon: "none",
        });
      }
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
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border-radius: 12rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;

    .user-info {
      flex: 1;
      display: flex;
      align-items: center;
      margin-right: 20rpx;

      .avatar {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }

      .info {
        flex: 1;

        .nickname {
          font-size: 32rpx;
          color: #333;
          margin-bottom: 8rpx;
          display: block;
        }

        .bio {
          font-size: 26rpx;
          color: #999;
          display: block;
        }
      }
    }

    .follow-btn {
      min-width: 140rpx;
      height: 56rpx;
      line-height: 56rpx;
      font-size: 26rpx;
      margin: 0;
      padding: 0;
      background: #ff6b6b;
      color: #fff;
      border-radius: 28rpx;

      &.following {
        background: #f5f5f5;
        color: #999;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}
</style>
