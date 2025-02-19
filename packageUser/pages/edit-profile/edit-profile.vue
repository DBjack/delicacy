<template>
  <view class="edit-profile">
    <view class="header-bg">
      <view class="bg-overlay"></view>
    </view>
    
    <view class="content">
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
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    console.log(userInfo,'userInfo')
    if (!userInfo || !userInfo._id) {
      uni.navigateTo({
        url: '/pages/auth/login'
      });
      return;
    }
    
    this.userInfo = { ...userInfo };
  },

  methods: {
    async chooseAvatar() {
      try {
        // 选择图片
        const [err, res] = await uni.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });

        if (err) {
          throw new Error('选择图片失败');
        }

        const tempFilePath = res.tempFilePaths[0];
        if (!tempFilePath) {
          throw new Error('未获取到图片');
        }

        uni.showLoading({
          title: '上传中...',
          mask: true
        });

        // 上传图片到云存储
        const uploadResult = await uniCloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: `avatar/${this.userInfo._id}_${Date.now()}.jpg`
        });

        if (!uploadResult.fileID) {
          throw new Error('上传失败');
        }

        // 更新用户头像
        const { result } = await uniCloud.callFunction({
          name: 'user',
          data: {
            action: 'uploadAvatar',
            params: {
              userId: this.userInfo._id,
              avatar: uploadResult.fileID
            }
          }
        });

        if (result.code === 0) {
          this.userInfo.avatar = uploadResult.fileID;
          
          // 更新全局用户信息
          const app = getApp();
          if (app.globalData.userInfo) {
            app.globalData.userInfo.avatar = uploadResult.fileID;
          }
          
          // 更新本地存储
          try {
            const localUserInfo = uni.getStorageSync('userInfo');
            if (localUserInfo) {
              localUserInfo.avatar = uploadResult.fileID;
              uni.setStorageSync('userInfo', localUserInfo);
            }
          } catch (e) {
            console.error('更新本地存储失败:', e);
          }

          uni.showToast({
            title: '上传成功',
            icon: 'success'
          });
        } else {
          throw new Error(result.msg || '更新头像失败');
        }
      } catch (error) {
        console.error('上传头像失败:', error);
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none'
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
          const app = getApp();
          app.globalData.userInfo = { ...this.userInfo };
          
          // 更新本地存储
          try {
            const localUserInfo = uni.getStorageSync('userInfo');
            if (localUserInfo) {
              Object.assign(localUserInfo, {
                nickname: this.userInfo.nickname,
                avatar: this.userInfo.avatar,
                signature: this.userInfo.signature,
              });
              uni.setStorageSync('userInfo', localUserInfo);
            }
          } catch (e) {
            console.error('更新本地存储失败:', e);
          }

          uni.showToast({
            title: "保存成功",
            icon: "success",
          });

          // 返回上一页并刷新
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            if (prevPage) {
              prevPage.$vm.refreshUserInfo && prevPage.$vm.refreshUserInfo();
            }
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
  position: relative;

  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 360rpx;
    background: linear-gradient(215deg, #ff6b6b, #ff8e8e, #ffd3d3);
    overflow: hidden;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 45%, rgba(255, 255, 255, 0.1) 50%, transparent 55%);
      background-size: 200% 200%;
      animation: shine 3s infinite linear;
    }

    .bg-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 40%;
      background: linear-gradient(to bottom, transparent, #f8f8f8);
      z-index: 2;
    }
  }

  @keyframes shine {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .content {
    position: relative;
    z-index: 2;
    padding: 30rpx;
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40rpx 0;
    background-color: #fff;
    border-radius: 12rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

    .avatar {
      width: 160rpx;
      height: 160rpx;
      border-radius: 50%;
      margin-bottom: 20rpx;
      border: 4rpx solid #fff;
      box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
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
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);

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
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    color: #fff;
    border-radius: 12rpx;
    font-size: 32rpx;
    box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.3);

    &:active {
      opacity: 0.9;
      transform: translateY(2rpx);
    }
  }
}
</style>
