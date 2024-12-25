<template>
  <view class="container">
    <view class="empty" v-if="!drafts.length">
      <image
        class="empty-image"
        src="/static/empty-box.png"
        mode="aspectFit"
      ></image>
      <text class="empty-text">暂无草稿</text>
    </view>

    <view class="list" v-else>
      <view class="item" v-for="(item, index) in drafts" :key="index">
        <view class="content" @tap="editDraft(item)">
          <view class="main-content">
            <text class="title">{{ item.title || "无标题" }}</text>
            <text class="desc">{{ item.content || "暂无内容" }}</text>
          </view>
          <view class="info">
            <text class="time">{{ item.updateTime }}</text>
            <view class="actions">
              <button class="action-btn delete" @tap.stop="deleteDraft(index)">
                删除
              </button>
              <button class="action-btn publish" @tap.stop="publishDraft(item)">
                发布
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <load-more :status="loadMoreStatus" v-if="drafts.length"></load-more>
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
      drafts: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: "more",
      isLoading: false,
    };
  },

  onLoad() {
    this.getDrafts();
  },

  onPullDownRefresh() {
    this.page = 1;
    this.drafts = [];
    this.getDrafts().then(() => {
      uni.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.loadMoreStatus === "noMore" || this.isLoading) return;
    this.page++;
    this.getDrafts();
  },

  methods: {
    async getDrafts() {
      if (this.isLoading) return;

      try {
        this.isLoading = true;
        this.loadMoreStatus = "loading";

        // 从本地存储获取草稿列表
        const drafts = uni.getStorageSync("drafts") || [];
        const start = (this.page - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = drafts.slice(start, end);

        if (this.page === 1) {
          this.drafts = pageData;
        } else {
          this.drafts = [...this.drafts, ...pageData];
        }

        this.loadMoreStatus = end >= drafts.length ? "noMore" : "more";
      } catch (error) {
        console.error("获取草稿列表失败:", error);
        uni.showToast({
          title: "获取数据失败",
          icon: "none",
        });
        this.loadMoreStatus = "more";
      } finally {
        this.isLoading = false;
      }
    },

    editDraft(draft) {
      // 跳转到发布页面并传递草稿数据
      uni.navigateTo({
        url: `/pages/publish/publish?draft=${encodeURIComponent(
          JSON.stringify(draft)
        )}`,
      });
    },

    async deleteDraft(index) {
      try {
        await uni.showModal({
          title: "提示",
          content: "确定要删除这篇草稿吗？",
          confirmText: "删除",
        });

        // 从本地存储中删除
        const drafts = uni.getStorageSync("drafts") || [];
        const realIndex = (this.page - 1) * this.pageSize + index;
        drafts.splice(realIndex, 1);
        uni.setStorageSync("drafts", drafts);

        // 从当前列表中删除
        this.drafts.splice(index, 1);

        uni.showToast({
          title: "删除成功",
          icon: "success",
        });

        // 如果当前页没有数据了，且不是第一页，则加载上一页
        if (this.drafts.length === 0 && this.page > 1) {
          this.page--;
          this.getDrafts();
        }
      } catch (error) {
        console.log("用户取消操作");
      }
    },

    publishDraft(draft) {
      uni.navigateTo({
        url: `/pages/publish/publish?draft=${encodeURIComponent(
          JSON.stringify(draft)
        )}&autoPublish=true`,
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
    background: #fff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    overflow: hidden;

    .content {
      padding: 20rpx;

      .main-content {
        margin-bottom: 20rpx;

        .title {
          font-size: 32rpx;
          color: #333;
          font-weight: 500;
          margin-bottom: 12rpx;
          display: block;
        }

        .desc {
          font-size: 28rpx;
          color: #666;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
      }

      .info {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .time {
          font-size: 24rpx;
          color: #999;
        }

        .actions {
          display: flex;
          align-items: center;

          .action-btn {
            margin: 0;
            padding: 0;
            min-width: 120rpx;
            height: 56rpx;
            line-height: 56rpx;
            font-size: 26rpx;
            margin-left: 20rpx;
            background: transparent;

            &.delete {
              color: #999;
              border: 1rpx solid #ddd;
            }

            &.publish {
              color: #fff;
              background: #ff6b6b;
              border: none;
            }

            &:active {
              opacity: 0.8;
            }
          }
        }
      }
    }
  }
}
</style>
