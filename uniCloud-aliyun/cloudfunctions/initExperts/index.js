'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const experts = [{
		nickname: '美食达人1',
		avatar: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		bio: '专注美食分享10年，擅长家常菜烹饪',
		isExpert: true,
		verified: true,
		recommendScore: 100,
		followerCount: 1000,
		likeCount: 5000
	}, {
		nickname: '烘焙大师',
		avatar: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		bio: '法国蓝带厨艺学院毕业，专注烘焙教学',
		isExpert: true,
		verified: true,
		recommendScore: 95,
		followerCount: 800,
		likeCount: 4000
	}, {
		nickname: '营养师小王',
		avatar: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		bio: '国家注册营养师，分享健康饮食知识',
		isExpert: true,
		verified: true,
		recommendScore: 90,
		followerCount: 600,
		likeCount: 3000
	}, {
		nickname: '川菜大厨',
		avatar: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		bio: '20年川菜经验，多家米其林餐厅工作经历',
		isExpert: true,
		verified: true,
		recommendScore: 85,
		followerCount: 500,
		likeCount: 2500
	}, {
		nickname: '甜点师贝贝',
		avatar: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		bio: '专注甜点制作，让生活更甜美',
		isExpert: true,
		verified: true,
		recommendScore: 80,
		followerCount: 400,
		likeCount: 2000
	}];
	
	const collection = db.collection('users');
	
	try {
		// 插入达人数据
		const result = await collection.add(experts);
		
		// 创建一些示例帖子
		const posts = [];
		for (let expert of experts) {
			for (let i = 0; i < 5; i++) {
				posts.push({
					title: `${expert.nickname}的美食分享${i + 1}`,
					content: `这是${expert.nickname}分享的第${i + 1}个美食作品，希望大家喜欢！`,
					cover: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
					type: 'recipe',
					userId: result.id,
					status: 1,
					isRecommended: true,
					likes: Math.floor(Math.random() * 1000),
					collections: Math.floor(Math.random() * 500),
					comments: Math.floor(Math.random() * 200)
				});
			}
		}
		
		await db.collection('posts').add(posts);
		
		return {
			code: 0,
			msg: 'success'
		};
	} catch (e) {
		return {
			code: 500,
			msg: e.message
		};
	}
}; 