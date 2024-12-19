<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image
          class="avatar"
          :src="userInfo.avatar || defaultAvatar"
          mode="aspectFill"
          @tap="goToEditProfile"
        />
        <view class="info">
          <text class="nickname">{{ userInfo.nickname || "未设置昵称" }}</text>
          <text class="bio">{{
            userInfo.bio || "这个人很懒，什么都没写~"
          }}</text>
        </view>
      </view>
      <view class="stats">
        <view class="stat-item">
          <text class="count">{{ userInfo.worksCount || 0 }}</text>
          <text class="label">作品</text>
        </view>
        <view class="stat-item">
          <text class="count">{{ userInfo.totalLikes || 0 }}</text>
          <text class="label">获赞</text>
        </view>
        <view class="stat-item">
          <text class="count">{{ userInfo.totalCollects || 0 }}</text>
          <text class="label">被收藏</text>
        </view>
      </view>
      <view class="tags" v-if="userInfo.tags && userInfo.tags.length">
        <view class="tag" v-for="tag in userInfo.tags" :key="tag">
          {{ getTagLabel(tag) }}
        </view>
      </view>
      <button class="edit-btn" @tap="goToEditProfile">编辑资料</button>
    </view>

    <!-- 我的作品 -->
    <view class="section">
      <view class="section-header">
        <text class="title">我的作品</text>
      </view>
      <view class="post-list" v-if="posts.length > 0">
        <view
          class="post-item"
          v-for="post in posts"
          :key="post._id"
          @tap="goToPostDetail(post)"
        >
          <image
            class="cover"
            :src="post.images[0] || defaultImage"
            mode="aspectFill"
          />
          <text class="title">{{ post.title }}</text>
          <view class="stats">
            <text class="stat">{{ post.likeCount || 0 }} 赞</text>
            <text class="stat">{{ post.collectCount || 0 }} 收藏</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>
        <text>还没有发布作品哦~</text>
        <button class="publish-btn" @tap="goToPublish">去发布</button>
      </view>
    </view>

    <!-- 加载更多 -->
    <uni-load-more :status="loadMoreStatus"></uni-load-more>

    <!-- 菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @tap="goToDrafts">
        <text class="iconfont icon-draft"></text>
        <text>草稿箱</text>
        <text class="iconfont icon-arrow-right"></text>
      </view>
      <!-- ... 其他菜单项 ... -->
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {},
      posts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
      defaultAvatar: "/static/images/default-avatar.png",
      defaultImage: "/static/images/default-food.png",
      tagOptions: [
        { label: "美食达人", value: "foodie" },
        { label: "烘焙爱好者", value: "baker" },
        { label: "健康饮食", value: "healthy" },
        { label: "中餐", value: "chinese" },
        { label: "西餐", value: "western" },
        { label: "日料", value: "japanese" },
        { label: "韩餐", value: "korean" },
        { label: "甜点", value: "dessert" },
        { label: "咖啡", value: "coffee" },
        { label: "茶艺", value: "tea" },
      ],
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
      await Promise.all([this.loadUserInfo(), this.loadPosts()]);
    },

    async loadUserInfo() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("未登录");
        }

        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "getUserInfo",
            params: {
              userId: userInfo._id,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        this.userInfo = res.result.data;
        uni.setStorageSync("userInfo", res.result.data);
      } catch (error) {
        console.error("获取用户信息失败:", error);
        if (error.message === "未登录") {
          uni.navigateTo({
            url: "/pages/auth/login",
          });
        } else {
          uni.showToast({
            title: error.message || "获取用户信息失败",
            icon: "none",
          });
        }
      }
    },

    async loadPosts() {
      if (this.isLoading) return;
      this.isLoading = true;

      try {
        const db = uniCloud.database();
        const res = await db
          .collection("posts")
          .where({
            user_id: this.userInfo._id,
          })
          .orderBy("create_date", "desc")
          .skip((this.page - 1) * this.pageSize)
          .limit(this.pageSize)
          .get();

        const posts = res.data || [];

        if (this.page === 1) {
          this.posts = posts;
        } else {
          this.posts = [...this.posts, ...posts];
        }

        this.loadMoreStatus = posts.length < this.pageSize ? "noMore" : "more";
      } catch (error) {
        console.error("加载作品列表失败:", error);
        uni.showToast({
          title: "加载作品列表失败",
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
      this.loadPosts();
    },

    goToEditProfile() {
      uni.navigateTo({
        url: "/pages/user/edit-profile",
      });
    },

    goToPublish() {
      uni.switchTab({
        url: "/pages/publish/publish",
      });
    },

    goToPostDetail(post) {
      uni.navigateTo({
        url: `/packagePost/pages/detail?id=${post._id}`,
      });
    },

    getTagLabel(value) {
      const tag = this.tagOptions.find((t) => t.value === value);
      return tag ? tag.label : value;
    },

    goToDrafts() {
      uni.navigateTo({
        url: "/pages/draft/index",
      });
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
}

.user-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;

    .avatar {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }

    .info {
      flex: 1;

      .nickname {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 10rpx;
        display: block;
      }

      .bio {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30rpx;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .count {
        font-size: 32rpx;
        font-weight: bold;
        margin-bottom: 6rpx;
      }

      .label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .edit-btn {
    width: 100%;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: #ff6b6b;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;

    &::after {
      border: none;
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    padding: 20rpx 30rpx;
    gap: 16rpx;

    .tag {
      padding: 8rpx 20rpx;
      background: rgba(255, 107, 107, 0.1);
      color: #ff6b6b;
      border-radius: 24rpx;
      font-size: 24rpx;
    }
  }
}

.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;

  .section-header {
    margin-bottom: 20rpx;

    .title {
      font-size: 32rpx;
      font-weight: bold;
    }
  }
}

.post-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -10rpx;

  .post-item {
    width: calc(50% - 20rpx);
    margin: 10rpx;
    background: #f8f8f8;
    border-radius: 8rpx;
    overflow: hidden;

    .cover {
      width: 100%;
      height: 300rpx;
    }

    .title {
      font-size: 28rpx;
      padding: 16rpx;
      display: block;
    }

    .stats {
      padding: 0 16rpx 16rpx;
      display: flex;

      .stat {
        font-size: 24rpx;
        color: #999;
        margin-right: 20rpx;

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }
}

.empty {
  padding: 60rpx 0;
  text-align: center;

  text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
    display: block;
  }

  .publish-btn {
    width: 200rpx;
    height: 80rpx;
    line-height: 80rpx;
    background: #ff6b6b;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;

    &::after {
      border: none;
    }
  }
}

.menu-list {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  margin-top: 30rpx;

  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10rpx;
    padding: 20rpx;
    border-radius: 12rpx;
    transition: background 0.3s;

    &:hover {
      background: #f8f8f8;
    }

    .iconfont {
      font-size: 28rpx;
    }
  }
}
</style>
