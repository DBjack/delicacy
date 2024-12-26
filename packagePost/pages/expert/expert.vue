<template>
	<view class="expert">
		<view class="search-bar">
			<view class="search-box" @tap="goSearch">
				<text class="iconfont icon-search"></text>
				<text class="placeholder">搜索达人</text>
			</view>
		</view>
		
		<view class="tabs">
			<view 
				v-for="(tab, index) in tabs" 
				:key="index"
				:class="['tab-item', currentTab === index ? 'active' : '']"
				@tap="switchTab(index)"
			>
				{{ tab.name }}
			</view>
		</view>
		
		<view class="expert-list">
			<view class="expert-item" v-for="(expert, index) in experts" :key="index" @tap="viewExpert(expert)">
				<image class="avatar" :src="expert.avatar" mode="aspectFill"></image>
				<view class="info">
					<view class="name-wrap">
						<text class="name">{{ expert.nickname }}</text>
						<image v-if="expert.verified" class="verified-icon" src="/static/icons/verified.png"></image>
					</view>
					<text class="bio">{{ expert.bio }}</text>
					<view class="stats">
						<text class="stat-item">���布 {{ expert.postCount }}</text>
						<text class="stat-item">获赞 {{ expert.likeCount }}</text>
						<text class="stat-item">粉丝 {{ expert.followerCount }}</text>
					</view>
				</view>
				<button 
					class="follow-btn" 
					:class="expert.isFollowing ? 'following' : ''"
					@tap.stop="toggleFollow(expert)"
				>
					{{ expert.isFollowing ? '已关注' : '关注' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 0,
				tabs: [
					{ name: '推荐', type: 'recommend' },
					{ name: '最热', type: 'hot' },
					{ name: '新晋', type: 'new' }
				],
				experts: []
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
					url: '/pages/search/index?type=expert'
				})
			},
			switchTab(index) {
				if (this.currentTab === index) return
				this.currentTab = index
				this.loadData()
			},
			async loadData() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'user',
						data: {
							action: 'getExperts',
							type: this.tabs[this.currentTab].type
						}
					})
					this.experts = result.data
				} catch (e) {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					uni.stopPullDownRefresh()
				}
			},
			viewExpert(expert) {
				uni.navigateTo({
					url: `/packageUser/pages/profile/profile?id=${expert._id}`
				})
			},
			async toggleFollow(expert) {
				if (!this.$store.state.user.isLogin) {
					uni.navigateTo({
						url: '/pages/auth/login'
					})
					return
				}
				
				try {
					const action = expert.isFollowing ? 'unfollow' : 'follow'
					await uniCloud.callFunction({
						name: 'user',
						data: {
							action,
							userId: expert._id
						}
					})
					expert.isFollowing = !expert.isFollowing
					expert.followerCount += expert.isFollowing ? 1 : -1
					
					uni.showToast({
						title: expert.isFollowing ? '关注成功' : '取消关注',
						icon: 'none'
					})
				} catch (e) {
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss">
.expert {
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
	
	.tabs {
		display: flex;
		background-color: #fff;
		padding: 30rpx;
		
		.tab-item {
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			color: #666;
			position: relative;
			
			&.active {
				color: #07c160;
				font-weight: bold;
				
				&::after {
					content: '';
					position: absolute;
					left: 50%;
					bottom: -10rpx;
					transform: translateX(-50%);
					width: 40rpx;
					height: 4rpx;
					background-color: #07c160;
					border-radius: 2rpx;
				}
			}
		}
	}
	
	.expert-list {
		padding: 20rpx;
		
		.expert-item {
			background-color: #fff;
			border-radius: 12rpx;
			padding: 30rpx;
			display: flex;
			align-items: flex-start;
			margin-bottom: 20rpx;
			
			.avatar {
				width: 100rpx;
				height: 100rpx;
				border-radius: 50%;
				margin-right: 20rpx;
			}
			
			.info {
				flex: 1;
				margin-right: 20rpx;
				
				.name-wrap {
					display: flex;
					align-items: center;
					margin-bottom: 10rpx;
					
					.name {
						font-size: 32rpx;
						color: #333;
						font-weight: bold;
						margin-right: 10rpx;
					}
					
					.verified-icon {
						width: 32rpx;
						height: 32rpx;
					}
				}
				
				.bio {
					font-size: 24rpx;
					color: #666;
					margin-bottom: 16rpx;
				}
				
				.stats {
					display: flex;
					
					.stat-item {
						font-size: 24rpx;
						color: #999;
						margin-right: 20rpx;
					}
				}
			}
			
			.follow-btn {
				min-width: 140rpx;
				height: 56rpx;
				line-height: 56rpx;
				text-align: center;
				font-size: 24rpx;
				color: #fff;
				background-color: #07c160;
				border-radius: 28rpx;
				padding: 0 30rpx;
				
				&.following {
					background-color: #f5f5f5;
					color: #666;
				}
			}
		}
	}
}
</style> 