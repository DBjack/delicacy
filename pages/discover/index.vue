<template>
	<view class="discover">
		<view class="search-bar">
			<view class="search-box" @tap="goSearch">
				<text class="iconfont icon-search"></text>
				<text class="placeholder">搜索美食、食谱、达人</text>
			</view>
		</view>
		
		<view class="nav-grid">
			<view class="nav-item" @tap="goDaily">
				<image class="icon" src="/static/icons/daily.png"></image>
				<text class="name">每日推荐</text>
			</view>
			<view class="nav-item" @tap="goRanking">
				<image class="icon" src="/static/icons/ranking.png"></image>
				<text class="name">排行榜</text>
			</view>
			<view class="nav-item" @tap="goRecipe">
				<image class="icon" src="/static/icons/recipe.png"></image>
				<text class="name">食谱</text>
			</view>
			<view class="nav-item" @tap="goExpert">
				<image class="icon" src="/static/icons/expert.png"></image>
				<text class="name">达人</text>
			</view>
		</view>
		
		<view class="section">
			<view class="section-header">
				<text class="title">热门标签</text>
				<text class="more" @tap="viewMoreTags">查看更多</text>
			</view>
			<scroll-view class="tag-scroll" scroll-x>
				<view class="tag-list">
					<view 
						class="tag-item" 
						v-for="(tag, index) in hotTags" 
						:key="index"
						@tap="selectTag(tag)"
					>
						<image class="cover" :src="tag.cover" mode="aspectFill"></image>
						<text class="name">{{ tag.name }}</text>
						<text class="count">{{ tag.count }}篇</text>
					</view>
				</view>
			</scroll-view>
		</view>
		
		<view class="section">
			<view class="section-header">
				<text class="title">热门内容</text>
				<text class="more" @tap="viewMorePosts">查看更多</text>
			</view>
			<post-list :posts="hotPosts" @refresh="loadData"></post-list>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				hotTags: [],
				hotPosts: []
			}
		},
		onLoad() {
			this.loadData()
		},
		onPullDownRefresh() {
			this.loadData()
		},
		methods: {
			goSearch() {
				uni.navigateTo({
					url: '/pages/search/index'
				})
			},
			goDaily() {
				uni.navigateTo({
					url: '/packagePost/pages/daily/daily'
				})
			},
			goRanking() {
				uni.navigateTo({
					url: '/packagePost/pages/ranking/ranking'
				})
			},
			goRecipe() {
				uni.navigateTo({
					url: '/packagePost/pages/recipe/recipe'
				})
			},
			goExpert() {
				uni.navigateTo({
					url: '/packagePost/pages/expert/expert'
				})
			},
			async loadData() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'discover',
						data: {
							action: 'getDiscoverData'
						}
					})
					this.hotTags = result.hotTags
					this.hotPosts = result.hotPosts
				} catch (e) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					uni.stopPullDownRefresh()
				}
			},
			selectTag(tag) {
				uni.navigateTo({
					url: `/packagePost/pages/list/list?tag=${tag._id}`
				})
			},
			viewMoreTags() {
				uni.navigateTo({
					url: '/pages/tag/list'
				})
			},
			viewMorePosts() {
				uni.navigateTo({
					url: '/packagePost/pages/list/list?type=hot'
				})
			}
		}
	}
</script>

<style lang="scss">
.discover {
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
	
	.nav-grid {
		display: flex;
		background-color: #fff;
		padding: 30rpx;
		
		.nav-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			
			.icon {
				width: 80rpx;
				height: 80rpx;
				margin-bottom: 10rpx;
			}
			
			.name {
				font-size: 24rpx;
				color: #333;
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
		
		.tag-scroll {
			white-space: nowrap;
			
			.tag-list {
				display: inline-flex;
				padding: 10rpx 0;
				
				.tag-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					margin-right: 30rpx;
					
					.cover {
						width: 160rpx;
						height: 160rpx;
						border-radius: 12rpx;
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
		}
	}
}
</style>
