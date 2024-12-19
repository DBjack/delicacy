<template>
  <view class="container">
    <!-- 帖子内容 -->
    <view class="post-content">
      <view class="header">
        <view class="author">
          <image
            class="avatar"
            :src="(post.author && post.author.avatar) || defaultAvatar"
            mode="aspectFill"
          />
          <view class="info">
            <text class="nickname">{{
              (post.author && post.author.nickname) || "美食家"
            }}</text>
            <text class="time">{{ formatTime(post.create_date) }}</text>
          </view>
        </view>
        <button class="follow-btn" @tap="handleFollow">关注</button>
      </view>

      <view class="main">
        <text class="title">{{ post.title }}</text>
        <text class="description">{{ post.description }}</text>
        <view class="images">
          <image
            v-for="(image, index) in post.images"
            :key="index"
            :src="image"
            mode="widthFix"
            @tap="previewImage(post.images, index)"
          />
        </view>
      </view>

      <view class="tags" v-if="post.tags && post.tags.length > 0">
        <text
          class="tag"
          v-for="tag in post.tags"
          :key="tag"
          @tap="handleTagClick(tag)"
          >#{{ tag }}</text
        >
      </view>

      <view class="actions">
        <view class="action-item" @tap="handleLike">
          <text class="iconfont icon-like"></text>
          <text class="count">{{ post.likeCount || 0 }}</text>
        </view>
        <view class="action-item" @tap="handleCollect">
          <text class="iconfont icon-star"></text>
          <text class="count">{{ post.collectCount || 0 }}</text>
        </view>
        <view class="action-item" @tap="handleShare">
          <text class="iconfont icon-share"></text>
          <text class="count">分享</text>
        </view>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments-section">
      <view class="section-header">
        <text class="title">评论 {{ post.commentCount || 0 }}</text>
      </view>
      <view class="comments-list">
        <view class="empty" v-if="!comments.length">
          <text>暂无评论，快来抢沙发吧~</text>
        </view>
        <view
          class="comment-item"
          v-for="comment in comments"
          :key="comment._id"
        >
          <image
            class="avatar"
            :src="comment.user.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <view class="content">
            <text class="nickname">{{ comment.user.nickname }}</text>
            <text class="text">{{ comment.content }}</text>
            <view class="meta">
              <text class="time">{{ formatTime(comment.create_date) }}</text>
              <view class="actions">
                <view class="action" @tap="handleCommentLike(comment)">
                  <text class="iconfont icon-like"></text>
                  <text class="count">{{ comment.likeCount || 0 }}</text>
                </view>
                <view class="action" @tap="handleReply(comment)">
                  <text class="iconfont icon-comment"></text>
                  <text>回复</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 评论输入框 -->
    <view class="comment-input">
      <input
        type="text"
        v-model="commentText"
        placeholder="说点什么..."
        @confirm="submitComment"
      />
      <button class="submit-btn" @tap="submitComment">发送</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      id: "",
      post: {},
      comments: [],
      commentText: "",
      defaultAvatar: "/static/images/default-avatar.jpg",
    };
  },

  onLoad(options) {
    if (options.id) {
      this.id = options.id;
      this.loadData();
    }
  },

  methods: {
    async loadData() {
      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "getPostDetail",
            params: {
              id: this.id,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        this.post = res.result.data;
      } catch (error) {
        console.error("获取帖子详情失败:", error);
        uni.showToast({
          title: "获取帖子详情失败",
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

    handleFollow() {
      // TODO: 实现关注功能
      uni.showToast({
        title: "关注功能开发中",
        icon: "none",
      });
    },

    handleLike() {
      // TODO: 实现点赞功能
      uni.showToast({
        title: "点赞功能开发中",
        icon: "none",
      });
    },

    handleCollect() {
      // TODO: 实现收藏功能
      uni.showToast({
        title: "收藏功能开发中",
        icon: "none",
      });
    },

    handleShare() {
      // TODO: 实现分享功能
      uni.showToast({
        title: "分享功能开发中",
        icon: "none",
      });
    },

    handleTagClick(tag) {
      uni.navigateTo({
        url: `/pages/post/list?tag=${encodeURIComponent(tag)}`,
      });
    },

    previewImage(images, index) {
      uni.previewImage({
        urls: images,
        current: index,
      });
    },

    handleCommentLike(comment) {
      // TODO: 实现评论点赞功能
      uni.showToast({
        title: "评论点赞功能开发中",
        icon: "none",
      });
    },

    handleReply(comment) {
      // TODO: 实现回复功能
      this.commentText = `回复 @${comment.user.nickname}：`;
    },

    submitComment() {
      if (!this.commentText.trim()) {
        return;
      }

      // TODO: 实现评论提交功能
      uni.showToast({
        title: "评论功能开发中",
        icon: "none",
      });
      this.commentText = "";
    },
  },
};
</script>

<style lang="scss">
.container {
  padding-bottom: 100rpx; // 为底部评论框留出空间
}

.post-content {
  background: #fff;
  padding: 30rpx;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .author {
      display: flex;
      align-items: center;

      .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }

      .info {
        display: flex;
        flex-direction: column;

        .nickname {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 6rpx;
        }

        .time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .follow-btn {
      width: 140rpx;
      height: 56rpx;
      line-height: 56rpx;
      text-align: center;
      background: #ff6b6b;
      color: #fff;
      font-size: 28rpx;
      border-radius: 28rpx;
      padding: 0;

      &::after {
        border: none;
      }
    }
  }

  .main {
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }

    .description {
      font-size: 30rpx;
      color: #666;
      margin-bottom: 30rpx;
      line-height: 1.6;
    }

    .images {
      image {
        width: 100%;
        margin-bottom: 20rpx;
        border-radius: 12rpx;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    margin: 30rpx 0;

    .tag {
      font-size: 26rpx;
      color: #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
      padding: 10rpx 20rpx;
      border-radius: 26rpx;
      margin-right: 20rpx;
      margin-bottom: 20rpx;
    }
  }

  .actions {
    display: flex;
    justify-content: space-around;
    padding-top: 30rpx;
    border-top: 1rpx solid #f5f5f5;

    .action-item {
      display: flex;
      align-items: center;
      color: #666;

      .iconfont {
        font-size: 40rpx;
        margin-right: 10rpx;
      }

      .count {
        font-size: 28rpx;
      }
    }
  }
}

.comments-section {
  margin-top: 20rpx;
  background: #fff;
  padding: 30rpx;

  .section-header {
    margin-bottom: 30rpx;

    .title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
  }

  .comments-list {
    .empty {
      text-align: center;
      padding: 60rpx 0;
      color: #999;
      font-size: 28rpx;
    }

    .comment-item {
      display: flex;
      margin-bottom: 40rpx;

      &:last-child {
        margin-bottom: 0;
      }

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
          color: #333;
          font-weight: 500;
          margin-bottom: 10rpx;
        }

        .text {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
          margin-bottom: 16rpx;
        }

        .meta {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .time {
            font-size: 24rpx;
            color: #999;
          }

          .actions {
            display: flex;

            .action {
              display: flex;
              align-items: center;
              margin-left: 30rpx;
              color: #999;

              .iconfont {
                font-size: 28rpx;
                margin-right: 6rpx;
              }

              .count {
                font-size: 24rpx;
              }
            }
          }
        }
      }
    }
  }
}

.comment-input {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 20rpx;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #f5f5f5;

  input {
    flex: 1;
    height: 72rpx;
    background: #f8f8f8;
    border-radius: 36rpx;
    padding: 0 30rpx;
    font-size: 28rpx;
    margin-right: 20rpx;
  }

  .submit-btn {
    width: 120rpx;
    height: 72rpx;
    line-height: 72rpx;
    background: #ff6b6b;
    color: #fff;
    font-size: 28rpx;
    border-radius: 36rpx;
    padding: 0;

    &::after {
      border: none;
    }
  }
}
</style>
