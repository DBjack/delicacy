<template>
	<view class="ranking">
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
		<post-list :posts="posts" @refresh="loadData"></post-list>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentTab: 0,
				tabs: [
					{ name: '今日', type: 'daily' },
					{ name: '本周', type: 'weekly' },
					{ name: '本月', type: 'monthly' }
				],
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
			switchTab(index) {
				if (this.currentTab === index) return
				this.currentTab = index
				this.loadData()
			},
			async loadData() {
				try {
					const { result } = await uniCloud.callFunction({
						name: 'post',
						data: {
							action: 'getRankingPosts',
							type: this.tabs[this.currentTab].type
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
.ranking {
	min-height: 100vh;
	background-color: #f5f5f5;
	
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
}
</style> 