"use strict";
const common_vendor = require("./common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        avatar: "",
        nickname: "",
        gender: 0,
        bio: ""
      },
      genderOptions: [
        { label: "未知", value: 0 },
        { label: "男", value: 1 },
        { label: "女", value: 2 }
      ],
      defaultAvatar: "/static/images/default-avatar.png",
      isSubmitting: false
    };
  },
  onLoad() {
    this.loadUserInfo();
  },
  methods: {
    // 加载用户信息
    loadUserInfo() {
      const userInfo = common_vendor.index.getStorageSync("userInfo");
      if (userInfo) {
        this.formData = {
          _id: userInfo._id,
          avatar: userInfo.avatar || "",
          nickname: userInfo.nickname || "",
          gender: userInfo.gender || 0,
          bio: userInfo.bio || ""
        };
      }
    },
    // 选择头像
    async chooseAvatar() {
      try {
        const res = await common_vendor.index.chooseImage({
          count: 1,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"]
        });
        const tempFile = res.tempFilePaths[0];
        const uploadRes = await common_vendor.Vs.uploadFile({
          filePath: tempFile,
          cloudPath: `avatar/${Date.now()}-${Math.random().toString(36).slice(-6)}.${tempFile.split(".").pop()}`
        });
        this.formData.avatar = uploadRes.fileID;
      } catch (error) {
        console.error("选择头像失败:", error);
        common_vendor.index.showToast({
          title: "选择头像失败",
          icon: "none"
        });
      }
    },
    // 性别选择
    handleGenderChange(e) {
      this.formData.gender = parseInt(e.detail.value);
    },
    // 提交表单
    async handleSubmit() {
      if (this.isSubmitting)
        return;
      try {
        if (!this.formData.nickname.trim()) {
          throw new Error("请输入昵称");
        }
        this.isSubmitting = true;
        const res = await common_vendor.Vs.callFunction({
          name: "user",
          data: {
            action: "updateProfile",
            params: this.formData
          }
        });
        if (res.result.code !== 0) {
          throw new Error(res.result.msg);
        }
        common_vendor.index.setStorageSync("userInfo", res.result.data);
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        console.error("保存失败:", error);
        common_vendor.index.showToast({
          title: error.message || "保存失败",
          icon: "none"
        });
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.formData.avatar || $data.defaultAvatar,
    b: common_vendor.o((...args) => $options.chooseAvatar && $options.chooseAvatar(...args)),
    c: $data.formData.nickname,
    d: common_vendor.o(($event) => $data.formData.nickname = $event.detail.value),
    e: common_vendor.f($data.genderOptions, (item, k0, i0) => {
      return {
        a: item.value.toString(),
        b: $data.formData.gender === item.value,
        c: common_vendor.t(item.label),
        d: item.value
      };
    }),
    f: common_vendor.o((...args) => $options.handleGenderChange && $options.handleGenderChange(...args)),
    g: $data.formData.bio,
    h: common_vendor.o(($event) => $data.formData.bio = $event.detail.value),
    i: common_vendor.t($data.formData.bio.length),
    j: $data.isSubmitting,
    k: $data.isSubmitting,
    l: common_vendor.o((...args) => $options.handleSubmit && $options.handleSubmit(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
exports.MiniProgramPage = MiniProgramPage;
