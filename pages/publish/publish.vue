<template>
  <view class="container">
    <!-- 顶部进度条 -->
    <view class="progress-bar">
      <view class="progress" :style="{ width: `${getProgress()}%` }"></view>
    </view>

    <view class="content">
      <!-- 标题输入 -->
      <view class="form-item">
        <input
          class="title-input"
          type="text"
          v-model="formData.title"
          placeholder="给你的美食创作取个标题吧"
          maxlength="30"
          @input="handleTitleInput"
        />
        <text class="count">{{ formData.title.length }}/30</text>
      </view>

      <!-- 图片上传 -->
      <view class="form-item">
        <view class="image-list">
          <view
            class="image-item"
            v-for="(image, index) in formData.images"
            :key="index"
          >
            <image :src="image" mode="aspectFill" @tap="previewImage(index)" />
            <view class="mask">
              <view class="delete-btn" @tap.stop="deleteImage(index)">
                <text class="iconfont icon-delete"></text>
              </view>
              <view class="order-num">{{ index + 1 }}</view>
            </view>
          </view>
          <view
            class="upload-btn"
            @tap="chooseImage"
            v-if="formData.images.length < 9"
          >
            <text class="iconfont icon-camera"></text>
            <text class="tip">{{ formData.images.length }}/9</text>
          </view>
        </view>
      </view>

      <!-- 描述输入 -->
      <view class="form-item">
        <textarea
          class="description-input"
          v-model="formData.description"
          placeholder="分享美食的故事，食材、做法、小贴士..."
          maxlength="1000"
          :show-confirm-bar="false"
          :auto-height="true"
        />
        <text class="count">{{ formData.description.length }}/1000</text>
      </view>

      <!-- 分类选择 -->
      <view class="form-item">
        <text class="section-title">选择分类</text>
        <view class="category-list">
          <view
            v-for="item in categories"
            :key="item.value"
            class="category-item"
            :class="{ active: formData.category === item.value }"
            @tap="selectCategory(item.value)"
          >
            <text class="iconfont" :class="item.icon"></text>
            <text>{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 标签选择 -->
      <view class="form-item">
        <text class="section-title">添加标签</text>
        <view class="tags-wrapper">
          <view
            v-for="tag in tagOptions"
            :key="tag.value"
            class="tag"
            :class="{ active: formData.tags.includes(tag.value) }"
            @tap="toggleTag(tag.value)"
          >
            <text class="tag-icon" v-if="formData.tags.includes(tag.value)"
              >✓</text
            >
            {{ tag.label }}
          </view>
        </view>
        <text class="tip">最多选择5个标签，让更多人发现你的美食</text>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="button-group">
      <button class="draft-btn" :disabled="isSubmitting" @tap="saveDraft">
        存草稿
      </button>
      <button
        class="submit-btn"
        :class="{ disabled: !canSubmit }"
        :loading="isSubmitting"
        @tap="handleSubmit"
      >
        发布
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        title: "",
        description: "",
        images: [],
        category: "",
        tags: [],
        status: 1,
      },
      categories: [
        { label: "家常菜", value: "home", icon: "icon-home" },
        { label: "甜点", value: "dessert", icon: "icon-dessert" },
        { label: "烘焙", value: "baking", icon: "icon-baking" },
        { label: "饮品", value: "drink", icon: "icon-drink" },
        { label: "小吃", value: "snack", icon: "icon-snack" },
        { label: "其他", value: "other", icon: "icon-other" },
      ],
      tagOptions: [
        { label: "快手菜", value: "quick" },
        { label: "下饭菜", value: "rice" },
        { label: "早餐", value: "breakfast" },
        { label: "午餐", value: "lunch" },
        { label: "晚餐", value: "dinner" },
        { label: "宵夜", value: "midnight" },
        { label: "素食", value: "vegetarian" },
        { label: "低卡", value: "lowcal" },
        { label: "高蛋白", value: "protein" },
      ],
      isSubmitting: false,
      draftId: "",
    };
  },

  computed: {
    canSubmit() {
      return (
        this.formData.title.trim() &&
        this.formData.images.length > 0 &&
        this.formData.category &&
        !this.isSubmitting
      );
    },
  },

  onLoad(options) {
    if (options.draft) {
      const draft = JSON.parse(decodeURIComponent(options.draft));
      console.log("编辑草稿:", draft);
      this.formData = { ...draft };
      if (draft.id) {
        this.draftId = draft.id;
      }
    }
  },

  methods: {
    getProgress() {
      let progress = 0;
      if (this.formData.title) progress += 25;
      if (this.formData.images.length) progress += 25;
      if (this.formData.description) progress += 25;
      if (this.formData.category) progress += 25;
      return progress;
    },

    handleTitleInput(e) {
      this.formData.title = e.detail.value.trim();
    },

    async chooseImage() {
      try {
        const res = await uni.chooseImage({
          count: 9 - this.formData.images.length,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
        });

        uni.showLoading({
          title: "上传中...",
          mask: true,
        });

        for (let tempFile of res.tempFilePaths) {
          const uploadRes = await uniCloud.uploadFile({
            filePath: tempFile,
            cloudPath: `posts/${Date.now()}-${Math.random()
              .toString(36)
              .slice(-6)}.${tempFile.split(".").pop()}`,
          });
          this.formData.images.push(uploadRes.fileID);
        }

        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: "上传失败，请重试",
          icon: "none",
        });
      }
    },

    deleteImage(index) {
      uni.showModal({
        title: "提示",
        content: "确定要删除这张图片吗？",
        success: (res) => {
          if (res.confirm) {
            this.formData.images.splice(index, 1);
          }
        },
      });
    },

    previewImage(index) {
      uni.previewImage({
        urls: this.formData.images,
        current: this.formData.images[index],
      });
    },

    selectCategory(value) {
      this.formData.category = value;
    },

    toggleTag(value) {
      const index = this.formData.tags.indexOf(value);
      if (index > -1) {
        this.formData.tags.splice(index, 1);
      } else {
        if (this.formData.tags.length >= 5) {
          uni.showToast({
            title: "最多选择5个标签",
            icon: "none",
          });
          return;
        }
        this.formData.tags.push(value);
      }
    },

    async saveDraft() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const draftData = {
          ...this.formData,
          user_id: userInfo._id,
          status: 0,
        };

        let res;
        if (this.draftId) {
          res = await uniCloud.callFunction({
            name: "post",
            data: {
              action: "update",
              params: {
                id: this.draftId,
                ...draftData,
              },
            },
          });
        } else {
          res = await uniCloud.callFunction({
            name: "post",
            data: {
              action: "create",
              params: draftData,
            },
          });
        }

        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }

        uni.showToast({
          title: "已保存到草稿箱",
          icon: "success",
        });

        setTimeout(() => {
          uni.redirectTo({
            url: "/pages/draft/index",
          });
        }, 1500);
      } catch (error) {
        console.error("保存草稿失败:", error);
        uni.showToast({
          title: error.message || "保存失败",
          icon: "none",
        });
      }
    },

    async handleSubmit() {
      if (!this.canSubmit) return;

      try {
        this.isSubmitting = true;

        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo._id) {
          throw new Error("请先登录");
        }

        const res = await uniCloud.callFunction({
          name: "post",
          data: {
            action: "create",
            params: {
              ...this.formData,
              user_id: userInfo._id,
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
        uni.showToast({
          title: error.message || "发布失败",
          icon: "none",
        });
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style lang="scss">
.container {
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: #f0f0f0;
  z-index: 100;

  .progress {
    height: 100%;
    background: #ff6b6b;
    transition: width 0.3s ease;
  }
}

.content {
  padding: 30rpx;
}

.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.title-input {
  font-size: 32rpx;
  font-weight: 500;
  height: 88rpx;
  line-height: 88rpx;

  &::placeholder {
    color: #999;
    font-weight: normal;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;

  .image-item {
    position: relative;
    width: calc(33.33% - 16rpx);
    margin: 8rpx;
    border-radius: 12rpx;
    overflow: hidden;
    background: #f8f8f8;

    &::before {
      content: "";
      display: block;
      padding-top: 100%;
    }

    image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.2);
      opacity: 0;
      transition: opacity 0.3s;

      .delete-btn {
        position: absolute;
        right: 8rpx;
        top: 8rpx;
        width: 44rpx;
        height: 44rpx;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        .icon-delete {
          color: #fff;
          font-size: 24rpx;
        }
      }

      .order-num {
        position: absolute;
        left: 8rpx;
        bottom: 8rpx;
        font-size: 24rpx;
        color: #fff;
        text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.3);
      }
    }

    &:hover .mask {
      opacity: 1;
    }
  }

  .upload-btn {
    position: relative;
    width: calc(33.33% - 16rpx);
    margin: 8rpx;
    background: #f8f8f8;
    border-radius: 12rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    &::before {
      content: "";
      display: block;
      padding-top: 100%;
    }

    .icon-camera {
      font-size: 48rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .tip {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.description-input {
  width: 100%;
  min-height: 200rpx;
  font-size: 28rpx;
  line-height: 1.6;
  padding: 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx;

  .category-item {
    width: calc(33.33% - 16rpx);
    height: 88rpx;
    margin: 8rpx;
    background: #f8f8f8;
    border-radius: 12rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    .iconfont {
      font-size: 32rpx;
      color: #666;
      margin-bottom: 4rpx;
    }

    text {
      font-size: 24rpx;
      color: #666;
    }

    &.active {
      background: #ff6b6b;
      transform: translateY(-2rpx);
      box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);

      .iconfont,
      text {
        color: #fff;
      }
    }
  }
}

.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8rpx 16rpx;

  .tag {
    margin: 8rpx;
    padding: 12rpx 24rpx;
    background: #f8f8f8;
    border-radius: 30rpx;
    font-size: 26rpx;
    color: #666;
    display: flex;
    align-items: center;
    transition: all 0.3s;

    &.active {
      background: #ff6b6b;
      color: #fff;
      transform: translateY(-2rpx);
      box-shadow: 0 4rpx 12rpx rgba(255, 107, 107, 0.3);
    }

    .tag-icon {
      margin-right: 6rpx;
      font-size: 24rpx;
    }
  }
}

.count {
  font-size: 24rpx;
  color: #999;
  text-align: right;
  margin-top: 8rpx;
  display: block;
}

.tip {
  font-size: 24rpx;
  color: #999;
}

.button-group {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 20rpx;

  button {
    flex: 1;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 32rpx;
    text-align: center;

    &::after {
      border: none;
    }
  }

  .draft-btn {
    background: #f8f8f8;
    color: #666;
  }

  .submit-btn {
    background: #ff6b6b;
    color: #fff;

    &.disabled {
      background: #ffb3b3;
    }

    &:not(.disabled):active {
      transform: translateY(2rpx);
      opacity: 0.9;
    }
  }
}
</style>
