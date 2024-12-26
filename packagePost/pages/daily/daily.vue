<template>
	<view class="daily">
		<post-list :posts="posts" @refresh="loadData"></post-list>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				posts: []
			}
		},
		onLoad() {
			this.loadData()
		},
		onPullDownRefresh() {
			this.loadData()
		},
		methods: {
			async loadData() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'post',
						data: {
							action: 'getDailyPosts'
						}
					})
					this.posts = result.data
				} catch (e) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					uni.stopPullDownRefresh()
				}
			}
		}
	}
</script>

<style lang="scss">
.daily {
	min-height: 100vh;
	background-color: #f5f5f5;
}
</style> 