<template>
  <view class="container">
    <!-- 空状态 -->
    <view class="empty" v-if="drafts.length === 0">
      <view class="empty-icon">
        <text class="iconfont icon-draft"></text>
      </view>
      <text>暂无草稿</text>
      <button class="create-btn" @tap="goToPublish">去创作</button>
    </view>

    <!-- 草稿列表 -->
    <view class="draft-list" v-else>
      <view
        class="draft-item"
        v-for="draft in drafts"
        :key="draft._id"
        @tap="editDraft(draft)"
      >
        <view class="content">
          <text class="title">{{ draft.title || "无标题" }}</text>
          <text class="description">{{ draft.description || "暂无描述" }}</text>
          <view class="info">
            <text class="time">{{ formatTime(draft.create_date) }}</text>
            <text class="image-count" v-if="draft.images.length">
              {{ draft.images.length }}张图片
            </text>
          </view>
        </view>
        <view class="cover" v-if="draft.images.length">
          <image :src="draft.images[0]" mode="aspectFill" />
        </view>
        <view class="actions">
          <button class="action-btn delete" @tap.stop="deleteDraft(draft._id)">
            <text class="iconfont icon-delete"></text>
          </button>
          <button class="action-btn publish" @tap.stop="publishDraft(draft)">
            发布
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      drafts: [],
      isLoading: false,
    };
  },

  onShow() {
    this.loadDrafts();
  },

  methods: {
    async loadDrafts() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "getDrafts",
            params: {
              user_id: userInfo._id,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        this.drafts = res.result.data || [];
      } catch (error) {
        console.error("加载草稿失败:", error);
        uni.showToast({
          title: error.message || "加载失败",
          icon: "none",
        });
      }
    },

    editDraft(draft) {
      const { _id, user_id, create_date, update_date, ...draftData } = draft;
      const editData = {
        ...draftData,
        id: _id,
      };

      uni.navigateTo({
        url: `/pages/publish/publish?draft=${encodeURIComponent(
          JSON.stringify(editData)
        )}`,
      });
    },

    async deleteDraft(id) {
      uni.showModal({
        title: "提示",
        content: "确定要删除这篇草稿吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const res = await uniCloud.callFunction({
                name: "post",
                data: {
                  action: "delete",
                  params: {
                    id,
                  },
                },
              });

              if (res.result.code !== 0) {
                throw new Error(res.result.msg);
              }

              uni.showToast({
                title: "删除成功",
                icon: "success",
              });

              this.loadDrafts();
            } catch (error) {
              console.error("删除失败:", error);
              uni.showToast({
                title: "删除失败",
                icon: "none",
              });
            }
          }
        },
      });
    },

    async publishDraft(draft) {
      try {
        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "update",
            params: {
              id: draft._id,
              status: 1,
            },
          },
        });

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        uni.showToast({
          title: "发布成功",
          icon: "success",
        });

        setTimeout(() => {
          uni.switchTab({
            url: "/pages/index/index",
          });
        }, 1500);
      } catch (error) {
        console.error("发布失败:", error);
        uni.showToast({
          title: "发布失败",
          icon: "none",
        });
      }
    },

    formatTime(date) {
      if (!date) return "";
      date = new Date(date);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date
        .getHours()
        .toString()
        .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    },

    goToPublish() {
      uni.switchTab({
        url: "/pages/publish/publish",
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
  padding: 120rpx 0;

  .empty-icon {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .iconfont {
      font-size: 120rpx;
      color: #ddd;
    }
  }

  text {
    font-size: 28rpx;
    color: #999;
    margin-bottom: 30rpx;
  }

  .create-btn {
    width: 200rpx;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: #ff6b6b;
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
  }
}

.draft-list {
  .draft-item {
    position: relative;
    background: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    display: flex;
    gap: 20rpx;

    .content {
      flex: 1;
      min-width: 0;

      .title {
        font-size: 32rpx;
        font-weight: 500;
        color: #333;
        margin-bottom: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .description {
        font-size: 28rpx;
        color: #666;
        margin-bottom: 16rpx;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .info {
        display: flex;
        align-items: center;
        gap: 16rpx;

        text {
          font-size: 24rpx;
          color: #999;
        }
      }
    }

    .cover {
      width: 160rpx;
      height: 160rpx;
      border-radius: 12rpx;
      overflow: hidden;

      image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .actions {
      position: absolute;
      right: 24rpx;
      bottom: 24rpx;
      display: flex;
      gap: 16rpx;

      .action-btn {
        min-width: auto;
        height: 56rpx;
        line-height: 56rpx;
        padding: 0 24rpx;
        border-radius: 28rpx;
        font-size: 26rpx;

        &::after {
          border: none;
        }

        &.delete {
          background: #f8f8f8;
          color: #999;
        }

        &.publish {
          background: #ff6b6b;
          color: #fff;
        }

        .iconfont {
          font-size: 28rpx;
        }
      }
    }
  }
}
</style>
