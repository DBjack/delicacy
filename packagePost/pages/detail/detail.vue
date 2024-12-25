<template>
  <view class="container">
    <block v-if="post._id">
      <view class="post-content">
        <view class="author">
          <image
            class="avatar"
            :src="
              (post.author && post.author.avatar) ||
              '/static/images/default-avatar.png'
            "
            mode="aspectFill"
            @tap="goToUser(post.author && post.author._id)"
          />
          <view class="info">
            <text class="nickname">{{
              (post.author && post.author.nickname) || "美食家"
            }}</text>
            <text class="time">{{ formatTime(post.create_date) }}</text>
          </view>
          <block v-if="post.author && post.author._id !== currentUser._id">
            <button
              class="follow-btn"
              :class="{ following: isFollowing }"
              @tap="handleFollow"
            >
              {{ isFollowing ? "已关注" : "关注" }}
            </button>
          </block>
        </view>

        <text class="title">{{ post.title }}</text>
        <text class="description">{{ post.description }}</text>

        <block v-if="post.images && post.images.length">
          <view class="images">
            <image
              v-for="(image, index) in post.images"
              :key="index"
              :src="image"
              mode="widthFix"
              @tap="previewImage(index)"
            />
          </view>
        </block>

        <block v-if="post.tags && post.tags.length">
          <view class="tags">
            <text
              v-for="tag in post.tags"
              :key="tag"
              class="tag"
              @tap="goToTagPosts(tag)"
            >
              #{{ tag }}
            </text>
          </view>
        </block>

        <block v-if="post.location">
          <view class="location">
            <text class="iconfont icon-location"></text>
            <text>{{ post.location }}</text>
          </view>
        </block>
      </view>
    </block>

    <view class="comments">
      <view class="section-title">评论 {{ post.commentCount || 0 }}</view>
      <view class="comment-list">
        <block v-if="comments.length">
          <view
            v-for="comment in comments"
            :key="comment._id"
            class="comment-item"
          >
            <image
              class="avatar"
              :src="
                (comment.user && comment.user.avatar) ||
                '/static/images/default-avatar.png'
              "
              mode="aspectFill"
            />
            <view class="content">
              <text class="nickname">{{
                comment.user && comment.user.nickname
              }}</text>
              <text class="text">{{ comment.content }}</text>
              <text class="time">{{ formatTime(comment.create_date) }}</text>
            </view>
          </view>
        </block>
        <view v-else class="empty">暂无评论</view>
      </view>
    </view>

    <view class="action-bar">
      <view class="comment-input">
        <input
          type="text"
          placeholder="说点什么..."
          v-model="commentText"
          @confirm="submitComment"
        />
      </view>
      <view class="actions">
        <view class="action-item" @tap="handleLike">
          <text
            class="iconfont"
            :class="isLiked ? 'icon-heart-fill' : 'icon-heart'"
            :style="{ color: isLiked ? '#ff6b6b' : '#999' }"
          ></text>
          <text class="count">{{ post.likeCount || 0 }}</text>
        </view>
        <view class="action-item" @tap="handleCollect">
          <text
            class="iconfont"
            :class="isCollected ? 'icon-star-fill' : 'icon-star'"
            :style="{ color: isCollected ? '#ff6b6b' : '#999' }"
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
import LoadMore from "@/components/load-more/load-more.vue";

export default {
  components: {
    LoadMore,
  },
  data() {
    return {
      postId: "",
      post: {},
      comments: [],
      commentText: "",
      isLiked: false,
      isCollected: false,
      isFollowing: false,
      currentUser: null,
    };
  },

  onLoad(options) {
    if (options.id) {
      this.postId = options.id;
      this.loadData();
    }
    this.currentUser = uni.getStorageSync("userInfo") || {};
  },

  methods: {
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

    async loadData() {
      try {
        console.log("开始加载数据...");
        await this.loadPostDetail();

        if (this.post._id) {
          await Promise.all([
            this.loadComments(),
            this.checkInteractionStatus(),
          ]);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
        uni.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    },

    async loadPostDetail() {
      try {
        console.log("正在加载帖子详情，ID:", this.postId);

        const res = await uniCloud.callFunction({
          name: "posts",
          data: {
            action: "getPostDetail",
            params: {
              postId: this.postId,
            },
          },
        });

        console.log("帖子详情返回结果:", res);

        if (res.result.code === 0 && res.result.data) {
          this.post = res.result.data;
          console.log("设置的帖子数据:", this.post);
        } else {
          throw new Error(res.result.msg || "获取帖子详情失败");
        }
      } catch (error) {
        console.error("获取帖子详情失败:", error);
        uni.showToast({
          title: error.message || "获取帖子详情失败",
          icon: "none",
        });
      }
    },

    async loadComments() {
      try {
        const res = await uniCloud.callFunction({
          name: "comment",
          data: {
            action: "getList",
            params: {
              postId: this.postId,
              page: 1,
              pageSize: 20,
            },
          },
        });

        if (res.result.code === 0) {
          this.comments = res.result.data || [];
        } else {
          throw new Error(res.result.msg || "获取评论失败");
        }
      } catch (error) {
        console.error("获取评论失败:", error);
        uni.showToast({
          title: error.message || "获取评论失败",
          icon: "none",
        });
      }
    },

    async checkInteractionStatus() {
      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) return;

      const res = await uniCloud.callFunction({
        name: "post",
        data: {
          action: "checkInteractionStatus",
          params: {
            postId: this.postId,
            userId: userInfo._id,
          },
        },
      });

      if (res.result.code === 0) {
        this.isLiked = res.result.data.isLiked;
        this.isCollected = res.result.data.isCollected;
        this.isFollowing = res.result.data.isFollowing;
      }
    },

    goToUser(userId) {
      if (userId) {
        uni.navigateTo({
          url: `/pages/user/user?id=${userId}`,
        });
      }
    },

    async handleFollow() {
      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) {
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
              followerId: userInfo._id,
              followingId: this.post.author._id,
            },
          },
        });

        if (res.result.code === 0) {
          this.isFollowing = !this.isFollowing;
          uni.showToast({
            title: this.isFollowing ? "已关注" : "已取消关注",
            icon: "success",
          });
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("关注操作失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    previewImage(index) {
      const images = this.post.images;
      if (images?.length) {
        uni.previewImage({
          current: images[index],
          urls: images,
        });
      }
    },

    goToTagPosts(tag) {
      uni.navigateTo({
        url: `/packagePost/pages/list/list?tag=${encodeURIComponent(tag)}`,
      });
    },

    async submitComment() {
      const content = this.commentText.trim();
      if (!content) {
        uni.showToast({
          title: "请输入评论内容",
          icon: "none",
        });
        return;
      }

      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return;
      }

      try {
        const res = await uniCloud.callFunction({
          name: "comment",
          data: {
            action: "create",
            params: {
              post_id: this.postId,
              user_id: userInfo._id,
              content,
            },
          },
        });

        if (res.result.code === 0) {
          this.commentText = "";
          this.post.commentCount = (this.post.commentCount || 0) + 1;
          await this.loadComments();
          uni.showToast({
            title: "评论成功",
            icon: "success",
          });
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("评论失败:", error);
        uni.showToast({
          title: "评论失败",
          icon: "none",
        });
      }
    },

    async handleLike() {
      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return;
      }

      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "like",
            params: {
              postId: this.postId,
              userId: userInfo._id,
            },
          },
        });

        if (res.result.code === 0) {
          this.isLiked = !this.isLiked;
          this.post.likeCount = this.isLiked
            ? (this.post.likeCount || 0) + 1
            : (this.post.likeCount || 1) - 1;
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("点赞失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    async handleCollect() {
      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return;
      }

      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "collect",
            params: {
              postId: this.postId,
              userId: userInfo._id,
            },
          },
        });

        if (res.result.code === 0) {
          this.isCollected = !this.isCollected;
          this.post.collectCount = this.isCollected
            ? (this.post.collectCount || 0) + 1
            : (this.post.collectCount || 1) - 1;
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("收藏失败:", error);
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    handleShare() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ["shareAppMessage", "shareTimeline"],
      });
    },
  },

  onShareAppMessage() {
    return {
      title: this.post.title,
      path: `/packagePost/pages/detail/detail?id=${this.postId}`,
    };
  },

  onShareTimeline() {
    return {
      title: this.post.title,
      query: `id=${this.postId}`,
    };
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh();
    });
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
      margin: 0;

      &.following {
        background: #f5f5f5;
        color: #999;
      }
    }
  }

  .title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }

  .description {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
    margin-bottom: 30rpx;
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
  margin-top: 20rpx;
  background: #fff;
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
        }

        .text {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
          margin-bottom: 8rpx;
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
    color: #999;
    font-size: 28rpx;
    padding: 60rpx 0;
  }
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

  .comment-input {
    flex: 1;
    margin-right: 30rpx;

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
    align-items: center;

    .action-item {
      display: flex;
      align-items: center;
      margin-left: 40rpx;

      .iconfont {
        font-size: 40rpx;
        color: #999;
        margin-right: 8rpx;

        &.icon-like-fill,
        &.icon-star-fill {
          color: #ff6b6b;
        }
      }

      .count {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}
</style>
