<template>
	<view class="recipe">
		<view class="search-bar">
			<view class="search-box" @tap="goSearch">
				<text class="iconfont icon-search"></text>
				<text class="placeholder">搜索食谱</text>
			</view>
		</view>
		
		<view class="categories">
			<view 
				class="category-item" 
				v-for="(category, index) in categories" 
				:key="index"
				@tap="selectCategory(category)"
			>
				<image class="icon" :src="category.icon" mode="aspectFill"></image>
				<text class="name">{{ category.name }}</text>
				<text class="count">{{ category.count }}篇</text>
			</view>
		</view>
		
		<view class="section">
			<view class="section-header">
				<text class="title">最新食谱</text>
				<text class="more" @tap="viewMore('latest')">查看更多</text>
			</view>
			<post-list :posts="latestPosts" @refresh="loadLatestPosts"></post-list>
		</view>
		
		<view class="section">
			<view class="section-header">
				<text class="title">热门食谱</text>
				<text class="more" @tap="viewMore('hot')">查看更多</text>
			</view>
			<post-list :posts="hotPosts" @refresh="loadHotPosts"></post-list>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				categories: [],
				latestPosts: [],
				hotPosts: []
			}
		},
		onLoad() {
			this.loadCategories()
			this.loadLatestPosts()
			this.loadHotPosts()
		},
		onPullDownRefresh() {
			Promise.all([
				this.loadCategories(),
				this.loadLatestPosts(),
				this.loadHotPosts()
			]).finally(() => {
				uni.stopPullDownRefresh()
			})
		},
		methods: {
			goSearch() {
				uni.navigateTo({
					url: '/pages/search/index?type=recipe'
				})
			},
			async loadCategories() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'post',
						data: {
							action: 'getRecipeCategories'
						}
					})
					this.categories = result.data
				} catch (e) {
					uni.showToast({
						title: '加载分类失败',
						icon: 'none'
					})
				}
			},
			async loadLatestPosts() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'post',
						data: {
							action: 'getRecipePosts',
							type: 'latest'
						}
					})
					this.latestPosts = result.data
				} catch (e) {
					uni.showToast({
						title: '加载最新食谱失败',
						icon: 'none'
					})
				}
			},
			async loadHotPosts() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'post',
						data: {
							action: 'getRecipePosts',
							type: 'hot'
						}
					})
					this.hotPosts = result.data
				} catch (e) {
					uni.showToast({
						title: '加载热门食谱失败',
						icon: 'none'
					})
				}
			},
			selectCategory(category) {
				uni.navigateTo({
					url: `/packagePost/pages/list/list?category=${category._id}`
				})
			},
			viewMore(type) {
				uni.navigateTo({
					url: `/packagePost/pages/list/list?type=${type}`
				})
			}
		}
	}
</script>

<style lang="scss">
.recipe {
	min-height: 100vh;
	background-color: #f5f5f5;
	
	.search-bar {
		background-color: #fff;
		padding: 20rpx 30rpx;
		
		.search-box {
			background-color: #f5f5f5;
			height: 72rpx;
			border-radius: 36rpx;
			display: flex;
			align-items: center;
			padding: 0 30rpx;
			
			.icon-search {
				font-size: 32rpx;
				color: #999;
				margin-right: 10rpx;
			}
			
			.placeholder {
				font-size: 28rpx;
				color: #999;
			}
		}
	}
	
	.categories {
		background-color: #fff;
		padding: 30rpx;
		display: flex;
		flex-wrap: wrap;
		
		.category-item {
			width: 25%;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 30rpx;
			
			.icon {
				width: 80rpx;
				height: 80rpx;
				border-radius: 40rpx;
				margin-bottom: 10rpx;
			}
			
			.name {
				font-size: 24rpx;
				color: #333;
				margin-bottom: 6rpx;
			}
			
			.count {
				font-size: 20rpx;
				color: #999;
			}
		}
	}
	
	.section {
		margin-top: 20rpx;
		background-color: #fff;
		padding: 30rpx;
		
		.section-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			
			.title {
				font-size: 32rpx;
				color: #333;
				font-weight: bold;
			}
			
			.more {
				font-size: 24rpx;
				color: #666;
			}
		}
	}
}
</style> 