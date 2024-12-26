"use strict";
const db = uniCloud.database();
const $ = db.command.aggregate;

exports.main = async (event, context) => {
	const { action, data = {} } = event;
	
	switch (action) {
		case 'getDiscoverData':
			return await getDiscoverData(data)
		default:
			return {
				code: 404,
				msg: '未找到对应的操作'
			}
	}
}

// 获取发现页数据
async function getDiscoverData(data) {
	try {
		// 获取热门标签
		const tagsResult = await db.collection('tags')
			.aggregate()
			.match({
				status: 1
			})
			.lookup({
				from: 'posts',
				localField: '_id',
				foreignField: 'tags',
				as: 'posts'
			})
			.project({
				_id: 1,
				name: 1,
				cover: 1,
				count: $.size('$posts')
			})
			.sort({
				count: -1
			})
			.limit(10)
			.end()
			
		// 获取热门帖子
		const postsResult = await db.collection('posts')
			.aggregate()
			.match({
				status: 1
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
				createTime: -1
			})
			.limit(10)
			.end()
			
		return {
			code: 0,
			msg: 'success',
			data: {
				hotTags: tagsResult.data,
				hotPosts: postsResult.data
			}
		}
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		}
	}
}
