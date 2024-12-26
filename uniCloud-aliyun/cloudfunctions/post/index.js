"use strict";

const db = uniCloud.database();
const $ = db.command.aggregate;
const dbCmd = db.command;

exports.main = async (event, context) => {
	const { action, data = {} } = event;
	
	switch (action) {
		case 'getDailyPosts':
			return await getDailyPosts(data);
		case 'getRankingPosts':
			return await getRankingPosts(data);
		case 'getRecipeCategories':
			return await getRecipeCategories(data);
		case 'getRecipePosts':
			return await getRecipePosts(data);
		default:
			return {
				code: 404,
				msg: '未找到对应的操作'
			};
	}
};

// 获取每日推荐帖子
async function getDailyPosts(data) {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const result = await db.collection('posts')
			.aggregate()
			.match({
				status: 1,
				isRecommended: true,
				createTime: dbCmd.gte(today)
			})
			.lookup({
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'author'
			})
			.unwind('$author')
			.project({
				_id: 1,
				title: 1,
				cover: 1,
				content: 1,
				likes: 1,
				collections: 1,
				comments: 1,
				createTime: 1,
				'author._id': 1,
				'author.nickname': 1,
				'author.avatar': 1
			})
			.sort({
				createTime: -1
			})
			.limit(20)
			.end();
		
		return {
			code: 0,
			msg: 'success',
			data: result.data
		};
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		};
	}
}

// 获取排行榜帖子
async function getRankingPosts(data) {
	try {
		const { type = 'daily' } = data;
		const now = new Date();
		let startTime;
		
		switch (type) {
			case 'daily':
				startTime = new Date(now.setHours(0, 0, 0, 0));
				break;
			case 'weekly':
				startTime = new Date(now.setDate(now.getDate() - 7));
				break;
			case 'monthly':
				startTime = new Date(now.setMonth(now.getMonth() - 1));
				break;
			default:
				startTime = new Date(now.setHours(0, 0, 0, 0));
		}
		
		const result = await db.collection('posts')
			.aggregate()
			.match({
				status: 1,
				createTime: dbCmd.gte(startTime)
			})
			.lookup({
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'author'
			})
			.unwind('$author')
			.project({
				_id: 1,
				title: 1,
				cover: 1,
				content: 1,
				likes: 1,
				collections: 1,
				comments: 1,
				createTime: 1,
				'author._id': 1,
				'author.nickname': 1,
				'author.avatar': 1
			})
			.sort({
				likes: -1,
				collections: -1,
				comments: -1
			})
			.limit(50)
			.end();
		
		return {
			code: 0,
			msg: 'success',
			data: result.data
		};
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		};
	}
}

// 获取食谱分类
async function getRecipeCategories(data) {
	try {
		const result = await db.collection('categories')
			.aggregate()
			.match({
				status: 1
			})
			.lookup({
				from: 'posts',
				localField: '_id',
				foreignField: 'categoryId',
				as: 'posts'
			})
			.project({
				_id: 1,
				name: 1,
				icon: 1,
				count: $.size('$posts')
			})
			.sort({
				count: -1
			})
			.end();
		
		return {
			code: 0,
			msg: 'success',
			data: result.data
		};
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		};
	}
}

// 获取食谱帖子
async function getRecipePosts(data) {
	try {
		const { type = 'latest' } = data;
		const match = {
			status: 1,
			type: 'recipe'
		};
		
		const sort = type === 'latest' 
			? { createTime: -1 }
			: { likes: -1, collections: -1, comments: -1 };
		
		const result = await db.collection('posts')
			.aggregate()
			.match(match)
			.lookup({
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'author'
			})
			.unwind('$author')
			.project({
				_id: 1,
				title: 1,
				cover: 1,
				content: 1,
				likes: 1,
				collections: 1,
				comments: 1,
				createTime: 1,
				'author._id': 1,
				'author.nickname': 1,
				'author.avatar': 1
			})
			.sort(sort)
			.limit(20)
			.end();
		
		return {
			code: 0,
			msg: 'success',
			data: result.data
		};
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		};
	}
}
