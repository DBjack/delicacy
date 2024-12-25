<template>
  <view class="discover">
    <view class="menu">
      <view
        v-for="(item, index) in menuList"
        :key="index"
        :class="['menu-item', { active: currentTab === index }]"
        @tap="switchTab(index)"
      >
        {{ item.name }}
      </view>
    </view>

    <swiper
      class="content"
      :current="currentTab"
      @change="handleSwiperChange"
      :style="{ height: contentHeight + 'px' }"
    >
      <!-- 推荐内容 -->
      <swiper-item>
        <scroll-view
          scroll-y
          class="scroll-view"
          @scrolltolower="loadMore"
          :refresher-enabled="true"
          :refresher-triggered="isRefreshing"
          @refresherrefresh="onRefresh"
          :style="{ height: contentHeight + 'px' }"
        >
          <view class="post-list">
            <view
              v-for="(item, index) in postList"
              :key="index"
              class="post-item"
              @tap="goToDetail(item._id)"
            >
              <image
                v-if="item.cover"
                :src="item.cover"
                mode="aspectFill"
                class="post-image"
              />
              <view class="post-info">
                <text class="post-title">{{ item.title }}</text>
                <text class="post-desc">{{ item.description }}</text>
                <view class="post-meta">
                  <view class="author">
                    <image
                      v-if="item.author.avatar"
                      :src="item.author.avatar"
                      mode="aspectFill"
                      class="avatar"
                    />
                    <text class="nickname">{{ item.author.nickname }}</text>
                  </view>
                  <view class="stats">
                    <text class="stat-item">{{ item.likes }} 赞</text>
                    <text class="stat-item">{{ item.comments }} 评论</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-if="loading" class="loading">加载中...</view>
          <view v-if="!hasMore" class="no-more">没有更多内容了</view>
        </scroll-view>
      </swiper-item>

      <!-- 热门内容 -->
      <swiper-item>
        <scroll-view
          scroll-y
          class="scroll-view"
          :style="{ height: contentHeight + 'px' }"
        >
          <view class="empty-content">
            <text>敬请期待</text>
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 关注内容 -->
      <swiper-item>
        <scroll-view
          scroll-y
          class="scroll-view"
          :style="{ height: contentHeight + 'px' }"
        >
          <view class="empty-content">
            <text>敬请期待</text>
          </view>
        </scroll-view>
      </swiper-item>

      <!-- 达人内容 -->
      <swiper-item>
        <scroll-view
          scroll-y
          class="scroll-view"
          :style="{ height: contentHeight + 'px' }"
        >
          <view class="empty-content">
            <text>敬请期待</text>
          </view>
        </scroll-view>
      </swiper-item>
    </swiper>
  </view>
</template>

<script>
export default {
  data() {
    return {
      menuList: [
        { name: "推荐" },
        { name: "热门" },
        { name: "关注" },
        { name: "达人" },
      ],
      currentTab: 0,
      postList: [],
      page: 1,
      pageSize: 10,
      loading: false,
      hasMore: true,
      isRefreshing: false,
      contentHeight: 0,
    };
  },

  onLoad() {
    this.loadPosts();
    this.initContentHeight();
  },

  onReady() {
    this.initContentHeight();
  },

  methods: {
    initContentHeight() {
      const systemInfo = uni.getSystemInfoSync();
      // 减去菜单高度和状态栏高度
      this.contentHeight = systemInfo.windowHeight - uni.upx2px(100);
    },

    async loadPosts(refresh = false) {
      if (refresh) {
        this.page = 1;
        this.hasMore = true;
        this.postList = [];
      }

      if (!this.hasMore || this.loading) return;

      this.loading = true;
      try {
        // 添加环境信息日志
        const systemInfo = uni.getSystemInfoSync();
        console.log("系统信息:", systemInfo);

        console.log("开始调用云函数...");
        const callFunctionResult = await uniCloud
          .callFunction({
            name: "posts",
            data: {
              action: "getRecommendedPosts",
              params: {
                page: this.page,
                pageSize: this.pageSize,
              },
            },
            spaceId: "mp-3a16626b-b090-4f47-89ae-7c1ca7530d1e",
            provider: "aliyun",
          })
          .catch((err) => {
            console.error("云函数调用出错:", err);
            throw err;
          });

        console.log("云函数调用结果:", callFunctionResult);
        const { result } = callFunctionResult;

        if (result && result.data) {
          const posts = result.data;
          console.log("解析到的帖子数据:", posts);
          if (posts.length > 0) {
            this.postList = [...this.postList, ...posts];
            this.page++;
            console.log("更新后的帖子列表:", this.postList);
          } else {
            this.hasMore = false;
            console.log("没有更多数据");
          }
        } else {
          this.hasMore = false;
          console.log("返回数据格式不正确:", result);
        }
      } catch (error) {
        console.error("加载帖子失败:", error);
        uni.showToast({
          title: error.message || "加载失败",
          icon: "none",
          duration: 3000,
        });
      } finally {
        this.loading = false;
        if (this.isRefreshing) {
          this.isRefreshing = false;
        }
      }
    },

    switchTab(index) {
      this.currentTab = index;
    },

    handleSwiperChange(e) {
      this.currentTab = e.detail.current;
    },

    loadMore() {
      this.loadPosts();
    },

    async onRefresh() {
      this.isRefreshing = true;
      await this.loadPosts(true);
    },

    goToDetail(id) {
      uni.navigateTo({
        url: `/packagePost/pages/detail/detail?id=${id}`,
      });
    },
  },
};
</script>

<style lang="scss">
.discover {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;

  .menu {
    display: flex;
    padding: 20rpx;
    background-color: #fff;
    position: fixed;
    top: var(--status-bar-height);
    left: 0;
    right: 0;
    z-index: 1;
    justify-content: space-around;
    height: 100rpx;
    box-sizing: border-box;

    .menu-item {
      padding: 10rpx 30rpx;
      border-radius: 30rpx;
      font-size: 28rpx;
      color: #666;

      &.active {
        background-color: #007aff;
        color: #fff;
      }
    }
  }

  .content {
    flex: 1;
    margin-top: calc(var(--status-bar-height) + 100rpx);
    box-sizing: border-box;

    .scroll-view {
      box-sizing: border-box;
    }

    .post-list {
      padding: 20rpx;

      .post-item {
        background-color: #fff;
        border-radius: 12rpx;
        margin-bottom: 20rpx;
        overflow: hidden;

        .post-image {
          width: 100%;
          height: 360rpx;
        }

        .post-info {
          padding: 20rpx;

          .post-title {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
            margin-bottom: 10rpx;
          }

          .post-desc {
            font-size: 28rpx;
            color: #666;
            margin-bottom: 20rpx;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
          }

          .post-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .author {
              display: flex;
              align-items: center;

              .avatar {
                width: 40rpx;
                height: 40rpx;
                border-radius: 50%;
                margin-right: 10rpx;
              }

              .nickname {
                font-size: 24rpx;
                color: #666;
              }
            }

            .stats {
              display: flex;

              .stat-item {
                font-size: 24rpx;
                color: #999;
                margin-left: 20rpx;
              }
            }
          }
        }
      }
    }

    .empty-content {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #999;
      font-size: 28rpx;
    }

    .loading {
      text-align: center;
      padding: 20rpx;
      color: #999;
      font-size: 24rpx;
    }

    .no-more {
      text-align: center;
      padding: 20rpx;
      color: #999;
      font-size: 24rpx;
    }
  }
}
</style>
