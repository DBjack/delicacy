<template>
  <view class="container">
    <!-- 帖子内容 -->
    <view class="post-content">
      <view class="author">
        <image
          class="avatar"
          :src="post.author?.avatar || defaultAvatar"
          mode="aspectFill"
          @tap="goToUser(post.author?._id)"
        />
        <view class="info">
          <text class="nickname">{{ post.author?.nickname || "美食家" }}</text>
          <text class="time">{{ formatTime(post.create_date) }}</text>
        </view>
        <button
          class="follow-btn"
          :class="{ following: isFollowing }"
          @tap="handleFollow"
          v-if="post.author?._id !== currentUser?._id"
        >
          {{ isFollowing ? "已关注" : "关注" }}
        </button>
      </view>

      <text class="title">{{ post.title }}</text>
      <text class="description">{{ post.description }}</text>

      <view class="images" v-if="post.images?.length">
        <image
          v-for="(image, index) in post.images"
          :key="index"
          :src="image"
          mode="widthFix"
          @tap="previewImage(index)"
        />
      </view>

      <view class="tags" v-if="post.tags?.length">
        <text
          class="tag"
          v-for="tag in post.tags"
          :key="tag"
          @tap="goToTagPosts(tag)"
        >
          #{{ tag }}
        </text>
      </view>

      <view class="location" v-if="post.location">
        <text class="iconfont icon-location"></text>
        <text>{{ post.location }}</text>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments">
      <view class="section-title">评论 {{ post.commentCount || 0 }}</view>
      <view class="comment-list">
        <view
          class="comment-item"
          v-for="comment in comments"
          :key="comment._id"
        >
          <image
            class="avatar"
            :src="comment.user?.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="content">
            <text class="nickname">{{ comment.user?.nickname }}</text>
            <text class="text">{{ comment.content }}</text>
            <text class="time">{{ formatTime(comment.create_date) }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-if="!comments.length">暂无评论</view>
    </view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="comment-input">
        <input
          type="text"
          v-model="commentText"
          placeholder="说点什么..."
          @confirm="submitComment"
        />
      </view>
      <view class="actions">
        <view class="action-item" @tap="handleLike">
          <text
            class="iconfont"
            :class="isLiked ? 'icon-like-fill' : 'icon-like'"
          ></text>
          <text class="count">{{ post.likeCount || 0 }}</text>
        </view>
        <view class="action-item" @tap="handleCollect">
          <text
            class="iconfont"
            :class="isCollected ? 'icon-star-fill' : 'icon-star'"
          ></text>
          <text class="count">{{ post.collectCount || 0 }}</text>
        </view>
        <view class="action-item" @tap="handleShare">
          <text class="iconfont icon-share"></text>
          <text class="count">分享</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      post: {},
      comments: [],
      commentText: "",
      isLiked: false,
      isCollected: false,
      isFollowing: false,
      currentUser: null,
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad(options) {
    if (options.id) {
      this.loadData(options.id);
    }
    this.currentUser = uni.getStorageSync("userInfo");
  },

  methods: {
    async loadData(id) {
      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "getPostDetail",
            params: { id },
          },
        });

        if (res.result.code === 0) {
          this.post = res.result.data;
          this.loadComments();
          this.checkInteractionStatus();
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("加载帖子详情失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    },

    formatTime(date) {
      if (!date) return "";
      date = new Date(date);
      const now = new Date();
      const diff = now - date;
      const minute = 1000 * 60;
      const hour = minute * 60;
      const day = hour * 24;

      if (diff < minute) {
        return "刚刚";
      } else if (diff < hour) {
        return Math.floor(diff / minute) + "分钟前";
      } else if (diff < day) {
        return Math.floor(diff / hour) + "小时前";
      } else if (diff < day * 30) {
        return Math.floor(diff / day) + "天前";
      } else {
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },

    previewImage(index) {
      uni.previewImage({
        urls: this.post.images,
        current: index,
      });
    },

    goToUser(userId) {
      if (!userId) return;
      uni.navigateTo({
        url: `/pages/user/user?id=${userId}`,
      });
    },

    goToTagPosts(tag) {
      uni.navigateTo({
        url: `/packagePost/pages/list?tag=${encodeURIComponent(tag)}`,
      });
    },

    async handleFollow() {
      if (!this.currentUser) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return;
      }

      try {
        const action = this.isFollowing ? "unfollow" : "follow";
        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action,
            params: {
              userId: this.currentUser._id,
              followId: this.post.author._id,
            },
          },
        });

        if (res.result.code === 0) {
          this.isFollowing = !this.isFollowing;
          uni.showToast({
            title: this.isFollowing ? "关注成功" : "取消关注成功",
            icon: "success",
          });
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("操作失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    async handleLike() {
      // TODO: 实现点赞功能
    },

    async handleCollect() {
      // TODO: 实现收藏功能
    },

    handleShare() {
      // TODO: 实现分享功能
    },

    async loadComments() {
      // TODO: 实现加载评论功能
    },

    async submitComment() {
      // TODO: 实现提交评论功能
    },

    async checkInteractionStatus() {
      // TODO: 实现检查交互状态功能
    },
  },
};
</script>

<style lang="scss">
.container {
  padding-bottom: 120rpx;
}

.post-content {
  background: #fff;
  padding: 30rpx;

  .author {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;

    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }

    .info {
      flex: 1;

      .nickname {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 6rpx;
        display: block;
      }

      .time {
        font-size: 24rpx;
        color: #999;
      }
    }

    .follow-btn {
      width: 120rpx;
      height: 52rpx;
      line-height: 52rpx;
      font-size: 24rpx;
      color: #fff;
      background: #ff6b6b;
      border-radius: 26rpx;
      padding: 0;

      &.following {
        background: #999;
      }

      &::after {
        border: none;
      }
    }
  }

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
    display: block;
  }

  .description {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
    margin-bottom: 30rpx;
    display: block;
  }

  .images {
    margin-bottom: 30rpx;

    image {
      width: 100%;
      border-radius: 12rpx;
      margin-bottom: 20rpx;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    margin-bottom: 20rpx;

    .tag {
      font-size: 24rpx;
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      padding: 8rpx 20rpx;
      border-radius: 24rpx;
      margin-right: 16rpx;
      margin-bottom: 16rpx;
    }
  }

  .location {
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #999;

    .iconfont {
      margin-right: 8rpx;
    }
  }
}

.comments {
  background: #fff;
  margin-top: 20rpx;
  padding: 30rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 30rpx;
  }

  .comment-list {
    .comment-item {
      display: flex;
      margin-bottom: 30rpx;

      .avatar {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }

      .content {
        flex: 1;

        .nickname {
          font-size: 28rpx;
          font-weight: 500;
          color: #333;
          margin-bottom: 8rpx;
          display: block;
        }

        .text {
          font-size: 28rpx;
          color: #666;
          margin-bottom: 8rpx;
          display: block;
        }

        .time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }

  .empty {
    text-align: center;
    padding: 40rpx 0;
    color: #999;
    font-size: 28rpx;
  }
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .comment-input {
    flex: 1;
    margin-right: 20rpx;

    input {
      height: 72rpx;
      background: #f5f5f5;
      border-radius: 36rpx;
      padding: 0 30rpx;
      font-size: 28rpx;
    }
  }

  .actions {
    display: flex;

    .action-item {
      display: flex;
      align-items: center;
      margin-left: 30rpx;

      .iconfont {
        font-size: 40rpx;
        color: #666;
        margin-right: 8rpx;

        &.icon-like-fill,
        &.icon-star-fill {
          color: #ff6b6b;
        }
      }

      .count {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}
</style>
