<template>
  <view class="edit-profile">
    <view class="avatar-section" @tap="chooseAvatar">
      <image
        :src="userInfo.avatar || defaultAvatar"
        class="avatar"
        mode="aspectFill"
      />
      <text class="tip">点击更换头像</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">昵称</text>
        <input
          type="text"
          v-model="userInfo.nickname"
          placeholder="请输入昵称"
        />
      </view>
      <view class="form-item">
        <text class="label">个性签名</text>
        <input
          type="text"
          v-model="userInfo.signature"
          placeholder="请输入个性签名"
        />
      </view>
    </view>

    <button class="save-btn" @tap="saveProfile">保存</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userInfo: {
        _id: "",
        avatar: "",
        nickname: "",
        signature: "",
      },
      defaultAvatar: "/static/default-avatar.png",
    };
  },

  onLoad() {
    const userInfo = getApp().globalData.userInfo;
    if (userInfo) {
      this.userInfo = { ...userInfo };
    }
  },

  methods: {
    async chooseAvatar() {
      try {
        // 选择图片
        const { tempFilePaths } = await uni.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
        });

        if (tempFilePaths && tempFilePaths.length > 0) {
          uni.showLoading({
            title: "上传中...",
          });

          // 上传图片到云存储
          const result = await uniCloud.uploadFile({
            filePath: tempFilePaths[0],
            cloudPath: `avatar/${this.userInfo._id}_${Date.now()}.jpg`,
          });

          if (result.fileID) {
            // 更新用户头像
            const { result: updateResult } = await uniCloud.callFunction({
              name: "user",
              data: {
                action: "uploadAvatar",
                params: {
                  userId: this.userInfo._id,
                  avatar: result.fileID,
                },
              },
            });

            if (updateResult.code === 0) {
              this.userInfo.avatar = result.fileID;
              uni.showToast({
                title: "头像更新成功",
                icon: "success",
              });
            } else {
              throw new Error(updateResult.msg || "更新头像失败");
            }
          }
        }
      } catch (error) {
        console.error("上传头像失败:", error);
        uni.showToast({
          title: error.message || "上传失败",
          icon: "none",
        });
      } finally {
        uni.hideLoading();
      }
    },

    async saveProfile() {
      try {
        uni.showLoading({
          title: "保存中...",
        });

        const { result } = await uniCloud.callFunction({
          name: "user",
          data: {
            action: "updateProfile",
            params: {
              userId: this.userInfo._id,
              profile: {
                nickname: this.userInfo.nickname,
                avatar: this.userInfo.avatar,
                signature: this.userInfo.signature,
              },
            },
          },
        });

        if (result.code === 0) {
          // 更新全局用户信息
          getApp().globalData.userInfo = { ...this.userInfo };

          uni.showToast({
            title: "保存成功",
            icon: "success",
          });

          // 返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(result.msg || "保存失败");
        }
      } catch (error) {
        console.error("保存资料失败:", error);
        uni.showToast({
          title: error.message || "保存失败",
          icon: "none",
        });
      } finally {
        uni.hideLoading();
      }
    },
  },
};
</script>

<style lang="scss">
.edit-profile {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 30rpx;

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0;
    background-color: #fff;
    border-radius: 12rpx;
    margin-bottom: 30rpx;

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      margin-bottom: 20rpx;
    }

    .tip {
      font-size: 24rpx;
      color: #999;
    }
  }

  .form-section {
    background-color: #fff;
    border-radius: 12rpx;
    padding: 0 30rpx;

    .form-item {
      display: flex;
      align-items: center;
      padding: 30rpx 0;
      border-bottom: 1rpx solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 160rpx;
        font-size: 28rpx;
        color: #333;
      }

      input {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }
    }
  }

  .save-btn {
    margin-top: 60rpx;
    background-color: #007aff;
    color: #fff;
    border-radius: 12rpx;
    font-size: 32rpx;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>
