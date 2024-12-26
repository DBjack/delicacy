'use strict';
const db = uniCloud.database();

exports.main = async (event, context) => {
	const categories = [{
		name: '家常菜',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 0
	}, {
		name: '烘焙',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 1
	}, {
		name: '饮品',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 2
	}, {
		name: '小吃',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 3
	}, {
		name: '早餐',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 4
	}, {
		name: '午餐',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 5
	}, {
		name: '晚餐',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 6
	}, {
		name: '素食',
		icon: 'https://vkceyugu.cdn.bspapp.com/VKCEYUGU-f184e7c3-1912-41b2-b81f-435d1b37c7b4/1ae87107-2943-4ba6-be2b-390ca27c6260.png',
		sort: 7
	}];
	
	const collection = db.collection('categories');
	
	try {
		// 清空原有数据
		await collection.remove({});
		
		// 插入新数据
		await collection.add(categories);
		
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