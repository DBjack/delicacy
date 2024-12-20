<template>
  <view class="container">
    <view class="form">
      <view class="form-item">
        <text class="label">头像</text>
        <view class="avatar-wrapper" @tap="chooseAvatar">
          <image
            class="avatar"
            :src="formData.avatar || defaultAvatar"
            mode="aspectFill"
          />
          <text class="tip">点击更换头像</text>
        </view>
      </view>

      <view class="form-item">
        <text class="label">昵称</text>
        <input
          class="input"
          type="text"
          v-model="formData.nickname"
          placeholder="请输入昵称"
        />
      </view>

      <view class="form-item">
        <text class="label">个性签名</text>
        <textarea
          class="textarea"
          v-model="formData.bio"
          placeholder="介绍一下自己吧"
          maxlength="100"
        />
        <text class="count">{{ formData.bio.length }}/100</text>
      </view>

      <view class="form-item">
        <text class="label">标签</text>
        <view class="tags">
          <view
            class="tag"
            :class="{ active: formData.tags.includes(tag.value) }"
            v-for="tag in tagOptions"
            :key="tag.value"
            @tap="toggleTag(tag.value)"
          >
            {{ tag.label }}
          </view>
        </view>
      </view>
    </view>

    <button class="submit-btn" @tap="handleSubmit">保存</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        avatar: "",
        nickname: "",
        bio: "",
        tags: [],
      },
      defaultAvatar: "/static/images/default-avatar.jpg",
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

  async onLoad() {
    const isLoggedIn = await this.checkLoginStatus();
    if (!isLoggedIn) {
      return;
    }
    this.loadUserInfo();
  },

  methods: {
    async checkLoginStatus() {
      const userInfo = uni.getStorageSync("userInfo");
      if (!userInfo) {
        uni.navigateTo({
          url: "/pages/auth/login",
        });
        return false;
      }
      return true;
    },

    async loadUserInfo() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
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

        if (res.result.code === 0) {
          const { avatar, nickname, bio, tags } = res.result.data;
          this.formData = {
            avatar: avatar || "",
            nickname: nickname || "",
            bio: bio || "",
            tags: tags || [],
          };
        } else {
          throw new Error(res.result.msg);
        }
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

    async chooseAvatar() {
      try {
        const res = await uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
        });

        const tempFilePath = res.tempFilePaths[0];
        uni.showLoading({
          title: "上传��...",
        });

        const uploadRes = await uniCloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: `avatar/${Date.now()}-${Math.random()
            .toString(36)
            .slice(-6)}.jpg`,
        });

        this.formData.avatar = uploadRes.fileID;
      } catch (error) {
        console.error("选择头像失败:", error);
        uni.showToast({
          title: "选择头像失败",
          icon: "none",
        });
      } finally {
        uni.hideLoading();
      }
    },

    toggleTag(tag) {
      const index = this.formData.tags.indexOf(tag);
      if (index > -1) {
        this.formData.tags.splice(index, 1);
      } else {
        if (this.formData.tags.length >= 3) {
          uni.showToast({
            title: "最多选择3个标签",
            icon: "none",
          });
          return;
        }
        this.formData.tags.push(tag);
      }
    },

    async handleSubmit() {
      try {
        if (!this.formData.nickname.trim()) {
          throw new Error("昵称不能为空");
        }

        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          throw new Error("未登录");
        }

        const res = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "updateUserInfo",
            params: {
              userId: userInfo._id,
              ...this.formData,
            },
          },
        });

        if (res.result.code === 0) {
          uni.setStorageSync("userInfo", {
            ...userInfo,
            ...this.formData,
          });
          uni.showToast({
            title: "保存成功",
            icon: "success",
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.result.msg);
        }
      } catch (error) {
        console.error("保存失败:", error);
        uni.showToast({
          title: error.message || "保存失败",
          icon: "none",
        });
      }
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 30rpx;
}

.form {
  background: #fff;
  border-radius: 12rpx;
  padding: 30rpx;

  .form-item {
    margin-bottom: 40rpx;
    position: relative;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 20rpx;
      display: block;
    }

    .avatar-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;

      .avatar {
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        margin-bottom: 16rpx;
      }

      .tip {
        font-size: 24rpx;
        color: #999;
      }
    }

    .input {
      height: 80rpx;
      background: #f8f8f8;
      border-radius: 12rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
    }

    .textarea {
      width: 100%;
      height: 200rpx;
      background: #f8f8f8;
      border-radius: 12rpx;
      padding: 24rpx;
      font-size: 28rpx;
    }

    .count {
      position: absolute;
      right: 24rpx;
      bottom: 24rpx;
      font-size: 24rpx;
      color: #999;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      margin: 0 -10rpx;

      .tag {
        margin: 10rpx;
        padding: 16rpx 32rpx;
        background: #f8f8f8;
        border-radius: 32rpx;
        font-size: 26rpx;
        color: #666;

        &.active {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }
      }
    }
  }
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  margin-top: 60rpx;

  &::after {
    border: none;
  }
}
</style>
