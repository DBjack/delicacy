<template>
  <text
    class="icon"
    :style="{
      color: color,
      fontSize: size + 'px',
    }"
    @tap="onClick"
    >{{ iconUnicode }}</text
  >
</template>

<script>
const icons = {
  search: "\\ue8ef",
  heart: "\\ue68f",
  star: "\\ue688",
  camera: "\\ue872",
  trash: "\\ue6e2",
  location: "\\ue8e4",
  redo: "\\ue788",
  compose: "\\ue67e",
  list: "\\ue682",
  right: "\\ue6a3",
  gear: "\\ue68d",
  chat: "\\ue8c4",
  info: "\\ue6e5",
  eye: "\\ue651",
  person: "\\ue78b",
  clear: "\\ue6db",
  clock: "\\ue6be",
  weixin: "\\ue607",
  file: "\\ue649",
  checkmark: "\\ue6a8",
  home: "\\ue674",
  fire: "\\ue842",
  gift: "\\ue685",
  shop: "\\ue67f",
};

export default {
  name: "Icon",
  props: {
    type: {
      type: String,
      required: true,
    },
    size: {
      type: [Number, String],
      default: 16,
    },
    color: {
      type: String,
      default: "#333",
    },
  },
  computed: {
    iconUnicode() {
      return icons[this.type] || "";
    },
  },
  methods: {
    onClick() {
      this.$emit("click");
    },
  },
};
</script>

<style lang="scss">
@font-face {
  font-family: "iconfont";
  src: url("/static/fonts/iconfont.ttf") format("truetype");
}

.icon {
  font-family: "iconfont";
  text-decoration: none;
  text-align: center;
}
</style>
