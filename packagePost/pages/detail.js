Page({
  data: {
    post: {},
    comments: [],
    commentText: "",
    isLiked: false,
    isCollected: false,
    isFollowing: false,
    currentUser: null,
    defaultAvatar: "/static/images/default-avatar.jpg",
  },

  onLoad(options) {
    if (options.id) {
      this.postId = options.id;
      this.loadData();
    }
    this.setData({
      currentUser: uni.getStorageSync("userInfo") || {},
    });
  },

  async loadData() {
    try {
      await Promise.all([
        this.loadPostDetail(),
        this.loadComments(),
        this.checkInteractionStatus(),
      ]);
    } catch (error) {
      console.error("加载数据失败:", error);
      uni.showToast({
        title: "加载失败",
        icon: "none",
      });
    }
  },

  async loadPostDetail() {
    const res = await uniCloud.callFunction({
      name: "post",
      data: {
        action: "getPostDetail",
        params: {
          postId: this.postId,
        },
      },
    });

    if (res.result.code === 0) {
      this.setData({
        post: res.result.data,
      });
    } else {
      throw new Error(res.result.msg);
    }
  },

  async loadComments() {
    const res = await uniCloud.callFunction({
      name: "comment",
      data: {
        action: "getList",
        params: {
          postId: this.postId,
        },
      },
    });

    if (res.result.code === 0) {
      this.setData({
        comments: res.result.data,
      });
    } else {
      throw new Error(res.result.msg);
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
      this.setData({
        isLiked: res.result.data.isLiked,
        isCollected: res.result.data.isCollected,
        isFollowing: res.result.data.isFollowing,
      });
    }
  },

  goToUser(e) {
    const userId = e.currentTarget.dataset.userId;
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
      const action = this.data.isFollowing ? "unfollow" : "follow";
      const res = await uniCloud.callFunction({
        name: "user",
        data: {
          action,
          params: {
            followerId: userInfo._id,
            followingId: this.data.post.author._id,
          },
        },
      });

      if (res.result.code === 0) {
        this.setData({
          isFollowing: !this.data.isFollowing,
        });
        uni.showToast({
          title: this.data.isFollowing ? "已关注" : "已取消关注",
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

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.post.images;
    if (images && images.length) {
      uni.previewImage({
        current: images[index],
        urls: images,
      });
    }
  },

  goToTagPosts(e) {
    const tag = e.currentTarget.dataset.tag;
    uni.navigateTo({
      url: `/pages/post/list?tag=${encodeURIComponent(tag)}`,
    });
  },

  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value,
    });
  },

  async submitComment(e) {
    const content = this.data.commentText.trim();
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
          data: {
            post_id: this.postId,
            user_id: userInfo._id,
            content,
          },
        },
      });

      if (res.result.code === 0) {
        this.setData({
          commentText: "",
          ["post.commentCount"]: (this.data.post.commentCount || 0) + 1,
        });
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
        this.setData({
          isLiked: !this.data.isLiked,
          ["post.likeCount"]: this.data.isLiked
            ? this.data.post.likeCount - 1
            : this.data.post.likeCount + 1,
        });
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
        this.setData({
          isCollected: !this.data.isCollected,
          ["post.collectCount"]: this.data.isCollected
            ? this.data.post.collectCount - 1
            : this.data.post.collectCount + 1,
        });
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

  onShareAppMessage() {
    return {
      title: this.data.post.title,
      path: `/packagePost/pages/detail?id=${this.postId}`,
    };
  },

  onShareTimeline() {
    return {
      title: this.data.post.title,
      query: `id=${this.postId}`,
    };
  },
});
